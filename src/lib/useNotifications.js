// src/lib/useNotifications.js
//
// Dua sumber, digabung di sini.
//
// (1) TURUNAN — disimpulkan dari data yang sudah ada di GET /trees: pohon
//     berkondisi buruk, pohon yang lama tidak diperbarui, dana masuk terbaru,
//     sertifikat mendekati habis. Sifatnya keadaan: selama pohonnya masih
//     buruk, notifikasinya tetap ada.
//
// (2) SERVER — baris nyata dari GET /notifications, ditambahkan ketika alur
//     laporan lapangan dibuat. Sifatnya peristiwa: "laporan Anda disetujui"
//     terjadi sekali, dan harus tetap terbaca meski keadaannya sudah berubah.
//     Komentar versi sebelumnya di sini memang sudah memperkirakan endpoint
//     ini akan ada; ia ditambahkan, bukan menggantikan yang turunan, karena
//     keduanya menjawab pertanyaan berbeda.
//
// Status "sudah dibaca" ikut dua jalur: yang turunan disimpan di localStorage
// (tidak ada barisnya di basis data untuk ditandai), yang dari server ditandai
// lewat PATCH supaya konsisten antar perangkat.

import { useMemo, useState, useEffect } from "react";
import { useApi } from "./useApi.jsx";
import { useAuth } from "./AuthContext";
import { treeApi, carbonFundApi, adoptionApi, notificationApi } from "./api";
import { getCertificateLifecycle } from "./basicCarbon";

const STALE_DAYS = 90;
// Ambang "segera habis" yang dipakai memanggil endpoint expiring. Sedikit
// lebih longgar dari ambang tampilan (3 hari) supaya sertifikat yang baru
// saja lewat masih ikut terbawa.
const CERT_SOON_DAYS = 7;
const RECENT_INCOME_DAYS = 30;
const READ_KEY = "gjr_notif_read";

// Tanggal N hari lalu dalam bentuk YYYY-MM-DD, untuk saringan di server.
function tanggalSejak(hari) {
  return new Date(Date.now() - hari * 86400000).toISOString().slice(0, 10);
}

function daysSince(dateLike) {
  if (!dateLike) return Infinity;
  const then = new Date(dateLike);
  if (Number.isNaN(then.getTime())) return Infinity;
  return Math.floor((Date.now() - then.getTime()) / 86400000);
}

export function useNotifications() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // treeApi.map(), bukan list(). Lonceng ini hidup di Topbar, jadi ia berjalan
  // di SETIAP halaman — dan dengan list() itu berarti mengunduh seluruh
  // inventaris (53 KB pada 179 pohon, 5,8 MB pada 20.000) di tiap kali buka
  // halaman, padahal yang dibacanya cuma id, health_status, dan last_updated.
  const { data: trees, loading } = useApi(() => treeApi.map());

  // /carbon-fund/income dan /adoptions memang HANYA untuk admin. Sebelumnya
  // keduanya tetap dipanggil untuk semua peran, jadi setiap petani/buyer
  // memicu dua request 403 di SETIAP halaman (lonceng ini hidup di Topbar) —
  // kegagalannya tertelan diam-diam sehingga tidak pernah terlihat selain
  // sebagai deretan error merah di console.
  //
  // Polanya sama dengan SearchPalette.jsx: kalau tidak berhak, jangan
  // memanggil sama sekali, bukan memanggil lalu mengabaikan errornya.
  // Keduanya DISARING DI SERVER, bukan ditarik utuh lalu disaring di sini.
  //
  // Lonceng ini hidup di Topbar, jadi ia berjalan di setiap halaman. Dulu ia
  // menarik SELURUH tabel pemasukan dan SELURUH tabel adopsi setiap kali —
  // dua tabel yang tumbuh seumur hidup koperasi dan tidak pernah menyusut —
  // lalu membuang hampir semuanya di baris filter di bawah.
  const { data: income } = useApi(
    // Tanggalnya dihitung DI DALAM pemanggil, bukan saat render: Date.now()
    // tidak murni, dan memanggilnya saat render membuat hasilnya berubah
    // tiap kali komponen kebetulan dirender ulang.
    () => (isAdmin ? carbonFundApi.income({ dari: tanggalSejak(RECENT_INCOME_DAYS) }) : Promise.resolve([])),
    [isAdmin]
  );

  // CERT_SOON_DAYS, bukan seluruh adopsi: endpoint expiring sudah menyaring
  // berdasarkan expires_at, dan nilai lewat (sudah telanjur habis) ikut
  // terbawa karena syaratnya `<=` batas.
  const { data: dataExpiring } = useApi(
    () => (isAdmin ? adoptionApi.expiring(CERT_SOON_DAYS) : Promise.resolve({ adoptions: [] })),
    [isAdmin]
  );

  // Notifikasi nyata dari basis data. Kegagalannya ditelan di sini supaya
  // lonceng tetap menampilkan yang turunan — notifikasi adalah pelengkap,
  // bukan sesuatu yang boleh menjatuhkan topbar.
  const { data: serverNotif, refetch: refetchServer } = useApi(
    () => notificationApi.list().catch(() => ({ notifications: [], unread: 0 })),
    []
  );

  const [readIds, setReadIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) || "[]")); }
    catch { return new Set(); }
  });

  useEffect(() => {
    try { localStorage.setItem(READ_KEY, JSON.stringify([...readIds])); } catch { /* kuota penuh / mode privat */ }
  }, [readIds]);

  const groups = useMemo(() => {
    const list = trees ?? [];
    const adoptions = dataExpiring?.adoptions ?? [];
    const critical = [], stale = [], attention = [];

    for (const tr of list) {
      const status = tr.health_status ?? tr.healthStatus;
      const updated = tr.last_updated ?? tr.lastUpdated;
      if (status === "buruk") critical.push(tr);
      else if (status === "sedang") attention.push(tr);
      if (daysSince(updated) > STALE_DAYS) stale.push(tr);
    }

    // Pemasukan dana dalam 30 hari terakhir.
    const recentIncome = (income ?? []).filter(
      (row) => daysSince(row.date) <= RECENT_INCOME_DAYS
    );

    // Sertifikat Basic Carbon dengan status "soon" (sisa ≤ 3 hari) atau baru
    // "expired" ≤ 3 hari lalu — ambang yang sama dipakai getCertificateLifecycle.
    // Sertifikat non-Basic-Carbon & yang tier-nya tak dikenali (lifecycle null)
    // otomatis terlewat, tidak pernah masuk kelompok ini.
    const EXPIRED_RECENT_MS = 3 * 86_400_000;
    const expiringCerts = (adoptions ?? []).filter((a) => {
      const lc = getCertificateLifecycle(a);
      if (!lc) return false;
      if (lc.status === "soon") return true;
      if (lc.status === "expired") return Math.abs(lc.msRemaining) <= EXPIRED_RECENT_MS;
      return false;
    });

    const out = [];
    if (critical.length)  out.push({ id: "critical",  tone: "bad",  count: critical.length,  trees: critical });
    if (stale.length)     out.push({ id: "stale",     tone: "warn", count: stale.length,     trees: stale });
    if (attention.length) out.push({ id: "attention", tone: "warn", count: attention.length, trees: attention });
    if (recentIncome.length) {
      out.push({
        id: "income",
        tone: "good",
        count: recentIncome.length,
        to: "/dana",
        // Dipakai bell untuk baris pratinjau, menggantikan daftar ID pohon.
        preview: recentIncome.slice(0, 3).map((r) => r.source).join(" · "),
        trees: [],
      });
    }
    if (expiringCerts.length) {
      out.push({
        id: "certExpiring",
        tone: "warn",
        count: expiringCerts.length,
        to: "/sertifikat",
        preview: expiringCerts.slice(0, 3).map((a) => a.certificate_no).join(" · "),
        trees: [],
      });
    }
    return out;
  }, [trees, income, dataExpiring]);

  // Baris server dibentuk menjadi "grup" berisi satu item supaya lonceng yang
  // sudah ada bisa merendernya tanpa cabang khusus. Judul dan isinya datang
  // sebagai teks jadi dari backend — sudah berbahasa Indonesia dan menyebut
  // hal yang konkret ("Pohon GJR-L1-001 diperbarui menjadi sedang"), jadi
  // TIDAK dilewatkan kamus i18n seperti grup turunan.
  const grupServer = useMemo(
    () =>
      (serverNotif?.notifications ?? []).map((n) => ({
        id: `srv-${n.id}`,
        serverId: n.id,
        tone: n.type === "laporan_ditolak" ? "bad"
            : n.type === "laporan_disetujui" ? "good"
            : "warn",
        count: 1,
        to: n.link ?? undefined,
        title: n.title,
        desc: n.body,
        preview: new Date(n.created_at).toLocaleString("id-ID"),
        readAt: n.read_at,
        trees: [],
      })),
    [serverNotif]
  );

  // Server dulu: peristiwa yang baru terjadi lebih mendesak daripada keadaan
  // yang sudah berlangsung lama.
  const semua = [...grupServer, ...groups];

  const unread = semua.filter((g) =>
    g.serverId ? !g.readAt : !readIds.has(g.id)
  );

  async function tandaiDibaca(g) {
    if (g.serverId) {
      try {
        await notificationApi.read(g.serverId);
        refetchServer();
      } catch { /* tidak fatal: lonceng tetap berfungsi */ }
      return;
    }
    setReadIds((prev) => new Set(prev).add(g.id));
  }

  return {
    loading,
    groups: semua,
    unreadCount: unread.length,
    isRead: (g) => (g?.serverId ? Boolean(g.readAt) : readIds.has(g?.id ?? g)),
    markRead: tandaiDibaca,
    markAllRead: async () => {
      setReadIds(new Set(groups.map((x) => x.id)));
      if (grupServer.length) {
        try {
          await notificationApi.readAll();
          refetchServer();
        } catch { /* tidak fatal */ }
      }
    },
  };
}
