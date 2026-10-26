// src/dev/PanelAudit.jsx — panel pemeriksa tampilan, hanya saat pengembangan.
//
// HANYA DIPASANG DI DEV. App.jsx membungkusnya dengan `import.meta.env.DEV`,
// yang diganti konstanta `false` saat build sehingga seluruh berkas ini — dan
// seluruh folder src/dev/ — dibuang dari bundel produksi. Jangan pernah
// mengimpornya dari kode yang ikut terkirim ke pengguna.
//
// KENAPA PANEL MELAYANG, BUKAN HALAMAN TERSENDIRI. Sebuah halaman audit hanya
// bisa memeriksa dirinya sendiri. Yang dibutuhkan justru memeriksa halaman yang
// sedang dibuka — termasuk saat modal terbuka, tabel terisi, atau ponsel sedang
// menampilkan keadaan yang sulit ditiru. Panel ini ikut ke mana pun.
//
// Dibuka dengan tombol melayang di pojok, atau Ctrl/Cmd + Shift + U.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PEMERIKSA, jalankanSemua } from "./audit/pemeriksa";

const WARNA_PARAH = {
  tinggi: "#ff6b57",
  sedang: "#e8b23a",
  rendah: "#6aab82",
};

const KUNCI_TERPILIH = "gjr_audit_pemeriksa";

export default function PanelAudit() {
  const [buka, setBuka] = useState(false);
  const [hasil, setHasil] = useState(null);
  const [sibuk, setSibuk] = useState(false);
  // Elemen yang sedang disorot hidup di ref: menyorot berarti mengubah style
  // elemen DOM, dan nilai yang berasal dari state tidak boleh diubah.
  // `sorotKe` hanya penanda baris mana yang aktif di daftar.
  const sorotRef = useRef(null);
  const [sorotKe, setSorotKe] = useState(null);
  const [terpilih, setTerpilih] = useState(() => {
    try {
      const t = JSON.parse(localStorage.getItem(KUNCI_TERPILIH) || "null");
      return Array.isArray(t) ? t : PEMERIKSA.map((p) => p.id);
    } catch {
      return PEMERIKSA.map((p) => p.id);
    }
  });

  const jalankan = useCallback(() => {
    setSibuk(true);
    // Ditunda satu frame supaya keadaan "memeriksa…" sempat tergambar; tanpa
    // itu, pemeriksaan yang berat membekukan panel tanpa tanda apa pun.
    requestAnimationFrame(() => {
      setHasil({ waktu: new Date(), jalur: location.pathname, daftar: jalankanSemua(terpilih) });
      setSibuk(false);
    });
  }, [terpilih]);

  useEffect(() => {
    const tekan = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "u") {
        e.preventDefault();
        setBuka((v) => !v);
      }
    };
    addEventListener("keydown", tekan);
    return () => removeEventListener("keydown", tekan);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KUNCI_TERPILIH, JSON.stringify(terpilih));
    } catch { /* penyimpanan diblokir; pilihan cukup berlaku sesi ini */ }
  }, [terpilih]);

  // Menyorot elemen bermasalah langsung di halaman. Memakai outline, bukan
  // border: border menggeser tata letak, dan menggeser tata letak saat sedang
  // memeriksa tata letak akan mengubah hal yang sedang diukur.
  useEffect(() => {
    const el = sorotRef.current;
    if (!el) return;
    const simpan = el.style.outline;
    const simpanOffset = el.style.outlineOffset;
    el.style.outline = "3px solid #ff6b57";
    el.style.outlineOffset = "2px";
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    return () => {
      el.style.outline = simpan;
      el.style.outlineOffset = simpanOffset;
    };
  }, [sorotKe]);

  const ringkas = useMemo(() => {
    if (!hasil) return null;
    const semua = hasil.daftar.flatMap((d) => d.temuan);
    return {
      total: semua.length,
      tinggi: semua.filter((t) => t.parah === "tinggi").length,
      sedang: semua.filter((t) => t.parah === "sedang").length,
      rendah: semua.filter((t) => t.parah === "rendah").length,
    };
  }, [hasil]);

  const salin = () => {
    if (!hasil) return;
    const baris = [`# Audit tampilan — ${hasil.jalur} — ${hasil.waktu.toLocaleString("id-ID")}`];
    baris.push(`Layar ${innerWidth}x${innerHeight}, ${ringkas.total} temuan`, "");
    for (const d of hasil.daftar) {
      if (!d.temuan.length && !d.galat) continue;
      baris.push(`## ${d.nama} (${d.temuan.length})`);
      if (d.galat) baris.push(`  GALAT PEMERIKSA: ${d.galat}`);
      for (const t of d.temuan.slice(0, 40)) {
        baris.push(`  [${t.parah}] ${t.pesan} — "${t.nama}"${t.detail ? ` (${t.detail})` : ""}`);
        baris.push(`         ${t.jalur}`);
      }
      if (d.temuan.length > 40) baris.push(`  … ${d.temuan.length - 40} lagi`);
      baris.push("");
    }
    navigator.clipboard?.writeText(baris.join("\n"));
  };

  const gaya = {
    tombol: {
      position: "fixed", right: 12, bottom: 76, zIndex: 2147483000,
      width: 44, height: 44, borderRadius: 12, border: "1px solid #ffffff33",
      background: "#0e2a21", color: "#f6f3ea", fontSize: 11, fontWeight: 700,
      cursor: "pointer", boxShadow: "0 4px 16px -4px rgba(0,0,0,.5)",
    },
    panel: {
      position: "fixed", inset: "auto 8px 8px 8px", maxHeight: "72vh", zIndex: 2147483000,
      background: "#0e2a21", color: "#f6f3ea", border: "1px solid #ffffff22",
      borderRadius: 14, display: "flex", flexDirection: "column",
      fontFamily: "ui-monospace, monospace", fontSize: 12,
      boxShadow: "0 12px 40px -8px rgba(0,0,0,.6)",
    },
  };

  if (!buka) {
    return createPortal(
      <button style={gaya.tombol} onClick={() => setBuka(true)} title="Audit tampilan (Ctrl+Shift+U)">
        UI
      </button>,
      document.body
    );
  }

  return createPortal(
    <div style={gaya.panel} data-audit-abaikan>
      <header style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderBottom: "1px solid #ffffff1a" }}>
        <strong style={{ fontSize: 12 }}>Audit Tampilan</strong>
        <span style={{ opacity: 0.6, fontSize: 11 }}>
          {innerWidth}×{innerHeight}
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <button onClick={jalankan} disabled={sibuk} style={tombolKecil("#2f6e51")}>
            {sibuk ? "memeriksa…" : "Periksa"}
          </button>
          {hasil && <button onClick={salin} style={tombolKecil("#3a3a3a")}>Salin</button>}
          <button onClick={() => setBuka(false)} style={tombolKecil("#3a3a3a")}>Tutup</button>
        </div>
      </header>

      <div style={{ padding: "8px 12px", borderBottom: "1px solid #ffffff1a", display: "flex", flexWrap: "wrap", gap: 6 }}>
        {PEMERIKSA.map((p) => {
          const aktif = terpilih.includes(p.id);
          return (
            <button
              key={p.id}
              title={p.keterangan}
              onClick={() =>
                setTerpilih((t) => (aktif ? t.filter((x) => x !== p.id) : [...t, p.id]))
              }
              style={{
                ...tombolKecil(aktif ? "#2f6e51" : "transparent"),
                border: `1px solid ${aktif ? "#2f6e51" : "#ffffff33"}`,
                opacity: aktif ? 1 : 0.55,
              }}
            >
              {p.nama}
            </button>
          );
        })}
      </div>

      {ringkas && (
        <div style={{ padding: "8px 12px", display: "flex", gap: 12, borderBottom: "1px solid #ffffff1a" }}>
          <span><strong>{ringkas.total}</strong> temuan</span>
          {["tinggi", "sedang", "rendah"].map((p) => (
            <span key={p} style={{ color: WARNA_PARAH[p] }}>
              {ringkas[p]} {p}
            </span>
          ))}
          <span style={{ marginLeft: "auto", opacity: 0.5 }}>{hasil.jalur}</span>
        </div>
      )}

      <div style={{ overflowY: "auto", padding: "4px 0 10px" }}>
        {!hasil && (
          <p style={{ padding: "16px 12px", opacity: 0.6, lineHeight: 1.6 }}>
            Tekan <strong>Periksa</strong> untuk memeriksa halaman yang sedang terbuka.
            Pilih pemeriksaan di atas untuk mempersempit. Pintasan: Ctrl/Cmd + Shift + U.
          </p>
        )}
        {hasil?.daftar.map((d) => (
          <section key={d.id} style={{ padding: "6px 12px" }}>
            <h4 style={{ margin: "6px 0 4px", fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", opacity: d.temuan.length ? 1 : 0.4 }}>
              {d.nama} — {d.galat ? "GALAT" : d.temuan.length === 0 ? "bersih" : d.temuan.length}
            </h4>
            {d.galat && <p style={{ color: WARNA_PARAH.tinggi, margin: 0 }}>{d.galat}</p>}
            {d.temuan.slice(0, 25).map((t, i) => (
              <button
                key={i}
                onClick={() => { sorotRef.current = t.el; setSorotKe(`${d.id}-${i}`); }}
                style={{
                  display: "block", width: "100%", textAlign: "left", cursor: "pointer",
                  background: sorotKe === `${d.id}-${i}` ? "#ffffff14" : "transparent", border: "none",
                  color: "inherit", padding: "5px 6px", borderRadius: 6, fontSize: 11,
                  borderLeft: `3px solid ${WARNA_PARAH[t.parah]}`, marginBottom: 2,
                }}
              >
                <span style={{ color: WARNA_PARAH[t.parah] }}>{t.pesan}</span>
                {t.nama && <span style={{ opacity: 0.8 }}> — “{t.nama}”</span>}
                {t.detail && <div style={{ opacity: 0.5, fontSize: 10 }}>{t.detail}</div>}
                <div style={{ opacity: 0.35, fontSize: 10 }}>{t.jalur}</div>
              </button>
            ))}
            {d.temuan.length > 25 && (
              <p style={{ opacity: 0.5, fontSize: 10, margin: "4px 6px" }}>
                … {d.temuan.length - 25} temuan lain (pakai Salin untuk daftar penuh)
              </p>
            )}
          </section>
        ))}
      </div>
    </div>,
    document.body
  );
}

function tombolKecil(latar) {
  return {
    background: latar, color: "#f6f3ea", border: "1px solid #ffffff22",
    borderRadius: 8, padding: "4px 9px", fontSize: 11, cursor: "pointer",
    fontFamily: "inherit",
  };
}
