import { useState, useMemo } from "react";
import { Search, TreeDeciduous, Camera, Trash2, HeartPulse, TrendingUp } from "lucide-react";
import { useApi, ApiState } from "../lib/useApi.jsx";
import { treeApi } from "../lib/api";
import { formatDate, formatNumber } from "../lib/format";
import ScanResultModal from "./ScanResultModal";
import AddTreePhotoModal from "./AddTreePhotoModal";
import { useAuth } from "../lib/AuthContext";
import { useLanguage } from "../lib/LanguageContext";
import { usePeriod } from "../lib/PeriodContext";
import { Card, CardHeader, HealthBadge, EmptyState, SkeletonTable, DataTable, ConfirmDialog, Select } from "./ui";
import { useToast } from "../lib/ToastContext";
import ReportConditionModal from "./ReportConditionModal";
import TreeGrowthModal from "./TreeGrowthModal";

// Props:
//   trees      — opsional, array pohon dari parent (misal dashboard petani)
//   farmerId   — opsional, filter pohon milik petani tertentu
// `level` diteruskan ke CardHeader. Tabel ini muncul di bawah SectionHeader
// (h2) pada Ringkasan dan Pohon, tapi langsung di bawah judul halaman (h1)
// pada Pohon Saya milik petani — jadi tingkat judulnya milik pemanggil, bukan
// patokan tetap. Lihat CardHeader di ui/Card.jsx.
export default function TreeTable({ trees: propTrees, farmerId, jenisDipilih, onJenisChange, level = 3 }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();
  const { matches } = usePeriod();
  const [query, setQuery]                   = useState("");
  const [speciesLokal, setSpeciesLokal]     = useState("semua");

  // Penyaring jenis bisa dikendalikan dari luar — kartu jenis di dashboard
  // menyetel dropdown yang SUDAH ADA di sini, bukan menambah penyaring kedua.
  // Dua penyaring untuk hal yang sama akan saling bertentangan, dan pengguna
  // tidak punya cara tahu mana yang sedang berlaku.
  //
  // Memakai pola terkendali, BUKAN menyelaraskan state lewat useEffect.
  // Penyelarasan lewat effect membuat tabel sempat tergambar dengan nilai lama
  // sebelum effect berjalan, dan nilai kebenarannya jadi ada di dua tempat.
  // Di sini hanya ada satu: prop kalau diberikan, state lokal kalau tidak.
  const dikendalikanLuar = jenisDipilih !== undefined;
  const speciesFilter = dikendalikanLuar ? (jenisDipilih ?? "semua") : speciesLokal;
  const setSpeciesFilter = (nilai) => {
    if (dikendalikanLuar) onJenisChange?.(nilai === "semua" ? null : nilai);
    else setSpeciesLokal(nilai);
  };
  const [selectedTreeId, setSelectedTreeId] = useState(null);
  const [photoTreeId, setPhotoTreeId]       = useState(null);
  const [growthTreeId, setGrowthTreeId]     = useState(null);
  // Pohon yang sedang dilaporkan kondisinya (petani saja).
  const [reportTree, setReportTree]         = useState(null);

  const { data: apiTrees, loading, error, refetch } = useApi(
    () => treeApi.list(farmerId ? { farmer_id: farmerId } : {}),
    [farmerId]
  );

  const allTrees = propTrees ?? apiTrees ?? [];

  // Normalisasi snake_case → camelCase, dibungkus useMemo supaya tidak
  // dihitung ulang di setiap ketikan pada kotak pencarian.
  const normalized = useMemo(() => allTrees.map((tr) => ({
    id:           tr.id,
    farmerId:     tr.farmer_id     ?? tr.farmerId,
    farmerName:   tr.farmer_name   ?? tr.farmerName ?? tr.farmer?.name ?? "—",
    species:      tr.species,
    dbhCm:        tr.dbh_cm        ?? tr.dbhCm,
    heightM:      tr.height_m      ?? tr.heightM,
    healthStatus: tr.health_status ?? tr.healthStatus,
    plantedDate:  tr.planted_date  ?? tr.plantedDate,
    lastUpdated:  tr.last_updated  ?? tr.lastUpdated,
    co2EqKg:      tr.co2_eq_kg     ?? tr.co2EqKg,
  })), [allTrees]);

  const speciesList = useMemo(
    () => ["semua", ...new Set(normalized.map((tr) => tr.species))],
    [normalized]
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return normalized.filter((tr) => {
      const matchQ = tr.id.toLowerCase().includes(q) || tr.farmerName.toLowerCase().includes(q);
      const matchS = speciesFilter === "semua" || tr.species === speciesFilter;
      // Filter periode global berlaku juga di sini.
      const matchP = matches(tr.plantedDate ?? tr.lastUpdated);
      return matchQ && matchS && matchP;
    });
  }, [normalized, query, speciesFilter, matches]);

  const canUploadPhoto = user?.role === "admin" || user?.role === "farmer";
  const isAdmin = user?.role === "admin";
  const isFarmer = user?.role === "farmer";

  // ── Hapus pohon ───────────────────────────────────────────────────────────
  // Barisnya disimpan utuh, bukan cuma id-nya: dialog konfirmasinya menyebut
  // jenis dan petani pemiliknya supaya admin tahu persis pohon mana yang
  // sedang dihapus — ID seperti "GJR-L2-014" saja terlalu mudah tertukar.
  const [treeToDelete, setTreeToDelete] = useState(null);
  const [deletingTree, setDeletingTree] = useState(false);

  async function handleDeleteTree() {
    if (!treeToDelete) return;
    setDeletingTree(true);
    try {
      const res = await treeApi.remove(treeToDelete.id);
      toast.success(res.message || t("toast_tree_deleted"));
      setTreeToDelete(null);
      refetch?.();
    } catch (e) {
      // Backend menjawab 409 dengan kalimat yang sudah menyebut sertifikat
      // penghalangnya — ditampilkan apa adanya, bukan diganti pesan umum.
      toast.error(e.message || t("toast_failed"));
    } finally {
      setDeletingTree(false);
    }
  }

  const columns = useMemo(() => {
    const cols = [
      { key: "id", header: t("tree_id"), value: (r) => r.id,
        cellClass: "font-mono-id text-[12px] text-ink whitespace-nowrap" },
      { key: "species", header: t("species"), value: (r) => r.species },
    ];
    if (!farmerId) {
      cols.push({ key: "farmerName", header: t("farmer"), value: (r) => r.farmerName, cellClass: "text-ink-muted" });
    }
    cols.push(
      { key: "dbhCm", header: "DBH (cm)", align: "right", value: (r) => r.dbhCm, cellClass: "text-ink-muted" },
      { key: "healthStatus", header: t("health"),
        value: (r) => r.healthStatus,
        exportValue: (r) => t(`health_${r.healthStatus}`),
        render: (r) => <HealthBadge status={r.healthStatus} label={t(`health_${r.healthStatus}`)} /> },
      { key: "co2EqKg", header: "CO₂ (kg)", align: "right",
        value: (r) => r.co2EqKg,
        render: (r) => formatNumber(r.co2EqKg, 2),
        cellClass: "font-medium text-ink" },
      { key: "lastUpdated", header: t("update"),
        value: (r) => r.lastUpdated,
        render: (r) => formatDate(r.lastUpdated),
        cellClass: "text-ink-faint text-xs" },
    );
    if (canUploadPhoto) {
      cols.push({
        key: "photo", header: t("photo"), align: "center", sortable: false,
        value: () => "", exportValue: () => "",
        render: (r) => (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setPhotoTreeId(r.id); }}
            onKeyDown={(e) => e.stopPropagation()}
            aria-label={`${t("add_photo_for")} ${r.id}`}
            title={`${t("add_photo_for")} ${r.id}`}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-soft hover:brightness-95 text-brand-ink font-semibold text-[11px] rounded-lg transition-colors"
          >
            <Camera size={13} />
            <span className="hidden sm:inline">{t("photo")}</span>
          </button>
        ),
      });
    }
    // Kolom "Lapor" HANYA untuk petani, dan admin TIDAK mendapatkannya:
    // admin sudah bisa mengubah kondisi pohon langsung lewat PATCH
    // /trees/{id}/health, jadi mengirim laporan ke dirinya sendiri untuk
    // disetujui sendiri tidak ada gunanya.
    //
    // Inilah satu-satunya cara petani mencatat sesuatu tentang pohonnya selain
    // mengunggah foto. Sebelum ini, petani yang melihat pohonnya tumbang harus
    // menelepon admin.
    // Riwayat pengukuran. Tersedia untuk semua peran yang bisa melihat tabel
    // ini — angka karbon satu pohon sama pentingnya bagi petani yang
    // merawatnya dan pengurus yang melaporkannya.
    cols.push({
      key: "riwayat", header: t("growth_history"), align: "center", sortable: false,
      value: () => "", exportValue: () => "",
      render: (r) => (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setGrowthTreeId(r.id); }}
          onKeyDown={(e) => e.stopPropagation()}
          aria-label={`${t("growth_history")} ${r.id}`}
          title={`${t("growth_history")} ${r.id}`}
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-brand transition-colors hover:bg-brand-soft"
        >
          <TrendingUp size={13} />
          <span className="hidden sm:inline">{t("growth_history")}</span>
        </button>
      ),
    });

    if (isFarmer) {
      cols.push({
        key: "lapor", header: t("report_condition"), align: "center", sortable: false,
        value: () => "", exportValue: () => "",
        render: (r) => (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setReportTree(r); }}
            onKeyDown={(e) => e.stopPropagation()}
            aria-label={`${t("report_condition_for")} ${r.id}`}
            title={`${t("report_condition_for")} ${r.id}`}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-warn-soft hover:brightness-95 text-warn font-semibold text-[11px] rounded-lg transition-colors"
          >
            <HeartPulse size={13} />
            <span className="hidden sm:inline">{t("report_condition")}</span>
          </button>
        ),
      });
    }

    // Kolom hapus HANYA untuk admin. Petani boleh menambah foto pohonnya
    // sendiri, tapi menghapus pohon dari inventaris adalah keputusan koperasi —
    // backend juga menolaknya dengan 403, ini sekadar tidak menampilkan tombol
    // yang pasti gagal.
    if (isAdmin) {
      cols.push({
        key: "hapus", header: "", align: "center", sortable: false,
        value: () => "", exportValue: () => "",
        render: (r) => (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setTreeToDelete(r); }}
            onKeyDown={(e) => e.stopPropagation()}
            aria-label={`${t("delete_tree")} ${r.id}`}
            title={`${t("delete_tree")} ${r.id}`}
            className="inline-flex items-center rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-bad-soft hover:text-bad focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
          >
            <Trash2 size={13} />
          </button>
        ),
      });
    }
    return cols;
  }, [t, farmerId, canUploadPhoto, isAdmin, isFarmer]);

  return (
    <Card>
      <CardHeader
        level={level}
        icon={TreeDeciduous}
        title={t("tree_list")}
        count={!loading ? `${filtered.length} ${t("of")} ${normalized.length}` : undefined}
        actions={
          <>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
              <input
                type="search"
                placeholder={t("search_id_farmer")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label={t("search_id_farmer")}
                className="text-xs bg-surface-sub border border-line rounded-lg pl-8 pr-3 py-2 w-full sm:w-52 text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
            </div>
            <Select
              value={speciesFilter}
              onChange={(e) => setSpeciesFilter(e.target.value)}
              options={speciesList.map((s) => ({ value: s, label: s === "semua" ? t("all_species") : s }))}
              ariaLabel={t("all_species")}
              size="sm"
              className="w-40"
            />
          </>
        }
      />

      <ApiState loading={loading} error={error} skeleton={<SkeletonTable rows={6} cols={columns.length} />}>
        <DataTable
          columns={columns}
          rows={filtered}
          getRowKey={(r) => r.id}
          onRowClick={(r) => setSelectedTreeId(r.id)}
          rowLabel={(r) => `${t("tree_id")} ${r.id} — ${r.species}`}
          initialSort={{ key: "lastUpdated", dir: "desc" }}
          exportName={farmerId ? `pohon-${farmerId}` : "pohon"}
          empty={
            <EmptyState
              icon={TreeDeciduous}
              title={t("no_trees_found")}
              description={query || speciesFilter !== "semua" ? `"${query || speciesFilter}"` : undefined}
            />
          }
        />
        <p className="text-[11px] text-ink-faint mt-1 px-1">
          {t("click_row_detail")}
          {canUploadPhoto && ` · ${t("click_photo_btn")}`}
        </p>
      </ApiState>

      {selectedTreeId && (
        <ScanResultModal
          treeId={selectedTreeId}
          role={user?.role ?? "admin"}
          onClose={() => { setSelectedTreeId(null); refetch(); }}
        />
      )}

      {/* Laporan kondisi dari petani. Setelah terkirim, tabelnya dimuat ulang
          — bukan karena kondisinya langsung berubah (laporan masuk antrean
          verifikasi dulu), melainkan supaya percobaan laporan kedua untuk
          pohon yang sama memakai data terbaru dan ditolak lebih awal. */}
      <ReportConditionModal
        isOpen={Boolean(reportTree)}
        tree={reportTree}
        onClose={() => setReportTree(null)}
        onSent={() => refetch?.()}
      />

      {growthTreeId && (
        <TreeGrowthModal treeId={growthTreeId} onClose={() => setGrowthTreeId(null)} />
      )}

      {photoTreeId && (
        <AddTreePhotoModal
          isOpen={true}
          treeId={photoTreeId}
          onClose={() => setPhotoTreeId(null)}
          onPhotoAdded={() => { setPhotoTreeId(null); refetch(); }}
        />
      )}

      {treeToDelete && (
        <ConfirmDialog
          title={t("delete_tree")}
          message={`${treeToDelete.id} — ${treeToDelete.species}, milik ${treeToDelete.farmerName ?? "—"}. Tindakan ini tidak bisa dibatalkan.`}
          consequences={[
            "Riwayat pengukuran karbon pohon ini ikut dihapus.",
            "Semua foto perkembangannya ikut dihapus.",
            `Total CO₂ komunitas berkurang ${formatNumber(treeToDelete.co2EqKg ?? 0, 2)} kg.`,
            "Kalau pohon ini masih terikat sertifikat, penghapusan akan ditolak dan sertifikatnya harus dihapus lebih dulu.",
          ]}
          confirmLabel={t("delete")}
          cancelLabel={t("cancel")}
          loading={deletingTree}
          onConfirm={handleDeleteTree}
          onClose={() => setTreeToDelete(null)}
        />
      )}
    </Card>
  );
}
