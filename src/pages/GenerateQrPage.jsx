import { useToast } from "../lib/ToastContext";
import { useLanguage } from "../lib/LanguageContext";
import AppShell from "../components/AppShell";
import { useState, useRef, Fragment } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { treeApi, farmerApi, speciesApi } from "../lib/api";
import { useApi } from "../lib/useApi.jsx";
import DateField from "../components/ui/DateField";
import { Select } from "../components/ui";
import { Leaf, ClipboardEdit, Eye, CheckCircle2, Download, Printer, RotateCcw, ChevronRight, ChevronLeft, AlertCircle, AlertTriangle, TreePine, User, MapPin, Ruler, Calculator, Wind, Plus, Search, X } from "lucide-react";
import { tautanPohon, alamatSementara, asalPublik } from "../lib/tautanPublik";

function hitungKarbon({ dbhCm, heightM, densityRho }) {
  const D=Number(dbhCm), H=Number(heightM), rho=Number(densityRho);
  if (!D||!H||!rho) return null;
  const agb = 0.0673*Math.pow(rho*D*D*H,0.976);
  const bgb = agb*0.24, tb=agb+bgb, c=tb*0.47, co2=c*3.67;
  return { agbKg:agb, bgbKg:bgb, tbKg:tb, cKg:c, co2EqKg:co2 };
}
function fmt(n,d=2) { return n==null?"—":n.toLocaleString("id-ID",{minimumFractionDigits:d,maximumFractionDigits:d}); }

const STEP_LABEL_KEYS = ["qr_step_data", "qr_step_preview", "qr_step_done"];

// Sama seperti SELECTED_CLS di ScanResultModal.jsx (HealthUpdater) — chip
// solid untuk status kesehatan yang aktif dipilih, bukan sekadar tint lunak
// seperti HealthBadge biasa (di sini pilihannya lebih menonjol karena
// pengguna sedang menentukan status, bukan hanya membacanya).
const HEALTH_SELECTED_CLS = {
  // sage-600, bukan sage-500: putih di atas sage-500 terukur rasio 4,28,
  // tepat di bawah ambang WCAG AA 4,5. sage-600 menaikkannya ke 5,9
  // tanpa mengubah kesan warnanya.
  baik:   "bg-sage-600 text-white border-sage-600",
  sedang: "bg-gold-500 text-forest-950 border-gold-500",
  buruk:  "bg-clay-500 dark:bg-clay-400 text-white dark:text-forest-950 border-clay-500 dark:border-clay-400",
};

// Chip status di atas bar bg-forest-900 tetap (bukan bg-surface), jadi
// butuh warna terang-di-atas-gelap yang fix, bukan token bg-*-soft yang
// diasumsikan berada di atas latar terang/tema.
const HEALTH_CHIP_ON_DARK = {
  baik:   "bg-sage-400/20 text-sage-300",
  sedang: "bg-gold-400/20 text-gold-300",
  buruk:  "bg-clay-400/20 text-clay-200",
};
const inputCls = (err) => `w-full text-base bg-surface-sub border rounded-lg px-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-brand/40 transition-colors text-ink ${err?"border-bad/50":"border-line"}`;

// Hint ditaruh DI BAWAH isian, bukan menempel di labelnya.
//
// Dulu hint ikut di baris label ("DBH (cm) * — Diameter setinggi dada").
// Di dalam grid tiga kolom, label yang panjang membungkus jadi dua baris
// sementara tetangganya ("Tinggi (m)") cukup satu baris — akibatnya kotak
// isiannya berada di ketinggian berbeda dan barisnya terlihat miring.
//
// Dengan hint dipindah ke bawah, semua label pasti satu baris sehingga
// isiannya sejajar dengan sendirinya, tanpa perlu memaksa tinggi minimum yang
// menyisakan ruang kosong saat labelnya pendek. Ini juga pola yang lazim untuk
// teks bantuan formulir. Saat ada error, error yang tampil menggantikan hint —
// dua baris keterangan sekaligus hanya menambah kebisingan.
function Field({ label, hint, error, required, children }) {
  return (
    <div className="min-w-0">
      <label className="block text-sm font-medium text-ink-muted mb-1.5 truncate">
        {label}{required&&<span className="text-bad ml-0.5">*</span>}
      </label>
      {children}
      {error
        ? <p className="text-xs text-bad mt-1.5 flex items-start gap-1"><AlertCircle size={13} className="shrink-0 mt-0.5"/><span>{error}</span></p>
        : hint && <p className="text-xs text-ink-faint mt-1.5 leading-snug">{hint}</p>}
    </div>
  );
}

function FormSection({ icon, title, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-ink-muted mb-4">{icon}<span className="text-sm font-bold uppercase tracking-wider">{title}</span></div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

/* ── Species Card Selector ─────────────────────────────────────────────────── */
function SpeciesCardSelector({ speciesList, selectedSpecies, onSelect, error, onAddNew }) {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const list = (speciesList ?? []);
  // Sebelumnya hanya membaca `nama_lokal`, padahal GET /species mengembalikan
  // `name` — akibatnya kotak pencarian ini SELALU menghasilkan nol hasil.
  // Sekarang membaca keduanya, plus nama ilmiah supaya bisa dicari "Tectona".
  const q = search.trim().toLowerCase();
  const filtered = q
    ? list.filter(s => {
        const nama = (s.nama_lokal ?? s.name ?? "").toLowerCase();
        const ilmiah = (s.scientific_name ?? "").toLowerCase();
        return nama.includes(q) || ilmiah.includes(q);
      })
    : list;

  return (
    <div>
      <label className="block text-sm font-medium text-ink-muted mb-1.5">
        Jenis Pohon<span className="text-bad ml-0.5">*</span>
      </label>

      {/* Search filter */}
      {list.length > 6 && (
        <div className="relative mb-3">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            type="text"
            placeholder="Cari nama lokal atau nama ilmiah..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-base bg-surface-sub border border-line rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand/40 transition-colors text-ink placeholder:text-ink-faint"
          />
          {search && (
            <button onClick={() => setSearch("")} aria-label={t("cancel")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-muted transition-colors">
              <X size={13} />
            </button>
          )}
        </div>
      )}

      {/* Card grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {filtered.map(s => {
          const name = s.nama_lokal ?? s.name ?? "—";
          const density = s.wood_density ?? s.density_rho ?? s.densityRho;
          const isSelected = selectedSpecies === name;
          return (
            <button
              key={s.id_spesies ?? name}
              type="button"
              onClick={() => onSelect(name, density)}
              className={`group relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all duration-200 cursor-pointer
                ${isSelected
                  ? "border-brand bg-brand-soft shadow-sm ring-1 ring-brand/30"
                  : "border-line bg-surface hover:border-brand/50 hover:shadow-sm hover:bg-brand-soft"
                }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <CheckCircle2 size={18} className="text-brand" />
                </div>
              )}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isSelected ? "bg-brand-soft" : "bg-surface-sub dark:bg-surface-sub group-hover:bg-brand-soft"}`}>
                <TreePine size={24} className={`transition-colors ${isSelected ? "text-brand" : "text-ink-faint group-hover:text-brand"}`} />
              </div>
              <span className={`text-sm font-bold leading-snug transition-colors ${isSelected ? "text-brand" : "text-ink"}`}>
                {name}
              </span>
              {/* Nama ilmiah mengisi ruang yang tadinya kosong dan sekaligus
                  membantu petugas memastikan jenis yang dipilih benar. */}
              {s.scientific_name && (
                <span className="text-xs italic text-ink-faint leading-snug line-clamp-2">
                  {s.scientific_name}
                </span>
              )}
              {density != null && (
                <span className="text-xs text-ink-muted tabular font-medium">
                  ρ {Number(density).toFixed(2)}
                </span>
              )}
            </button>
          );
        })}

        {/* Add new species card */}
        <button
          type="button"
          onClick={onAddNew}
          className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-line bg-transparent hover:border-brand/50 hover:bg-brand-soft transition-all duration-200 cursor-pointer group min-h-[130px]"
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-surface-sub dark:bg-surface-sub group-hover:bg-brand-soft transition-colors">
            <Plus size={24} className="text-ink-faint group-hover:text-brand transition-colors" />
          </div>
          <span className="text-sm font-semibold text-ink-faint group-hover:text-brand transition-colors">Tambah Baru</span>
        </button>
      </div>

      {filtered.length === 0 && search && (
        <p className="text-sm text-ink-faint mt-3 text-center">Tidak ada jenis pohon cocok untuk &quot;{search}&quot;</p>
      )}

      {error && <p className="text-xs text-bad mt-2 flex items-center gap-1"><AlertCircle size={13}/>{error}</p>}
    </div>
  );
}

/* ── Inline Add Species Form ───────────────────────────────────────────────── */
function AddSpeciesForm({ onSave, onCancel, saving }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({ nama_lokal: "", nama_ilmiah: "", wood_density: "" });
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (!form.nama_lokal.trim()) e.nama_lokal = "Nama lokal wajib diisi";
    if (!form.nama_ilmiah.trim()) e.nama_ilmiah = "Nama ilmiah wajib diisi";
    if (!form.wood_density || isNaN(form.wood_density) || Number(form.wood_density) < 0.1 || Number(form.wood_density) > 1.5)
      e.wood_density = "Densitas kayu wajib 0.1 – 1.5";
    return e;
  }

  function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave({
      name: form.nama_lokal.trim(),
      scientific_name: form.nama_ilmiah.trim(),
      density_rho: Number(form.wood_density),
    });
  }

  function handleField(k, v) {
    setForm(p => ({ ...p, [k]: v }));
    if (errors[k]) setErrors(p => ({ ...p, [k]: undefined }));
  }

  return (
    <div className="mt-3 bg-brand-soft border border-brand/30 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Plus size={14} className="text-brand" />
          <span className="text-xs font-semibold text-ink">Tambah Jenis Pohon Baru</span>
        </div>
        <button type="button" onClick={onCancel} aria-label={t("cancel")} title={t("cancel")} className="text-ink-faint hover:text-ink-muted transition-colors">
          <X size={16} />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Nama Lokal" error={errors.nama_lokal} required>
          <input type="text" placeholder="Contoh: Jati" value={form.nama_lokal} onChange={(e) => handleField("nama_lokal", e.target.value)} className={inputCls(errors.nama_lokal)} />
        </Field>
        <Field label="Nama Ilmiah" error={errors.nama_ilmiah} required>
          <input type="text" placeholder="Contoh: Tectona grandis" value={form.nama_ilmiah} onChange={(e) => handleField("nama_ilmiah", e.target.value)} className={inputCls(errors.nama_ilmiah) + " italic"} />
        </Field>
      </div>
      <Field label="Densitas Kayu (ρ)" hint="0.1 – 1.5 g/cm³" error={errors.wood_density} required>
        <input type="number" min="0.1" max="1.5" step="0.01" placeholder="0.65" value={form.wood_density} onChange={(e) => handleField("wood_density", e.target.value)} className={inputCls(errors.wood_density) + " max-w-[200px]"} />
      </Field>
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel} className="flex-1 py-2 text-xs font-medium rounded-lg bg-surface-sub text-ink-muted hover:bg-surface-hover transition-colors">
          Batal
        </button>
        <button type="button" onClick={handleSubmit} disabled={saving}
          className="flex-1 py-2 text-xs font-semibold rounded-lg bg-brand text-surface hover:opacity-90 disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5">
          {saving ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 size={13} />}
          {saving ? "Menyimpan..." : "Simpan Jenis Pohon"}
        </button>
      </div>
    </div>
  );
}

/* ── Main Page Component ───────────────────────────────────────────────────── */
export default function GenerateQrPage() {
  const { t } = useLanguage();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ farmerId:"", species:"", dbhCm:"", heightM:"", densityRho:"", latitude:"", longitude:"", plantedDate:"", healthStatus:"baik" });
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedTreeId, setSavedTreeId] = useState("");
  const [showAddSpecies, setShowAddSpecies] = useState(false);
  const [addingSpecies, setAddingSpecies] = useState(false);
  const qrRef = useRef(null);

  // Fetch farmers dan species dari API
  const { data: farmers } = useApi(() => farmerApi.list());
  const { data: speciesList, refetch: refetchSpecies } = useApi(() => speciesApi.list());

  const carbon = hitungKarbon(form);
  const selectedFarmer = (farmers??[]).find(f=>f.id===form.farmerId);
  const qrValue = savedTreeId ? tautanPohon(savedTreeId) : "";

  function handleSpeciesSelect(name, density) {
    setForm(p => ({ ...p, species: name, densityRho: density != null ? String(density) : p.densityRho }));
    if (errors.species) setErrors(p => ({ ...p, species: undefined }));
  }
  function handleField(k,v) { setForm(p=>({...p,[k]:v})); if(errors[k]) setErrors(p=>({...p,[k]:undefined})); }

  async function handleAddSpecies(speciesData) {
    setAddingSpecies(true);
    try {
      await speciesApi.create(speciesData);
      toast.success(t("toast_species_saved"));
      await refetchSpecies();
      handleSpeciesSelect(speciesData.name, speciesData.density_rho);
      setShowAddSpecies(false);
    } catch (e) {
      toast.error(e.message || `${t("toast_failed")} — jenis pohon`);
    } finally {
      setAddingSpecies(false);
    }
  }

  function validate() {
    const e={};
    if (!form.farmerId) e.farmerId="Pilih petani pemilik";
    if (!form.species) e.species="Pilih jenis pohon";
    if (!form.dbhCm||isNaN(form.dbhCm)||Number(form.dbhCm)<=0) e.dbhCm="DBH wajib diisi";
    if (!form.heightM||isNaN(form.heightM)||Number(form.heightM)<=0) e.heightM="Tinggi wajib diisi";
    if (!form.densityRho||isNaN(form.densityRho)||Number(form.densityRho)<=0) e.densityRho="Densitas wajib diisi";
    if (!form.latitude||isNaN(form.latitude)) e.latitude="Koordinat lintang tidak valid";
    if (!form.longitude||isNaN(form.longitude)) e.longitude="Koordinat bujur tidak valid";
    if (!form.plantedDate) e.plantedDate="Tanggal tanam wajib diisi";
    return e;
  }

  function handleNext() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setStep(1);
  }

  async function handleConfirmAndGenerate() {
    setSaveError(""); setSaving(true);
    try {
      const res = await treeApi.create({
        farmer_id:     form.farmerId,
        species:       form.species,
        dbh_cm:        Number(form.dbhCm),
        height_m:      Number(form.heightM),
        density_rho:   Number(form.densityRho),
        latitude:      Number(form.latitude),
        longitude:     Number(form.longitude),
        health_status: form.healthStatus,
        planted_date:  form.plantedDate,
      });
      toast.success(t("toast_tree_created"));
      setSavedTreeId(res.tree_id ?? res.tree?.kode_qr ?? res.tree?.id ?? "");
      setStep(2);
    } catch(e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  }

  function handleDownload() {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([xml],{type:"image/svg+xml"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download=`QR-${savedTreeId}.svg`; a.click();
    URL.revokeObjectURL(url);
  }

  function handleReset() {
    setStep(0); setSaveError(""); setSavedTreeId("");
    setForm({ farmerId:"", species:"", dbhCm:"", heightM:"", densityRho:"", latitude:"", longitude:"", plantedDate:"", healthStatus:"baik" });
    setErrors({}); setShowAddSpecies(false);
  }

  return (
    <AppShell title={t("nav_generate_qr")} showPeriod={false}>

      {/* Lebar mengikuti isi langkahnya: form pengisian butuh ruang lebar
          (kartu jenis pohon bisa 5 kolom), sedangkan preview & hasil QR justru
          lebih enak dibaca dalam kolom sempit. Sebelumnya ketiganya dipaksa
          max-w-2xl sehingga layar lebar mayoritas kosong.
          Dulu elemennya <main>, padahal AppShell sudah punya <main> sendiri —
          <main> bersarang bukan HTML yang sah. */}
      <div className={`mx-auto px-4 py-8 ${step===0 ? "max-w-6xl" : "max-w-3xl"}`}>
        {/* Step indicator */}
        <div className="mb-8 print:hidden">
          <div className="flex items-center gap-3 sm:gap-4">
            {STEP_LABEL_KEYS.map((key,i)=>{
              // Langkah yang sudah lewat bisa diklik untuk mundur — TAPI tidak
              // setelah pohonnya tersimpan.
              //
              // Versi contoh memakai syarat `i < step` saja. Di sini itu keliru:
              // langkah 2 berarti data sudah MASUK DATABASE dan QR-nya terbit.
              // Mengizinkan klik mundur ke formulir dari sana membuat orang
              // menyunting data yang sudah tersimpan lalu menyimpannya lagi —
              // satu pohon tercatat dua kali. Untuk mulai dari awal setelah
              // tersimpan sudah ada tombolnya sendiri, yang juga membersihkan
              // savedTreeId dan pesan galatnya.
              const bisaMundur = i < step && step < 2;
              return (
              <Fragment key={i}>
                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={()=>bisaMundur&&setStep(i)}
                    disabled={!bisaMundur}
                    aria-current={i===step?"step":undefined}
                    aria-label={`Langkah ${i+1}: ${t(key)}`}
                    className={`relative w-10 h-10 rounded-full flex items-center justify-center text-base font-bold shrink-0 transition-colors ${bisaMundur?"cursor-pointer hover:brightness-110":"cursor-default"} ${i<step?"bg-sage-500 text-white":i===step?"bg-gold-500 text-forest-950 ring-4 ring-gold-500/20":"bg-surface-sub text-ink-faint"}`}
                  >
                    {/* Denyut halus di belakang langkah aktif. Aturan
                        reduced-motion menyeluruh di index.css sudah
                        menghentikannya bagi yang mematikan animasi. */}
                    {i===step&&<span aria-hidden="true" className="absolute inset-0 rounded-full bg-gold-500/30 blur-md animate-pulse"/>}
                    <span className="relative">{i<step?<CheckCircle2 size={20}/>:i+1}</span>
                  </button>
                  <span className={`text-sm sm:text-base whitespace-nowrap ${i===step?"text-ink font-bold inline":"text-ink-muted font-medium hidden sm:inline"}`}>{t(key)}</span>
                </div>
                {i<STEP_LABEL_KEYS.length-1&&(
                  // Garis penghubung TERISI, bukan berganti warna begitu saja:
                  // pengisian dari kiri ke kanan menunjukkan arah kemajuan,
                  // sedangkan pergantian warna mendadak hanya menandai keadaan.
                  <div className="relative flex-1 h-0.5 rounded-full bg-surface-sub overflow-hidden">
                    <div
                      className="absolute inset-0 origin-left rounded-full bg-sage-500 transition-transform duration-700 ease-out"
                      style={{transform:`scaleX(${i<step?1:0})`}}
                    />
                  </div>
                )}
              </Fragment>
            );})}
          </div>

          {/* Bar progres menyeluruh + penghitung.
              Penghitung "1/3" ada terutama untuk layar kecil: di bawah sm:
              seluruh label langkah disembunyikan, sehingga tanpa ini yang
              tersisa cuma tiga lingkaran tanpa keterangan apa pun. */}
          <div className="mt-5 flex items-center gap-3">
            <div
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={STEP_LABEL_KEYS.length}
              aria-valuenow={step+1}
              aria-label="Kemajuan pendaftaran pohon"
              className="h-0.5 flex-1 overflow-hidden rounded-full bg-surface-sub"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-sage-500 to-gold-500 transition-[width] duration-700 ease-out"
                style={{width:`${((step+1)/STEP_LABEL_KEYS.length)*100}%`}}
              />
            </div>
            <span className="font-mono-id text-xs tabular-nums text-ink-faint shrink-0">
              {step+1}/{STEP_LABEL_KEYS.length}
            </span>
          </div>
        </div>

        {/* STEP 0 */}
        {step===0&&(
          <div className="bg-surface rounded-2xl border border-line p-6 md:p-8 shadow-sm transition-colors">
            <div className="flex items-center gap-2.5 mb-7"><ClipboardEdit size={24} className="text-brand"/><h2 className="text-xl font-bold text-ink">Langkah 1 — Isi Data Pohon</h2></div>
            <div className="space-y-7">
              <FormSection icon={<TreePine size={18}/>} title="Identitas">
                {/* Species card selector */}
                <SpeciesCardSelector
                  speciesList={speciesList}
                  selectedSpecies={form.species}
                  onSelect={handleSpeciesSelect}
                  error={errors.species}
                  onAddNew={() => setShowAddSpecies(true)}
                />

                {/* Inline add species form */}
                {showAddSpecies && (
                  <AddSpeciesForm
                    onSave={handleAddSpecies}
                    onCancel={() => setShowAddSpecies(false)}
                    saving={addingSpecies}
                  />
                )}

              </FormSection>

              {/* Sisa isian dibagi dua kolom di layar lebar. Pemilih jenis
                  pohon di atas sengaja tetap selebar penuh karena berbentuk
                  grid kartu — kalau ikut dipersempit, kartunya balik mengecil
                  dan justru mengulang masalah yang mau diperbaiki. */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-7 lg:gap-10">
               <div className="space-y-7">
              <FormSection icon={<Leaf size={18}/>} title="Kondisi & Waktu Tanam">
                <Field label="Status Kesehatan">
                  <div className="flex gap-2.5">
                    {["baik","sedang","buruk"].map(s=>(
                      <button key={s} type="button" onClick={()=>handleField("healthStatus",s)}
                        className={`flex-1 py-3 text-sm font-semibold rounded-xl border-2 transition-colors ${form.healthStatus===s?HEALTH_SELECTED_CLS[s]:"bg-surface-sub text-ink-muted border-line hover:border-line-strong"}`}>
                        {t(`health_${s}`)}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Tanggal Tanam" error={errors.plantedDate} required>
                  <DateField value={form.plantedDate} onChange={(e)=>handleField("plantedDate",e.target.value)} error={errors.plantedDate} required/>
                </Field>
              </FormSection>

              <FormSection icon={<User size={18}/>} title="Petani Pemilik">
                <Field label="Pilih Petani" error={errors.farmerId} required>
                  <Select
                    value={form.farmerId}
                    onChange={(e)=>handleField("farmerId",e.target.value)}
                    options={(farmers??[]).filter(f=>f.status==="active")
                      .map(f=>({ value: f.id, label: f.name, hint: f.group_coop }))}
                    placeholder="— Pilih petani —"
                    ariaLabel="Pilih Petani"
                    size="lg"
                    error={Boolean(errors.farmerId)}
                  />
                </Field>
              </FormSection>
               </div>

               <div className="space-y-7">
              <FormSection icon={<MapPin size={18}/>} title="Lokasi GPS">
                <p className="text-sm text-ink-muted -mt-2 mb-1">Gunakan GPS dari perangkat, atau ambil dari Google Maps.</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Lintang (Latitude)" error={errors.latitude} required>
                    <input type="number" step="any" placeholder="-7.9847" value={form.latitude} onChange={(e)=>handleField("latitude",e.target.value)} className={inputCls(errors.latitude)+" font-mono-id"}/>
                  </Field>
                  <Field label="Bujur (Longitude)" error={errors.longitude} required>
                    <input type="number" step="any" placeholder="110.4734" value={form.longitude} onChange={(e)=>handleField("longitude",e.target.value)} className={inputCls(errors.longitude)+" font-mono-id"}/>
                  </Field>
                </div>
              </FormSection>

              <FormSection icon={<Ruler size={18}/>} title="Dimensi Fisik Pohon">
                <p className="text-sm text-ink-muted -mt-2 mb-1">Digunakan untuk menghitung estimasi serapan karbon.</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="DBH (cm)" hint="Diameter setinggi dada" error={errors.dbhCm} required>
                    <input type="number" min="1" step="0.1" placeholder="13.0" value={form.dbhCm} onChange={(e)=>handleField("dbhCm",e.target.value)} className={inputCls(errors.dbhCm)}/>
                  </Field>
                  <Field label="Tinggi (m)" error={errors.heightM} required>
                    <input type="number" min="0.1" step="0.1" placeholder="6.2" value={form.heightM} onChange={(e)=>handleField("heightM",e.target.value)} className={inputCls(errors.heightM)}/>
                  </Field>
                </div>

                {/* Densitas kayu (ρ) TIDAK lagi jadi kolom isian.
                    Nilainya selalu terisi sendiri dari jenis pohon yang dipilih
                    (setiap baris katalog wajib punya densitas), jadi kolomnya
                    hanya menampilkan angka yang tidak pernah diketik siapa pun
                    — sambil memakan sepertiga baris dan memaksa DBH & Tinggi
                    jadi sempit.

                    Tetapi angkanya TIDAK disembunyikan: ρ ikut menentukan hasil
                    hitungan karbon, jadi petugas berhak melihat angka mana yang
                    sedang dipakai. Ditampilkan sebagai keterangan, bukan isian.

                    PENGAMAN: kalau karena satu dan lain hal ρ gagal terisi
                    (mis. jenis pohon lama yang katalognya sudah dihapus),
                    kolom isiannya MUNCUL KEMBALI. Tanpa itu, validasi
                    "Densitas wajib diisi" akan menolak form yang tidak punya
                    satu pun cara untuk diperbaiki. */}
                {form.densityRho && !errors.densityRho ? (
                  <p className="mt-2.5 flex flex-wrap items-baseline gap-x-1.5 text-sm text-ink-muted">
                    <span>Densitas kayu</span>
                    <span className="font-mono-id font-semibold text-ink">ρ {form.densityRho}</span>
                    <span>g/cm³</span>
                    <span className="text-ink-faint">— otomatis dari jenis {form.species || "pohon"}</span>
                  </p>
                ) : (
                  <div className="mt-3">
                    <Field label="Densitas (ρ)" hint="tidak terisi otomatis — isi manual, 0.1 – 1.5 g/cm³" error={errors.densityRho} required>
                      <input type="number" min="0.1" max="1.5" step="0.01" placeholder="0.65" value={form.densityRho} onChange={(e)=>handleField("densityRho",e.target.value)} className={inputCls(errors.densityRho)}/>
                    </Field>
                  </div>
                )}
                {carbon&&(
                  <div className="mt-4 bg-brand-soft border border-brand/20 rounded-xl p-4 flex items-center gap-3.5">
                    <Wind size={26} className="text-brand shrink-0"/>
                    <div>
                      <p className="text-xs text-brand font-semibold uppercase tracking-wide">Estimasi CO₂ (preview)</p>
                      <p className="text-2xl font-bold text-ink tabular leading-tight">{fmt(carbon.co2EqKg)} <span className="text-base font-semibold text-ink-muted">kg CO₂e</span></p>
                    </div>
                  </div>
                )}
              </FormSection>
               </div>
              </div>
            </div>

            {Object.keys(errors).length>0&&(
              <div className="mt-6 flex items-start gap-2.5 bg-bad-soft text-bad text-sm rounded-xl p-4">
                <AlertCircle size={18} className="shrink-0 mt-0.5"/>
                <p className="font-medium">Harap lengkapi semua field yang wajib diisi.</p>
              </div>
            )}
            <button onClick={handleNext} className="w-full mt-7 flex items-center justify-center gap-2 bg-forest-900 hover:bg-forest-800 text-cream-50 font-bold text-base rounded-xl py-4 transition-colors">
              Preview &amp; Hitung Karbon<ChevronRight size={20}/>
            </button>
          </div>
        )}

        {/* STEP 1 */}
        {step===1&&(
          <div className="bg-surface rounded-2xl border border-line p-6 shadow-sm transition-colors">
            <div className="flex items-center gap-2 mb-5"><Eye size={18} className="text-brand"/><h2 className="font-semibold text-ink">Langkah 2 — Preview &amp; Kalkulasi Karbon</h2></div>
            <p className="text-xs text-ink-muted mb-5">Periksa data sebelum QR digenerate. ID pohon akan dibuat otomatis oleh sistem.</p>
            <div className="border border-line rounded-xl overflow-hidden mb-4">
              <div className="bg-forest-900 px-4 py-3 flex items-center justify-between">
                <span className="font-mono-id text-gold-500 text-xs">ID akan di-generate otomatis</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${HEALTH_CHIP_ON_DARK[form.healthStatus]}`}>{t(`health_${form.healthStatus}`)}</span>
              </div>
              <div className="p-4 space-y-3 text-sm">
                {[
                  [Leaf,   "Jenis Pohon", form.species],
                  [User,   "Petani",      selectedFarmer?.name ?? form.farmerId],
                  [MapPin, "Koordinat",   `${Number(form.latitude).toFixed(5)}, ${Number(form.longitude).toFixed(5)}`],
                  [Ruler,  "Dimensi",     `DBH ${form.dbhCm} cm · Tinggi ${form.heightM} m · ρ ${form.densityRho}`],
                ].map(([Icon, l, v]) => (
                  <div key={l} className="flex gap-2">
                    <span className="text-ink-faint text-xs w-32 shrink-0 flex items-center gap-1.5"><Icon size={12} className="shrink-0" />{l}</span>
                    <span className="font-medium text-ink">{v}</span>
                  </div>
                ))}
              </div>
            </div>
            {carbon&&(
              <div className="bg-surface-sub rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-3"><Calculator size={14} className="text-brand"/><p className="text-xs font-semibold text-ink uppercase tracking-wide">Rincian Kalkulasi Karbon</p></div>
                <div className="space-y-2">
                  {[["AGB",carbon.agbKg,"kg"],["BGB",carbon.bgbKg,"kg"],["Total Biomassa",carbon.tbKg,"kg"],["Stok Karbon",carbon.cKg,"kg C"]].map(([l,v,u])=>(
                    <div key={l} className="flex justify-between"><span className="text-xs text-ink-muted">{l}</span><span className="text-xs font-semibold tabular">{fmt(v)} {u}</span></div>
                  ))}
                  <div className="pt-2 border-t border-line flex justify-between items-baseline">
                    <span className="text-xs font-bold text-ink">Total CO₂</span>
                    <span className="text-base font-bold text-warn tabular">{fmt(carbon.co2EqKg)} kg CO₂e</span>
                  </div>
                </div>
                <p className="text-[10px] text-ink-faint mt-3">AGB = 0.0673×(ρ×D²×H)^0.976 · BGB = AGB×0.24 · C = TB×0.47 · CO₂ = C×3.67</p>
              </div>
            )}
            {saveError&&<div className="mb-3 flex items-center gap-2 bg-bad-soft text-bad text-xs rounded-xl px-3 py-2.5"><AlertCircle size={13} className="shrink-0"/>{saveError}</div>}
            <div className="flex gap-3">
              <button onClick={()=>setStep(0)} className="flex-1 flex items-center justify-center gap-2 bg-surface-sub hover:bg-surface-hover text-ink font-medium text-sm rounded-xl py-2.5 transition-colors"><ChevronLeft size={14}/>Kembali Edit</button>
              <button onClick={handleConfirmAndGenerate} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-forest-900 hover:bg-forest-800 disabled:opacity-60 text-cream-50 font-semibold text-sm rounded-xl py-2.5 transition-colors">
                {saving?<span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:<ChevronRight size={16}/>}
                {saving?"Menyimpan...":"Simpan & Generate QR"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step===2&&(
          <div className="bg-surface rounded-2xl border border-line p-6 shadow-sm transition-colors">
            <div className="flex items-center gap-2 mb-2 text-brand"><CheckCircle2 size={18}/><h2 className="font-semibold text-ink">QR Code Siap &amp; Tersimpan</h2></div>
            <p className="text-xs text-ink-muted mb-6">Pohon berhasil disimpan ke database. QR code siap di-print dan ditempel ke batang pohon.</p>
            <div ref={qrRef} className="print-area print-area--label flex flex-col items-center gap-4 py-8 px-6 bg-surface-sub rounded-2xl border border-line mb-5">
              <div className="flex items-center gap-2 mb-1"><Leaf size={14} className="text-ink"/><span className="text-xs font-semibold text-ink uppercase tracking-wider">Inventarisasi Pohon Karbon Giricahyo</span></div>
              <QRCodeSVG value={qrValue} size={220} fgColor="#15392e" bgColor="#f6f3ea" level="M" marginSize={2}/>
              <div className="text-center space-y-1">
                <p className="font-mono-id text-ink text-sm font-bold">{savedTreeId}</p>
                <p className="text-xs text-ink-muted">{form.species} · {selectedFarmer?.name}</p>
                {carbon&&<p className="text-xs font-semibold text-brand">{fmt(carbon.co2EqKg)} kg CO₂e</p>}
              </div>
              <p className="font-mono-id text-[9px] text-ink-faint break-all text-center max-w-xs">{qrValue}</p>
            </div>
            <div className="flex gap-3 mb-3 print:hidden">
              <button onClick={handleDownload} className="flex-1 flex items-center justify-center gap-2 bg-brand hover:opacity-90 text-surface font-semibold text-sm rounded-xl py-2.5 transition-colors"><Download size={15}/>Unduh SVG</button>
              {alamatSementara() && (
                <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-warn/40 bg-warn-soft px-4 py-3 print:hidden">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warn" />
                  <div className="min-w-0 text-xs leading-relaxed text-ink">
                    <p className="font-semibold">Alamat ini sementara — jangan dipakai untuk label yang dipaku ke pohon.</p>
                    <p className="mt-0.5 text-ink-muted">
                      QR akan menunjuk ke <span className="font-mono-id break-all">{asalPublik()}</span>, yang hanya
                      berlaku selama sesi pengembangan ini. Untuk label permanen, isi dulu{" "}
                      <span className="font-mono-id">VITE_PUBLIC_BASE_URL</span> dengan domain produksi.
                    </p>
                  </div>
                </div>
              )}
              <button onClick={()=>window.print()} className="flex-1 flex items-center justify-center gap-2 bg-forest-900 hover:bg-forest-800 text-cream-50 font-semibold text-sm rounded-xl py-2.5 transition-colors"><Printer size={15}/>Print Label</button>
            </div>
            <Link to={`/pohon/${savedTreeId}`} className="block text-center w-full text-xs text-brand hover:opacity-80 font-medium mb-5 print:hidden">Lihat kartu identitas publik pohon ini →</Link>
            <button onClick={handleReset} className="w-full flex items-center justify-center gap-2 bg-surface-sub hover:bg-surface-hover text-ink font-medium text-sm rounded-xl py-2.5 transition-colors print:hidden"><RotateCcw size={14}/>Generate QR untuk Pohon Lain</button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
