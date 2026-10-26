import { useModalBehavior } from "../lib/useModalBehavior";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Html5Qrcode } from "html5-qrcode";
import { X, XCircle, ScanLine, Camera, Loader2, RefreshCw, SwitchCamera } from "lucide-react";

const SCANNER_ELEMENT_ID = "camera-scan-region";

// Ambil ID pohon dari URL hasil decode QR.
// Contoh: "https://giricahyo.id/pohon/GJR-002-001" -> "GJR-002-001"
// Juga menerima ID mentah tanpa URL.
function extractTreeId(raw) {
  if (!raw) return null;
  if (raw.includes("/pohon/")) {
    return raw.split("/pohon/")[1]?.split(/[?#]/)[0]?.trim() || null;
  }
  return raw.trim();
}

// Pilih kamera belakang dari daftar yang tersedia.
//
// MENCOCOKKAN LABEL ITU RAPUH, dan sudah terbukti gagal di iPhone: Safari
// menerjemahkan label kameranya mengikuti bahasa perangkat ("Kamera Belakang"
// pada ponsel berbahasa Indonesia), dan sebelum izin diberikan label itu bisa
// KOSONG sama sekali. Pola bahasa Inggris saja tidak pernah cocok, lalu jatuh
// ke cameras[0] — yang di iPhone adalah kamera DEPAN. Pengguna melihat wajahnya
// sendiri saat hendak memindai QR di batang pohon.
//
// Jalur utama pemilihan kamera sekarang adalah constraint facingMode di
// startCamera(); fungsi ini hanya cadangan ketika constraint itu ditolak.
const KATA_BELAKANG = /back|rear|environment|belakang|arrière|trasera|traseira|rück/i;
const KATA_DEPAN = /front|user|depan|face|frontal/i;

function pickCamera(cameras) {
  if (!cameras || cameras.length === 0) return null;
  const belakang = cameras.find((c) => KATA_BELAKANG.test(c.label || ""));
  if (belakang) return belakang;
  // Kalau tidak ada yang jelas-jelas belakang, setidaknya HINDARI yang
  // jelas-jelas depan — lebih baik daripada asal mengambil yang pertama.
  const bukanDepan = cameras.find((c) => !KATA_DEPAN.test(c.label || ""));
  return bukanDepan ?? cameras[0];
}

// Terjemahkan pesan error teknis browser ke bahasa yang mudah dipahami
function friendlyError(err) {
  const msg = String(err?.message ?? err ?? "").toLowerCase();

  // DIPERIKSA PALING AWAL, sebelum menebak dari teks galatnya.
  //
  // Kamera hanya disediakan peramban di secure context. Satu-satunya
  // pengecualian adalah localhost — alamat LAN lewat http:// (mis.
  // http://192.168.1.5:5173, yang dipakai saat menguji di ponsel) dianggap
  // tidak aman, sehingga navigator.mediaDevices TIDAK ADA sama sekali.
  //
  // Bedanya penting: ini bukan izin yang ditolak, melainkan API yang tidak
  // disediakan. Kotak izin tidak akan pernah muncul, jadi pesan "pastikan izin
  // kamera sudah diberikan" menyuruh pengguna memperbaiki sesuatu yang tidak
  // bisa diperbaiki dari situ — dan membuatnya mengira perangkatnya rusak.
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    return (
      "Kamera butuh koneksi aman (HTTPS). Halaman ini dibuka lewat alamat biasa, " +
      "jadi peramban menutup akses kamera — bukan karena izin, dan tidak bisa " +
      "diaktifkan dari pengaturan. Buka lewat alamat https://, atau langsung di " +
      "komputer lewat localhost."
    );
  }

  if (msg.includes("notallowed") || msg.includes("permission denied")) {
    return "Izin kamera ditolak. Klik ikon kunci/kamera di address bar browser → pilih 'Izinkan' → tutup modal dan coba lagi.";
  }
  if (msg.includes("notfound") || msg.includes("device not found") || msg.includes("no cameras")) {
    return "Kamera tidak ditemukan di perangkat ini. Pastikan kamera terpasang dan tidak digunakan aplikasi lain.";
  }
  if (msg.includes("notreadable") || msg.includes("could not start video")) {
    return "Kamera sedang dipakai aplikasi lain (misal: Zoom, Teams, atau tab browser lain). Tutup aplikasi tersebut, lalu coba lagi.";
  }
  if (msg.includes("overconstrained") || msg.includes("constraint")) {
    return "Konfigurasi kamera tidak didukung perangkat ini. Coba klik Coba Lagi.";
  }
  return "Tidak bisa membuka kamera. Pastikan izin kamera sudah diberikan di browser.";
}

/**
 * Membongkar instance html5-qrcode tanpa pernah melempar.
 *
 * KENAPA SE-DEFENSIF INI. stop() pada pustaka ini MELEMPAR SECARA SINKRON
 * ketika pemindai sudah berhenti — dan yang dilempar sebuah STRING, bukan
 * Error. Dua sifat itu bergabung jadi kegagalan yang membingungkan:
 *
 *   - Lemparan sinkron di dalam pembersihan useEffect tidak tertangkap oleh
 *     .catch() pada rantai Promise, naik ke React, dan memunculkan layar
 *     ErrorBoundary padahal pengguna hanya menekan Batal.
 *   - Karena yang dilempar string, ia tidak punya .message, sehingga kotak
 *     pesan di layar galat itu tampil KOSONG dan tidak membantu siapa pun.
 *
 * Dipanggil dari banyak tempat (tutup, coba lagi, balik kamera, pembersihan
 * effect) yang bisa saling mendahului, jadi berhenti dua kali harus dianggap
 * wajar — bukan kondisi galat.
 */
async function bongkarPemindai(inst) {
  if (!inst) return;
  try { await inst.stop(); } catch { /* sudah berhenti atau belum sempat jalan */ }
  try { await inst.clear(); } catch { /* DOM-nya memang sudah bersih */ }
}

// Kotak pindai PERSEGI, dihitung dari ukuran viewfinder yang benar-benar
// dipakai html5-qrcode. Didefinisikan di luar komponen supaya effect kamera
// dan gantiKamera memakai konfigurasi yang sama persis.
const qrboxPersegi = (lebarView, tinggiView) => {
  const sisi = Math.floor(Math.min(lebarView, tinggiView) * 0.7);
  return { width: sisi, height: sisi };
};

export default function CameraScanModal({ onResult, onClose }) {
  const panelRef = useModalBehavior(true, onClose);
  // "starting" → sedang enumerate/inisialisasi
  // "scanning" → kamera aktif, sedang scan
  // "error"    → gagal, tampilkan pesan + tombol retry
  const [phase, setPhase]     = useState("starting");
  const [errMsg, setErrMsg]   = useState("");
  const [retryKey, setRetryKey] = useState(0); // increment = mount ulang effect

  const scannerRef   = useRef(null);
  const containerRef = useRef(null);

  // Sisi kamera yang dipakai: "environment" (belakang) atau "user" (depan).
  //
  // MEMAKAI facingMode, BUKAN DAFTAR deviceId. iPhone mendaftarkan SETIAP
  // LENSA FISIK sebagai kamera terpisah — ultra-lebar 0,5x, normal 1x, tele —
  // sehingga tombol yang menyusuri daftar itu berpindah antar lensa dulu
  // sebelum akhirnya sampai ke kamera depan. Yang diharapkan pengguna adalah
  // membalik sisi, bukan menjelajah lensa.
  //
  // facingMode menyerahkan pemilihan lensa ke sistem, dan sistem selalu
  // memberi lensa NORMAL untuk tiap sisi — persis yang diminta.
  const menghadap = useRef("environment");
  // Mencegah dua penggantian kamera berjalan bersamaan saat tombol ditekan
  // berkali-kali — balapan itulah yang dulu menumpuk elemen video.
  const sedangGanti = useRef(false);
  const [daftarKamera, setDaftarKamera] = useState([]);

  useEffect(() => {
    let cancelled = false;

    setPhase("starting");
    setErrMsg("");

    async function startCamera() {
      // ── 1. Enumerate semua kamera yang tersedia ──────────────────────────
      let cameras;
      try {
        cameras = await Html5Qrcode.getCameras();
      } catch (err) {
        if (cancelled) return;
        setErrMsg(friendlyError(err));
        setPhase("error");
        return;
      }

      if (!cameras || cameras.length === 0) {
        if (cancelled) return;
        setErrMsg(friendlyError(new Error("no cameras found")));
        setPhase("error");
        return;
      }

      if (!cancelled) setDaftarKamera(cameras);
      const chosen = pickCamera(cameras);

      // ── 2. Kotak pindai: PERSEGI, dihitung dari viewfinder yang sebenarnya ──
      //
      // Sebelumnya ukurannya dihitung dari lebar container lalu dikirim sebagai
      // angka tetap, DAN aspectRatio dipaksa 1.0. Di ponsel kamera jarang bisa
      // memenuhi permintaan 1:1, jadi video yang tampil tetap potret sementara
      // overlay digambar memakai koordinat video — hasilnya kotak pindai
      // berbentuk persegi panjang melintang, tidak menyerupai QR sama sekali
      // dan menyesatkan soal area mana yang sebenarnya dibaca.
      //
      // Bentuk fungsi menerima ukuran viewfinder yang BENAR-BENAR dipakai,
      // sehingga sisinya selalu sama panjang berapa pun rasio kameranya.


      // ── 3. Buat instance dan mulai scan dengan device ID konkret ─────────
      //   Menggunakan device ID (bukan facingMode constraint) adalah cara
      //   paling aman — tidak ada constraint yang bisa ditolak browser.
      // JARING PENGAMAN terhadap video bertumpuk.
      //
      // Pembongkaran html5-qrcode berjalan ASINKRON (stop() mengembalikan
      // Promise), sementara effect ini langsung dijalankan ulang begitu
      // retryKey berubah — misalnya saat pengguna menekan Ganti Kamera. Jadi
      // instance baru bisa lahir sementara yang lama belum selesai membersihkan
      // diri, dan keduanya menyisipkan <video> ke elemen yang sama.
      //
      // Mengosongkan elemen di sini membuat keadaan awal selalu pasti, tidak
      // bergantung pada siapa yang menang balapan.
      const wadah = document.getElementById(SCANNER_ELEMENT_ID);
      if (wadah) wadah.innerHTML = "";

      const instance = new Html5Qrcode(SCANNER_ELEMENT_ID, { verbose: false });
      scannerRef.current = instance;

      // Kamera belakang diminta lewat CONSTRAINT, bukan lewat ID hasil tebakan
      // label. iOS menghormati facingMode dengan andal, dan ini satu-satunya
      // cara yang tidak bergantung pada teks label yang bisa kosong atau
      // diterjemahkan. Kalau ditolak, baru jatuh ke ID pilihan pickCamera().
      const sumberKamera = { facingMode: { exact: menghadap.current } };

      try {
        await instance.start(
          sumberKamera,
          {
            fps: 10,
            qrbox: qrboxPersegi,
          },
          (decodedText) => {
            if (cancelled) return;
            const treeId = extractTreeId(decodedText);
            if (treeId) onResult(treeId);
          },
          () => {
            // Tiap frame yang belum ada QR-nya — bukan error, abaikan.
          }
        );

        // start() baru selesai SEKARANG, dan html5-qrcode menyisipkan
        // videonya pada saat itu juga. Kalau effect ini sudah dibatalkan
        // (StrictMode menjalankan effect dua kali saat pengembangan), video
        // tersebut menyusul SETELAH wadah dikosongkan oleh jalannya yang
        // kedua — dan tertinggal menumpuk. Pembersihan effect tidak bisa
        // menangkapnya karena ia sudah berjalan lebih dulu.
        if (cancelled) {
          await bongkarPemindai(instance);
          return;
        }
        setPhase("scanning");
      } catch (err) {
        if (cancelled) return;

        // facingMode "exact" DITOLAK kalau perangkat tidak punya kamera
        // belakang — laptop, misalnya. Jatuh ke ID hasil pickCamera() supaya
        // pemindai tetap jalan, bukan gagal total hanya karena kamera
        // belakangnya memang tidak ada.
        const bolehCadangan = menghadap.current === "environment" && chosen?.id;
        if (bolehCadangan) {
          try {
            await instance.start(
              chosen.id,
              { fps: 10, qrbox: qrboxPersegi },
              (decodedText) => {
                if (cancelled) return;
                const treeId = extractTreeId(decodedText);
                if (treeId) onResult(treeId);
              },
              () => {}
            );
            if (cancelled) {
              await bongkarPemindai(instance);
              return;
            }
            setPhase("scanning");
            return;
          } catch {
            // Cadangan ikut gagal — lanjut ke penanganan galat di bawah.
          }
        }

        setErrMsg(friendlyError(err));
        setPhase("error");
        console.error("[CameraScanModal] Gagal start kamera:", err);
      }
    }

    startCamera();

    // Cleanup: matikan kamera saat modal ditutup atau retry
    return () => {
      cancelled = true;
      const inst = scannerRef.current;
      // TANPA syarat isScanning. Instance yang masih DALAM PROSES memulai
      // sudah menyisipkan elemen video ke DOM, tapi isScanning-nya belum true
      // — dengan syarat itu, video tersebut tidak pernah dibersihkan dan
      // tertinggal menumpuk di bawah video berikutnya.
      scannerRef.current = null;
      bongkarPemindai(inst);
    };
  }, [retryKey]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Pindah ke kamera berikutnya TANPA me-remount apa pun.
   *
   * Versi sebelumnya menaikkan retryKey supaya effect kamera berjalan ulang.
   * Itu sumber dua kerusakan sekaligus:
   *
   *   - stop() DIPANGGIL DUA KALI pada instance yang sama — sekali di sini,
   *     sekali lagi oleh pembersihan effect yang ikut terpicu — dan panggilan
   *     kedua melempar galat.
   *   - Pembongkaran html5-qrcode asinkron, sementara effect berjalan ulang
   *     seketika, jadi instance baru menyisipkan <video> sebelum yang lama
   *     sempat membuang miliknya. Hasilnya video bertumpuk.
   *
   * Memakai ulang satu instance menghapus kedua sebab itu: html5-qrcode boleh
   * di-start() lagi setelah stop() selesai, dan urutannya dijamin karena
   * keduanya ditunggu di dalam satu fungsi async yang sama.
   */
  async function gantiKamera() {
    if (sedangGanti.current) return;
    sedangGanti.current = true;

    // MEMBALIK SISI, bukan menyusuri daftar lensa. iPhone mendaftarkan tiap
    // lensa belakang (0,5x, 1x, tele) sebagai kamera tersendiri, jadi
    // menyusuri daftar itu membuat pengguna melewati beberapa lensa sebelum
    // sampai ke kamera depan. facingMode menyerahkan pemilihan lensa ke
    // sistem, yang selalu memberi lensa normal untuk sisi yang diminta.
    menghadap.current = menghadap.current === "environment" ? "user" : "environment";

    const inst = scannerRef.current;
    setPhase("starting");
    setErrMsg("");

    try {
      if (inst) {
        await bongkarPemindai(inst);
      }

      const wadah = document.getElementById(SCANNER_ELEMENT_ID);
      if (wadah) wadah.innerHTML = "";

      const baru = new Html5Qrcode(SCANNER_ELEMENT_ID, { verbose: false });
      scannerRef.current = baru;

      await baru.start(
        { facingMode: { exact: menghadap.current } },
        { fps: 10, qrbox: qrboxPersegi },
        (decodedText) => {
          const treeId = extractTreeId(decodedText);
          if (treeId) onResult(treeId);
        },
        () => {}
      );
      setPhase("scanning");
    } catch (err) {
      setErrMsg(friendlyError(err));
      setPhase("error");
      console.error("[CameraScanModal] Gagal ganti kamera:", err);
    } finally {
      sedangGanti.current = false;
    }
  }

  function handleClose() {
    const inst = scannerRef.current;
    // Dikosongkan SEBELUM onClose(). Tanpa ini, pembersihan effect yang
    // terpicu oleh pembongkaran modal akan menghentikan instance yang sama
    // untuk kedua kalinya.
    scannerRef.current = null;
    bongkarPemindai(inst);
    onClose();
  }

  function handleRetry() {
    // Bersihkan instance lama sebelum mount ulang
    const inst = scannerRef.current;
    scannerRef.current = null;
    bongkarPemindai(inst);
    setRetryKey((k) => k + 1);
  }

  // Diportal ke document.body: tombol pemicu (ScanBarcodeButton) hidup di
  // dalam <header> Topbar yang punya backdrop-blur. backdrop-filter (sama
  // seperti transform/filter) membuat elemen itu jadi containing block baru
  // untuk descendant position:fixed — jadi "fixed inset-0" di sini tadinya
  // dihitung relatif terhadap kotak header setinggi 64px, BUKAN viewport,
  // dan modal muncul terjepit di pojok kiri-atas alih-alih memenuhi layar.
  // Portal melewati rantai DOM itu sepenuhnya.
  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      className="gjr-overlay-in fixed inset-0 bg-forest-950/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="bg-surface rounded-3xl max-w-sm w-full max-h-[90vh] shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        {/* shrink-0: tetap terlihat di atas walau body di bawahnya di-scroll —
            sebelumnya seluruh kartu (header + area kamera + tombol) dipaksa
            satu blok items-center tanpa scroll, jadi di layar pendek header
            ini malah terdorong ke luar viewport ke atas, tersembunyi. */}
        <div className="bg-forest-900 text-cream-50 px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="bg-gold-500/20 rounded-lg p-1.5">
              <ScanLine size={14} className="text-gold-400" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">Scan Barcode Pohon</p>
              <p className="text-[10px] text-cream-50/75 leading-tight mt-0.5">
                {phase === "starting" && "Menginisialisasi kamera…"}
                {phase === "scanning" && "Kamera aktif — arahkan ke QR code"}
                {phase === "error"    && "Kamera tidak dapat diakses"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-cream-50/50 hover:text-cream-50 transition-colors p-1 -mr-1 rounded-lg hover:bg-cream-50/10"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          <p className="text-xs text-ink-muted mb-3 leading-relaxed">
            Arahkan kamera ke QR code yang tertempel pada pohon.
            Browser akan meminta izin akses kamera saat pertama kali.
          </p>

          {/* ── Area kamera ──────────────────────────────────────────────── */}
          {/* PENTING: div ini TIDAK boleh punya overflow-hidden karena      */}
          {/* html5-qrcode menginject elemen video yang perlu visible.       */}
          {/* Gunakan rounded + clip-path jika mau efek rounded corner.      */}
          {/* TINGGI MENGIKUTI VIDEO, bukan dipaksa persegi.
              Dulu kelasnya `aspect-square`, dan itulah yang membuat kotak
              pindai tampak melintang. Hitungannya begini: kamera ponsel
              memberi video POTRET (mis. 720x1280) dan qrbox memang persegi
              504x504 di koordinat video — tapi wadah persegi memipihkan video
              itu, lebar diskalakan 0,42 sementara tinggi 0,23. Kotak persegi
              pun ikut terpipihkan jadi sekitar 210x118.
              Yang salah bukan ukuran kotaknya, melainkan wadah yang memaksa
              bentuk. Dengan tinggi yang mengikuti video, skala kedua sumbu
              sama dan kotaknya tampil persegi seperti bentuk QR aslinya. */}
          <div
            ref={containerRef}
            className="relative bg-forest-950 w-full min-h-[240px] rounded-xl"
            style={{ overflow: "hidden" }}
          >
            {/* Target html5-qrcode — ID harus match SCANNER_ELEMENT_ID     */}
            {/* dan harus sudah ada di DOM sebelum .start() dipanggil.       */}
            {/* `contain: strict` DIBUANG: ia membuat elemen mengabaikan     */}
            {/* ukuran isinya, sehingga video tidak bisa menentukan tinggi    */}
            {/* wadah dan rasionya kembali melenceng.                        */}
            <div
              key={retryKey}
              id={SCANNER_ELEMENT_ID}
              className="w-full gjr-pemindai"
            />

            {/* Overlay: Spinner saat starting */}
            {phase === "starting" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-forest-950 pointer-events-none">
                <div className="relative flex items-center justify-center">
                  <Camera size={32} className="text-forest-600" />
                  <Loader2
                    size={56}
                    className="absolute text-gold-500/50 animate-spin"
                    strokeWidth={1.5}
                  />
                </div>
                <p className="text-cream-50/50 text-xs">Memulai kamera…</p>
              </div>
            )}

            {/* Overlay: Error */}
            {phase === "error" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-forest-950 px-5 text-center pointer-events-none">
                <XCircle size={32} className="text-clay-500 shrink-0" />
                <p className="text-cream-50/70 text-xs leading-relaxed">{errMsg}</p>
              </div>
            )}

            {/* Corner guides — hanya tampil saat scan aktif */}
            {phase === "scanning" && (
              <>
                <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-gold-400 rounded-tl pointer-events-none" />
                <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-gold-400 rounded-tr pointer-events-none" />
                <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-gold-400 rounded-bl pointer-events-none" />
                <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-gold-400 rounded-br pointer-events-none" />
                {/* Garis scan animasi */}
                <div
                  className="absolute inset-x-8 h-0.5 bg-gold-400/60 rounded-full pointer-events-none"
                  style={{ animation: "scanline 2s ease-in-out infinite" }}
                />
              </>
            )}
          </div>

          {/* Pesan error + tombol retry di bawah area kamera */}
          {phase === "error" && (
            <div className="mt-4 flex items-start gap-2 bg-bad-soft text-bad text-xs rounded-xl p-3 leading-relaxed">
              <XCircle size={14} className="shrink-0 mt-0.5" />
              <p>{errMsg}</p>
            </div>
          )}

          {/* Tombol aksi */}
          <div className="mt-4 flex gap-2">
            {phase === "error" && (
              <button
                onClick={handleRetry}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold bg-forest-900 hover:bg-forest-800 text-cream-50 transition-colors"
              >
                <RefreshCw size={13} />
                Coba Lagi
              </button>
            )}
            {/* GANTI KAMERA. Pemilihan otomatis sudah jauh lebih andal sejak
                memakai constraint facingMode, tapi ia tetap tebakan: sebagian
                ponsel punya tiga kamera belakang (lebar, ultra-lebar, tele),
                dan yang terpilih belum tentu yang paling mudah memfokus QR
                dari jarak dekat. Tanpa tombol ini, pengguna yang mendapat
                kamera keliru tidak punya jalan keluar sama sekali. */}
            {daftarKamera.length > 1 && phase !== "error" && (
              <button
                onClick={gantiKamera}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium text-ink-muted bg-surface-sub hover:bg-surface-hover transition-colors border border-line"
              >
                <SwitchCamera size={13} />
                Balik Kamera
              </button>
            )}
            <button
              onClick={handleClose}
              className="flex-1 py-2.5 rounded-xl text-xs font-medium text-ink-muted bg-surface-sub hover:bg-surface-hover transition-colors border border-line"
            >
              Batal
            </button>
          </div>
        </div>
      </div>

      {/* Keyframe animasi garis scan */}
      <style>{`
        @keyframes scanline {
          0%   { top: 18%; }
          50%  { top: 76%; }
          100% { top: 18%; }
        }
      `}</style>
    </div>,
    document.body
  );
}
