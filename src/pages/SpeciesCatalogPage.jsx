// src/pages/SpeciesCatalogPage.jsx
//
// Katalog jenis pohon sebagai halaman sendiri — sebelumnya modal popup
// (SpeciesDetailModal) yang dipicu dari Topbar. Admin perlu melihat detail
// tiap jenis pohon lebih jelas: nama ilmiah, densitas kayu, dan berapa
// banyak pohon dari jenis itu yang sudah ada di inventaris — sesuatu yang
// tidak muat ditampilkan dengan baik di dalam popup kecil.

import { useMemo, useState } from "react";
import { TreePine, Search, Plus, X, AlertCircle, CheckCircle2, Leaf, Wind, Trash2, Pencil } from "lucide-react";
import AppShell from "../components/AppShell";
import { Card, EmptyState, SkeletonCards, SectionHeader, StatCard, ConfirmDialog } from "../components/ui";
import { speciesApi, treeApi } from "../lib/api";
import { useApi } from "../lib/useApi.jsx";
import { useLanguage } from "../lib/LanguageContext";
import { useToast } from "../lib/ToastContext";
import { formatNumber } from "../lib/format";

const inputCls = (err) =>
  `w-full text-sm bg-surface-sub border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/40 transition-colors text-ink ${err ? "border-bad/50" : "border-line"}`;

// Hint di BAWAH isian, bukan menempel di label — supaya label selalu satu
// baris dan isian di kolom sebelahnya sejajar. Alasan lengkapnya ada di
// komponen Field yang sama di GenerateQrPage.jsx.
function Field({ label, hint, error, required, children }) {
  return (
    <div className="min-w-0">
      <label className="block text-sm font-medium text-ink-muted mb-1.5 truncate">
        {label}
        {required && <span className="text-bad ml-0.5">*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-bad mt-1.5 flex items-start gap-1">
          <AlertCircle size={13} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </p>
      ) : (
        hint && <p className="text-xs text-ink-faint mt-1.5 leading-snug">{hint}</p>
      )}
    </div>
  );
}

/* ── Form tambah jenis pohon baru ──────────────────────────────────────────── */
// Dipakai untuk TAMBAH dan SUNTING. `awal` yang terisi menjadikannya form
// sunting; isinya sama persis, jadi aturan validasi tidak pernah bercabang
// antara dua form yang harus selalu sepakat.
function AddSpeciesForm({ onSave, onCancel, saving, t, awal = null }) {
  const [form, setForm] = useState({
    name: awal?.name ?? "",
    scientific_name: awal?.scientific_name ?? "",
    density_rho: awal?.density_rho != null ? String(awal.density_rho) : "",
    density_source: awal?.density_source ?? "",
    density_reference: awal?.density_reference ?? "",
  });
  const [errors, setErrors] = useState({});

  function handleField(k, v) {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: undefined }));
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Nama lokal wajib diisi";
    if (!form.density_rho || isNaN(form.density_rho) || Number(form.density_rho) < 0.1 || Number(form.density_rho) > 1.5)
      e.density_rho = "Densitas kayu wajib 0.1 – 1.5";
    return e;
  }

  function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    onSave({
      name: form.name.trim(),
      scientific_name: form.scientific_name.trim() || null,
      density_rho: Number(form.density_rho),
      density_source: form.density_source.trim() || null,
      density_reference: form.density_reference.trim() || null,
    });
  }

  return (
    <Card className="border-brand/30 bg-brand-soft">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          {awal ? <Pencil size={14} className="text-brand" /> : <Plus size={14} className="text-brand" />}
          <span className="text-xs font-semibold text-ink">{awal ? t("species_edit") : t("species_add_new")}</span>
        </div>
        <button type="button" onClick={onCancel} aria-label={t("cancel")} title={t("cancel")} className="text-ink-faint hover:text-ink-muted transition-colors">
          <X size={16} />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label="Nama Lokal" error={errors.name} required>
          <input type="text" placeholder="Contoh: Jati" value={form.name} onChange={(e) => handleField("name", e.target.value)} className={inputCls(errors.name)} />
        </Field>
        <Field label={t("species_scientific_name")} hint="opsional">
          <input
            type="text"
            placeholder="Contoh: Tectona grandis"
            value={form.scientific_name}
            onChange={(e) => handleField("scientific_name", e.target.value)}
            className={inputCls() + " italic"}
          />
        </Field>
        <Field label={t("species_wood_density")} hint="0.1 – 1.5 g/cm³" error={errors.density_rho} required>
          <input
            type="number"
            min="0.1"
            max="1.5"
            step="0.01"
            placeholder="0.65"
            value={form.density_rho}
            onChange={(e) => handleField("density_rho", e.target.value)}
            className={inputCls(errors.density_rho)}
          />
        </Field>
      </div>

      {/* Asal-usul densitas. Angka ini mengali LANGSUNG ke setiap perhitungan
          karbon lewat rumus Chave et al. 2014, jadi "dari mana 0,6 untuk Jati"
          adalah pertanyaan yang pasti muncul dan sampai sekarang tidak punya
          jawaban di mana pun di sistem ini. */}
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label={t("density_source")} hint={t("density_source_hint")}>
          <input
            type="text"
            placeholder="Zanne et al. 2009, Global Wood Density Database"
            value={form.density_source}
            onChange={(e) => handleField("density_source", e.target.value)}
            className={inputCls()}
          />
        </Field>
        <Field label={t("density_reference")}>
          <input
            type="text"
            placeholder="https://doi.org/10.5061/dryad.234"
            value={form.density_reference}
            onChange={(e) => handleField("density_reference", e.target.value)}
            className={inputCls()}
          />
        </Field>
      </div>
      <div className="flex gap-2 pt-3">
        <button type="button" onClick={onCancel} className="flex-1 sm:flex-none sm:px-6 py-2 text-xs font-medium rounded-lg bg-surface text-ink-muted hover:bg-surface-hover transition-colors">
          {t("cancel")}
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="flex-1 sm:flex-none sm:px-6 py-2 text-xs font-semibold rounded-lg bg-brand text-surface hover:opacity-90 disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5"
        >
          {saving ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 size={13} />}
          {saving ? "Menyimpan..." : "Simpan"}
        </button>
      </div>
    </Card>
  );
}

/* ── Kartu satu jenis pohon ────────────────────────────────────────────────── */
function SpeciesCard({ species, treeCount, co2TotalKg, t, onDelete, onEdit }) {
  const name = species.name;
  const sci = species.scientific_name;
  const rho = species.density_rho;
  const sumber = species.density_source;

  return (
    <Card hoverable className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {/* MEMBUNGKUS TIGA baris, bukan dipotong. Nama jenis adalah isi utama
              kartu ini, dan beberapa di antaranya panjang karena membawa
              keterangan — "Johar (belum teridentifikasi pasti)" terpotong
              justru pada bagian yang memberi tahu bahwa jenisnya belum
              dipastikan. Itu keterangan yang paling tidak boleh hilang.

              TIGA, bukan dua. Dua baris masih memenggal nama terpanjang yang
              ada — justru nama itu. Pemotongan menurun seperti ini sempat
              lolos dari audit, yang dulu hanya membandingkan lebar sehingga
              buta terhadap line-clamp; lihat pemeriksa "terpotong". */}
          <h3 className="font-bold text-ink text-sm leading-tight line-clamp-3">{name}</h3>
          {/* Ikut membungkus, dengan alasan yang lebih kuat lagi daripada
              nama umum di atas. Nama binomial adalah penanda PRESISI sebuah
              jenis: "Anacardium occidentale" yang terpotong jadi "Anacardium
              occ…" kehilangan justru bagian yang membedakannya dari kerabat
              semarganya. Potongan seperti itu lebih buruk dari tidak ada,
              karena tetap terbaca seolah lengkap. */}
          <p className={`text-xs mt-0.5 break-words ${sci ? "italic text-ink-muted" : "text-ink-faint"}`}>
            {sci || t("species_scientific_name_unknown")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {/* Tombol hapus hanya muncul untuk jenis yang belum dipakai pohon
              mana pun. Backend tetap menolaknya (409) kalau ternyata dipakai,
              tapi menampilkan tombol yang sudah pasti gagal pada 86 pohon Jati
              hanya mengundang klik sia-sia. */}
          {/* Sunting selalu tersedia, termasuk untuk jenis yang sudah dipakai
              banyak pohon — justru di situlah koreksi paling dibutuhkan:
              densitas yang salah ketik membuat SELURUH pohon jenis itu salah
              hitung karbonnya. Mengganti namanya ikut memperbarui pohon yang
              memakainya (trees.species cuma kolom teks, bukan foreign key). */}
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(species)}
              aria-label={`${t("species_edit")} ${name}`}
              title={`${t("species_edit")} ${name}`}
              className="rounded-lg p-2 text-ink-faint transition-colors hover:bg-surface-hover hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
            >
              <Pencil size={15} />
            </button>
          )}
          {onDelete && treeCount === 0 && (
            <button
              type="button"
              onClick={() => onDelete(species)}
              aria-label={`${t("delete_species")} ${name}`}
              title={`${t("delete_species")} ${name}`}
              className="rounded-lg p-2 text-ink-faint transition-colors hover:bg-bad-soft hover:text-bad focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
            >
              <Trash2 size={15} />
            </button>
          )}
          <div className="rounded-xl p-2 bg-brand-soft text-brand">
            <TreePine size={16} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-surface-sub rounded-xl p-2.5 border border-line">
          <span className="text-[10px] text-ink-faint block mb-0.5">{t("species_wood_density")}</span>
          <span className="text-sm font-bold font-mono-id text-ink tabular">{formatNumber(rho, 2)} g/cm³</span>
          {/* Sumbernya ditulis TEPAT DI BAWAH angkanya, dan ketiadaannya
              ditandai jelas. Densitas tanpa rujukan bukan cacat kecil: ia
              mengali langsung ke setiap angka karbon yang dijual. */}
          <span
            /* Tanpa `truncate`. Keterangan ini menandai kerapatan kayu yang
                belum punya sumber rujukan — dipotong, peringatannya justru
                yang hilang lebih dulu. Membungkus dua baris jauh lebih baik
                daripada menyembunyikan separuh kalimatnya. */
            className={`mt-1 block text-[9px] leading-tight ${sumber ? "text-ink-faint" : "text-warn"}`}
            title={sumber || t("density_source_missing")}
          >
            {sumber || t("density_source_missing")}
          </span>
        </div>
        <div className="bg-surface-sub rounded-xl p-2.5 border border-line">
          <span className="text-[10px] text-ink-faint block mb-0.5">{t("species_tree_count")}</span>
          <span className="text-sm font-bold text-ink tabular">{formatNumber(treeCount)}</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-good bg-good-soft rounded-lg px-2.5 py-2">
        <Wind size={13} className="shrink-0" />
        <span className="truncate">
          {t("species_co2_total")}: <strong className="tabular">{formatNumber(co2TotalKg / 1000, 2)} ton</strong>
        </span>
      </div>
    </Card>
  );
}

export default function SpeciesCatalogPage() {
  const { t } = useLanguage();
  const toast = useToast();
  const { data: speciesList, loading: speciesLoading, refetch: refetchSpecies } = useApi(() => speciesApi.list());
  const { data: trees, loading: treesLoading } = useApi(() => treeApi.list());

  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Hapus jenis pohon ─────────────────────────────────────────────────────
  const [speciesToDelete, setSpeciesToDelete] = useState(null);
  const [deletingSpecies, setDeletingSpecies] = useState(false);

  async function handleDeleteSpecies() {
    if (!speciesToDelete) return;
    setDeletingSpecies(true);
    try {
      const res = await speciesApi.remove(speciesToDelete.id);
      toast.success(res.message || t("toast_species_deleted"));
      setSpeciesToDelete(null);
      refetchSpecies();
    } catch (e) {
      toast.error(e.message || t("toast_failed"));
    } finally {
      setDeletingSpecies(false);
    }
  }

  // Agregasi jumlah pohon & total CO2 per jenis dari inventaris live —
  // baca dual snake_case/camelCase karena beberapa endpoint pohon lama
  // masih mengembalikan camelCase (lihat catatan yang sama di TreeTable.jsx).
  const statsBySpecies = useMemo(() => {
    const map = new Map();
    for (const tr of trees ?? []) {
      const sp = tr.species;
      if (!sp) continue;
      const co2 = Number(tr.co2_eq_kg ?? tr.co2EqKg ?? 0);
      const prev = map.get(sp) ?? { count: 0, co2: 0 };
      map.set(sp, { count: prev.count + 1, co2: prev.co2 + co2 });
    }
    return map;
  }, [trees]);

  const filtered = useMemo(() => {
    const list = speciesList ?? [];
    const q = search.trim().toLowerCase();
    const withStats = list.map((sp) => ({
      ...sp,
      __count: statsBySpecies.get(sp.name)?.count ?? 0,
      __co2: statsBySpecies.get(sp.name)?.co2 ?? 0,
    }));
    const sorted = [...withStats].sort((a, b) => a.name.localeCompare(b.name, "id"));
    if (!q) return sorted;
    return sorted.filter(
      (sp) => sp.name.toLowerCase().includes(q) || (sp.scientific_name ?? "").toLowerCase().includes(q)
    );
  }, [speciesList, statsBySpecies, search]);

  const totalTreesTracked = trees?.length ?? 0;
  const totalCo2Kg = useMemo(() => {
    let sum = 0;
    for (const v of statsBySpecies.values()) sum += v.co2;
    return sum;
  }, [statsBySpecies]);
  const identifiedCount = (speciesList ?? []).filter((sp) => sp.scientific_name).length;

  // Jenis yang sedang disunting. null = tidak ada.
  const [speciesToEdit, setSpeciesToEdit] = useState(null);

  async function handleUpdateSpecies(payload) {
    setSaving(true);
    try {
      const res = await speciesApi.update(speciesToEdit.id, payload);
      setSpeciesToEdit(null);
      refetchSpecies();
      // Jumlah pohon terdampak dikembalikan backend: kalau namanya berubah,
      // pohon yang memakainya ikut diperbarui, dan pengurus berhak tahu
      // berapa baris yang tersentuh — bukan sekadar "berhasil".
      const n = res?.trees_affected ?? 0;
      toast.success(n > 0 ? `${t("toast_species_updated")} (${n} ${t("trees_affected_suffix")})` : t("toast_species_updated"));
    } catch (e) {
      toast.error(e.message || t("toast_failed"));
    } finally {
      setSaving(false);
    }
  }

  async function handleAddSpecies(payload) {
    setSaving(true);
    try {
      await speciesApi.create(payload);
      toast.success(t("toast_species_saved"));
      await refetchSpecies();
      setShowAdd(false);
    } catch (e) {
      toast.error(e.message || `${t("toast_failed")} — jenis pohon`);
    } finally {
      setSaving(false);
    }
  }

  const loading = speciesLoading || treesLoading;

  return (
    <AppShell title={t("species_catalog")} showPeriod={false}>
      <div className="gjr-stagger space-y-5">
        <p className="text-sm text-ink-muted max-w-2xl">{t("species_catalog_subtitle")}</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard icon={Leaf} label={t("species_catalog")} value={formatNumber((speciesList ?? []).length)} sub={`${identifiedCount} ${t("species_identified_suffix")}`} accent="sage" />
          <StatCard icon={TreePine} label={t("species_tree_count")} value={formatNumber(totalTreesTracked)} accent="forest" />
          <StatCard icon={Wind} label={t("species_co2_total")} value={formatNumber(totalCo2Kg / 1000, 1)} suffix="ton CO₂e" accent="gold" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              type="text"
              placeholder={t("species_search_placeholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-sm bg-surface border border-line rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/40 transition-colors text-ink placeholder:text-ink-faint"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label={t("cancel")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-muted transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowAdd((v) => !v)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand text-surface text-xs font-semibold hover:opacity-90 transition-colors shrink-0"
          >
            <Plus size={14} />
            {t("species_add_new")}
          </button>
        </div>

        {showAdd && <AddSpeciesForm onSave={handleAddSpecies} onCancel={() => setShowAdd(false)} saving={saving} t={t} />}

        {speciesToEdit && (
          <AddSpeciesForm
            awal={speciesToEdit}
            onSave={handleUpdateSpecies}
            onCancel={() => setSpeciesToEdit(null)}
            saving={saving}
            t={t}
          />
        )}

        <div>
          <SectionHeader>{t("species_catalog")} ({filtered.length})</SectionHeader>
          {loading ? (
            <SkeletonCards count={6} />
          ) : filtered.length === 0 ? (
            <Card>
              <EmptyState
                icon={search ? Search : TreePine}
                title={search ? t("species_none_found") : t("species_empty_catalog")}
                description={search ? t("species_none_found_desc") : t("species_empty_catalog_desc")}
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filtered.map((sp) => (
                <SpeciesCard key={sp.id ?? sp.name} species={sp} treeCount={sp.__count} co2TotalKg={sp.__co2} t={t}
                  onDelete={setSpeciesToDelete}
                  onEdit={setSpeciesToEdit} />
              ))}
            </div>
          )}
        </div>
      </div>

      {speciesToDelete && (
        <ConfirmDialog
          title={t("delete_species")}
          message={`Hapus "${speciesToDelete.name}" dari katalog? Tindakan ini tidak bisa dibatalkan.`}
          consequences={[
            "Jenis ini belum dipakai pohon mana pun, jadi tidak ada data pohon yang terpengaruh.",
            `Kerapatan kayu ρ ${formatNumber(speciesToDelete.density_rho, 2)} g/cm³ tidak lagi terisi otomatis di form Generate QR.`,
            "Bisa ditambahkan lagi kapan saja lewat tombol Tambah Jenis Pohon.",
          ]}
          confirmLabel={t("delete")}
          cancelLabel={t("cancel")}
          loading={deletingSpecies}
          onConfirm={handleDeleteSpecies}
          onClose={() => setSpeciesToDelete(null)}
        />
      )}
    </AppShell>
  );
}
