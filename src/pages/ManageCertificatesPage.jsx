import { useToast } from "../lib/ToastContext";
import BuyerProfileDrawer from "../components/BuyerProfileDrawer";
import AppShell from "../components/AppShell";
import { useState } from "react";
import { Award, Search, Plus, CheckCircle2, AlertCircle, UserPlus, FileCheck, X, Eye, ShieldCheck, ShieldQuestion, Trash2 } from "lucide-react";
import CertificateModal from "../components/CertificateModal";
import CertificateLifecycleBadge from "../components/CertificateLifecycleBadge";
import BasicCarbonTierPicker from "../components/BasicCarbonTierPicker";
import CarbonTourismTierPicker from "../components/CarbonTourismTierPicker";
import EsgPartnershipTierPicker from "../components/EsgPartnershipTierPicker";
import TreeAdoptionTierPicker from "../components/TreeAdoptionTierPicker";
import { useApi, ApiState } from "../lib/useApi.jsx";
import { adoptionApi, treeApi, buyerApi, accountApi } from "../lib/api";
import { formatDate, formatNumber, formatRupiah } from "../lib/format";
import { useLanguage } from "../lib/LanguageContext";
import { BASIC_CARBON_LABEL, encodeBasicCarbonPackage, pickAvailableTree } from "../lib/basicCarbon";
import { CARBON_TOURISM_LABEL, ESG_LABEL, TREE_ADOPTION_LABEL, findTier } from "../lib/packageCatalog";
import { Badge, IconButton, ConfirmDialog, Select, FormStep } from "../components/ui";
import { ModalPortal } from '../components/ui/ModalPortal';
import DateField from "../components/ui/DateField";
import CertificateExpiryCard from "../components/CertificateExpiryCard";

// EMPAT paket, sesuai halaman 11 PDF ("4 Package Kontribusi Jasa Lingkungan
// Karbon Komunitas Giricahyo"). Sebelumnya ada ENAM baris karena ketiga ukuran
// Tree Adoption dipisah jadi paket sendiri-sendiri — padahal PDF
// menempatkannya sebagai satu paket dengan tiga tingkatan, sama seperti tiga
// paket lainnya.
const PACKAGE_OPTIONS = [
  BASIC_CARBON_LABEL,
  TREE_ADOPTION_LABEL,
  CARBON_TOURISM_LABEL,
  ESG_LABEL,
];

export default function ManageCertificatesPage() {
  const { t } = useLanguage();
  const toast = useToast();
  const [openBuyerId, setOpenBuyerId] = useState(null);
  const { data: adoptions, loading, error, refetch } = useApi(() => adoptionApi.list());
  const { data: trees }  = useApi(() => treeApi.list());
  const { data: buyers } = useApi(() => buyerApi.list());

  const [showForm, setShowForm] = useState(false);
  const [selectedAdoption, setSelectedAdoption] = useState(null);
  const [query, setQuery] = useState("");
  const [verifyingId, setVerifyingId] = useState(null);

  async function handleVerify(id) {
    setVerifyingId(id);
    try {
      await adoptionApi.verify(id);
      toast.success(t("toast_certificate_verified"));
      refetch();
    } catch (e) {
      toast.error(e.message || t("toast_failed"));
    } finally {
      setVerifyingId(null);
    }
  }

  // ── Hapus sertifikat ──────────────────────────────────────────────────────
  // Sertifikat yang dipilih untuk dihapus disimpan di state, BUKAN langsung
  // dikirim: dialog konfirmasinya perlu membacakan apa saja yang ikut hilang
  // (nomor, buyer, dana masuknya, pohon yang jadi bebas lagi), dan itu hanya
  // bisa disusun kalau barisnya masih ada di tangan.
  const [adoptionToDelete, setAdoptionToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!adoptionToDelete) return;
    setDeleting(true);
    try {
      const res = await adoptionApi.remove(adoptionToDelete.id);
      toast.success(res.message || t("toast_certificate_deleted"));
      setAdoptionToDelete(null);
      refetch();
    } catch (e) {
      toast.error(e.message || t("toast_failed"));
    } finally {
      setDeleting(false);
    }
  }

  // Daftar akibat yang dibacakan dialog. Disusun dari data barisnya sendiri —
  // angka rupiahnya nyata, bukan peringatan umum yang lama-lama diabaikan.
  function deleteConsequences(a) {
    const out = [];
    if (a.price != null) {
      out.push(`Dana masuk ${formatRupiah(a.price)} dari sertifikat ini ikut dihapus dari Carbon Fund.`);
    }
    out.push(`Pohon ${a.tree_id} kembali bebas dan bisa disertifikatkan lagi.`);
    out.push(`Nomor ${a.certificate_no} tidak akan dipakai ulang — sertifikat berikutnya memakai nomor baru.`);
    return out;
  }

  const filtered = (adoptions ?? []).filter((a) => {
    const haystack = `${a.tree_id} ${a.tree?.species ?? ""} ${a.tree?.farmer?.name ?? ""} ${a.buyer_name} ${a.certificate_no}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  return (
    <AppShell title={t("nav_certificates")} showPeriod={false}>

      {/* Dulu <main>, padahal AppShell sudah punya <main> sendiri —
          <main> bersarang bukan HTML yang sah. */}
      <div className="gjr-stagger max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Sertifikat yang mendekati jatuh tempo. Tanpa tombol perpanjang:
            membayar perpanjangan adalah keputusan pembeli, jadi tombolnya
            hanya ada di halaman buyer. Admin perlu melihat daftarnya untuk
            tahu siapa yang harus dihubungi sebelum terlambat. */}
        {/* level=2: halaman ini tidak punya SectionHeader. */}
        <CertificateExpiryCard days={90} level={2} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <div>
            <h1 className="font-bold text-ink text-lg">{t("certificates_page_title")}</h1>
            <p className="text-xs text-ink-muted mt-0.5">{t("certificates_page_desc")}</p>
          </div>
          <button onClick={() => setShowForm(true)}
            className="flex items-center justify-center gap-2 bg-gold-500 hover:bg-gold-600 text-forest-950 text-sm font-semibold rounded-xl px-4 py-2.5 transition-colors shrink-0">
            <Plus size={15}/>{t("new_certificate")}
          </button>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"/>
          <input type="text" placeholder={t("search_certificates_placeholder")}
            value={query} onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm bg-surface border border-line rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/40 text-ink"/>
        </div>

        <ApiState loading={loading} error={error}>
          <div className="space-y-3">
            {filtered.length === 0 && (
              <div className="bg-surface rounded-2xl border border-line p-8 text-center text-sm text-ink-faint">
                {t("no_certificates_match")}
              </div>
            )}
            {filtered.map((a) => (
              <div key={a.id} className="bg-surface rounded-2xl border border-line p-5 shadow-sm space-y-3 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <FileCheck size={16} className="text-warn shrink-0"/>
                    <p className="font-mono-id text-warn text-xs font-semibold">{a.certificate_no}</p>
                    <CertificateLifecycleBadge adoption={a} />
                    {a.verified_at ? (
                      <Badge tone="good">
                        <ShieldCheck size={11} className="shrink-0" />
                        {t("verified_at_label")}
                      </Badge>
                    ) : (
                      <Badge tone="neutral">
                        <ShieldQuestion size={11} className="shrink-0" />
                        {t("unverified_label")}
                      </Badge>
                    )}
                  </div>
                  <span className="text-[11px] text-ink-faint tabular shrink-0">{formatDate(a.adopted_date)}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <InfoBlock label="Pohon"          value={`${a.tree_id} — ${a.tree?.species ?? "—"}`} mono />
                  <InfoBlock label="Petani Pemilik" value={a.tree?.farmer?.name ?? "—"} />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-faint mb-0.5">Buyer / Pendukung</p>
                    <button
                      type="button"
                      onClick={() => setOpenBuyerId(a.buyer_id ?? a.buyer?.id)}
                      disabled={!(a.buyer_id ?? a.buyer?.id)}
                      className="text-sm font-bold text-warn hover:underline disabled:no-underline disabled:cursor-default text-left break-words"
                    >
                      {a.buyer_name}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 gap-3 flex-wrap">
                  <p className="text-xs text-ink-muted bg-surface-sub rounded-lg px-3 py-1.5 inline-flex items-center gap-1.5 flex-wrap">
                    <span>Paket: <span className="font-medium text-ink">{a.package_name}</span></span>
                    {a.package_tier && findTier(a.package_tier) && (
                      <span className="text-ink-faint">· {findTier(a.package_tier).name}</span>
                    )}
                    {a.price != null && (
                      <span className="font-semibold text-warn">· {formatRupiah(a.price)}</span>
                    )}
                  </p>
                  <div className="flex items-center gap-2">
                    {!a.verified_at && (
                      <IconButton
                        icon={ShieldCheck}
                        label={t("verify_certificate")}
                        variant="secondary"
                        disabled={verifyingId === a.id}
                        onClick={() => handleVerify(a.id)}
                      />
                    )}
                    <button
                      onClick={() => setSelectedAdoption(a)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-forest-900 hover:bg-forest-800 text-cream-50 font-semibold text-xs rounded-xl transition-colors"
                    >
                      <Eye size={13} />
                      <span>Lihat / Cetak PDF</span>
                    </button>
                    <IconButton
                      icon={Trash2}
                      label={t("delete_certificate")}
                      variant="danger"
                      onClick={() => setAdoptionToDelete(a)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ApiState>
      </div>

      {openBuyerId && (
        <BuyerProfileDrawer buyerId={openBuyerId} onClose={() => setOpenBuyerId(null)} />
      )}

      {showForm && (
        <NewCertificateModal
          trees={trees ?? []}
          buyers={buyers ?? []}
          adoptions={adoptions}
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); refetch(); }}
        />
      )}

      {/* Official Certificate Modal */}
      <CertificateModal
        isOpen={Boolean(selectedAdoption)}
        onClose={() => setSelectedAdoption(null)}
        adoption={selectedAdoption}
      />

      {adoptionToDelete && (
        <ConfirmDialog
          title={t("delete_certificate")}
          message={`${adoptionToDelete.certificate_no} atas nama ${adoptionToDelete.buyer_name}. Tindakan ini tidak bisa dibatalkan.`}
          consequences={deleteConsequences(adoptionToDelete)}
          confirmLabel={t("delete")}
          cancelLabel={t("cancel")}
          loading={deleting}
          onConfirm={handleDelete}
          onClose={() => setAdoptionToDelete(null)}
        />
      )}
    </AppShell>
  );
}

function InfoBlock({ label, value, mono, highlight }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-ink-faint mb-0.5">{label}</p>
      <p className={`font-medium break-words ${mono ? "font-mono-id text-xs" : ""} ${highlight ? "text-warn font-bold" : "text-ink"}`}>{value}</p>
    </div>
  );
}

function NewCertificateModal({ trees, buyers, adoptions, onClose, onSuccess }) {
  const { t } = useLanguage();
  // Bug lama: handleSubmit sudah memanggil toast.success di bawah, tapi
  // komponen ini tidak pernah punya hook-nya sendiri (beda scope dari
  // ManageCertificatesPage) — akan throw "toast is not defined" persis saat
  // sertifikat berhasil dibuat, untuk SEMUA paket. Diperbaiki sekalian.
  const toast = useToast();
  const [mode, setMode]             = useState("existing");
  const [treeId, setTreeId]         = useState("");
  const [buyerId, setBuyerId]       = useState("");
  const [newBuyerName, setNewBuyerName] = useState("");
  const [newBuyerEmail, setNewBuyerEmail] = useState("");
  const [packageName, setPackageName]   = useState(PACKAGE_OPTIONS[0]);
  const [basicTier, setBasicTier]       = useState("small");
  const [tourismTier, setTourismTier]   = useState("half_day");
  const [esgTier, setEsgTier]           = useState("bronze");
  const [treeTier, setTreeTier]         = useState("tree_1");
  const [adoptedDate, setAdoptedDate]   = useState(new Date().toISOString().split("T")[0]);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState(null);
  const [loading, setLoading]       = useState(false);

  const isBasicCarbon = packageName === BASIC_CARBON_LABEL;
  const isTreeAdoption = packageName === TREE_ADOPTION_LABEL;
  const isTourism     = packageName === CARBON_TOURISM_LABEL;
  const isEsg          = packageName === ESG_LABEL;
  // Ketiganya kontribusi kelembagaan/pengalaman, bukan dukungan ke satu
  // pohon tertentu — pohon dipilihkan otomatis di balik layar (lihat
  // pickAvailableTree di bawah), sama seperti Basic Carbon sebelumnya.
  const isInstitutional = isBasicCarbon || isTourism || isEsg;

  async function handleSubmit() {
    setError("");
    if (!isInstitutional && !treeId) { setError("Pilih pohon yang didukung."); return; }
    if (isBasicCarbon && !basicTier) { setError(t("basic_carbon_choose_tier") + "."); return; }
    if (isTourism && !tourismTier) { setError("Pilih paket pengalaman Carbon Tourism."); return; }
    if (isEsg && !esgTier) { setError("Pilih tingkat ESG/CSR Partnership."); return; }
    if (isTreeAdoption && !treeTier) { setError("Pilih jumlah pohon yang diadopsi."); return; }

    let finalBuyerId = buyerId;

    if (mode === "new") {
      if (!newBuyerName.trim()) { setError("Nama buyer baru wajib diisi."); return; }
      try {
        const { account } = await accountApi.create({
          name:     newBuyerName.trim(),
          email:    newBuyerEmail.trim() || `buyer_${Date.now()}@giricahyo.id`,
          password: "buyer123",
          role:     "buyer",
        });
        finalBuyerId = account.linked_id;
      } catch (e) {
        setError(e.message); return;
      }
    } else if (!buyerId) {
      setError("Pilih buyer yang sudah ada, atau beralih ke 'Buyer Baru'."); return;
    }

    let finalTreeId = treeId;
    let finalPackageName = packageName;
    let finalPackageTier = null;
    // Tree Adoption tetap terikat pohon nyata (bukan kontribusi kelembagaan),
    // jadi tingkatnya dikirim TANPA melewati cabang pemilihan pohon otomatis.
    if (isTreeAdoption) finalPackageTier = treeTier;

    if (isInstitutional) {
      // Kontribusi umum, bukan per-pohon — tree_id tetap dikirim di balik
      // layar karena kolomnya wajib terisi DAN unik (satu pohon = satu
      // adopsi seumur hidup, lihat lib/basicCarbon.js), tapi tidak dipilih
      // pengguna. Dipilih pohon yang belum pernah punya adopsi sama sekali.
      const picked = pickAvailableTree(trees, adoptions);
      if (!picked) {
        setError("Semua pohon yang terdaftar sudah punya sertifikat (adopsi/kontribusi) aktif — tidak ada pohon tersisa untuk kontribusi baru. Tambahkan pohon baru dulu di menu Pohon.");
        return;
      }
      finalTreeId = picked.id;
      if (isBasicCarbon) {
        finalPackageName = encodeBasicCarbonPackage(basicTier);
        finalPackageTier = basicTier;
      } else if (isTourism) {
        finalPackageTier = tourismTier;
      } else if (isEsg) {
        finalPackageTier = esgTier;
      }
    }

    setLoading(true);
    try {
      const res = await adoptionApi.create({
        tree_id: finalTreeId,
        buyer_id: finalBuyerId,
        package_name: finalPackageName,
        package_tier: finalPackageTier,
        adopted_date: adoptedDate,
      });
      toast.success(t("toast_certificate_created"));
      setSuccess(res.adoption);
      onSuccess?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <ModalPortal onClose={onClose}>
      <div className="gjr-overlay-in fixed inset-0 bg-forest-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="gjr-panel-in bg-surface rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl">
          <CheckCircle2 size={32} className="text-brand mx-auto mb-3"/>
          <p className="font-bold text-ink mb-1">Sertifikat Berhasil Dibuat</p>
          <p className="font-mono-id text-warn text-sm mb-4">{success.certificate_no}</p>
          <p className="text-xs text-ink-muted mb-5">Sertifikat ini sekarang dapat dilihat di dashboard masing-masing.</p>
          <button onClick={onClose} className="w-full bg-forest-900 text-cream-50 text-sm font-semibold rounded-xl py-2.5 hover:bg-forest-800 transition-colors">Tutup</button>
        </div>
      </div>
      </ModalPortal>
    );
  }

  const inputCls = "w-full text-sm bg-surface-sub border border-line rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/40 text-ink";

  return (
    <ModalPortal onClose={onClose}>
    <div className="gjr-overlay-in fixed inset-0 bg-forest-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Panel dirombak jadi kolom fleks tiga bagian: kepala tetap, ISI yang
          bergulir, kaki tetap. Sebelumnya seluruh panel yang bergulir
          (`overflow-y-auto` di panel ber-`rounded-3xl`), dan itu menimbulkan
          dua hal yang terlihat berantakan: batang gulirnya terpotong sudut
          membulat panel lalu menempel persis di lengkungannya, dan tombol
          "Buat Sertifikat" ikut hanyut ke bawah sehingga harus dicari dengan
          menggulir. Sekarang batang gulir hidup di dalam kotak isi yang
          bersudut siku, jauh dari lengkungan, dan tombolnya selalu terlihat.

          Lebarnya max-w-md (448px) → max-w-3xl (768px). Pada 448px, tiga
          kartu tingkatan cuma kebagian ~120px masing-masing sehingga judul
          sependek "CARBON DISCOVERY" pun patah jadi dua baris. Ruang layarnya
          memang ada; yang membuatnya sempit cuma angka itu. */}
      <div className="gjr-panel-in bg-surface rounded-3xl max-w-3xl w-full max-h-[88vh] flex flex-col overflow-hidden shadow-2xl" onClick={(e)=>e.stopPropagation()}>
        <div className="shrink-0 bg-forest-900 text-cream-50 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2"><Award size={17} className="text-warn"/><span className="font-semibold text-sm">Sertifikat Baru</span></div>
          <button onClick={onClose} aria-label={t("close")} title={t("close")} className="text-cream-50/60 hover:text-cream-50 transition-colors"><X size={18}/></button>
        </div>
        {/* min-h-0 wajib: tanpa itu anak fleks menolak menyusut lebih kecil
            daripada isinya, dan panel ikut melewati batas 88vh. */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <p className="text-xs text-ink-muted bg-surface-sub rounded-lg p-3">Gunakan ini setelah pembayaran buyer sudah dikonfirmasi diterima koperasi.</p>

          {/* ── Urutan pengisian: SIAPA → KAPAN → APA ───────────────────────
              Sebelumnya urutannya Pohon → Buyer → Paket → (kartu tingkat) →
              Tanggal, dan itu menyulitkan karena dua hal.

              Pertama, "Pohon yang Didukung" berada DI ATAS pemilih paket
              padahal kemunculannya ditentukan oleh paket: admin memilih paket
              di bawah, lalu sebuah kolom baru menyembul di atas — di luar arah
              pandangnya. Sekarang kolom itu berada tepat di bawah paket yang
              memunculkannya.

              Kedua, Tanggal Adopsi terletak SESUDAH deretan kartu tingkatan,
              blok paling besar di form ini. Mengisi dari atas ke bawah berarti
              menabrak blok besar itu dulu, baru menemukan satu kolom kecil di
              seberangnya.

              Urutan sekarang mengikuti pertanyaan yang wajar: siapa yang
              berkontribusi, kapan, lalu paket apa — dan keputusan terbesar
              (paket) berada persis di atas tombol simpan. */}
          <div className="grid gap-4 md:grid-cols-2">
            <FormStep n={1} label="Buyer / Pendukung" wajib>
              <div className="flex gap-2 mb-2">
                {["existing","new"].map((m)=>(
                  <button key={m} onClick={()=>setMode(m)}
                    className={`flex-1 text-xs font-medium rounded-lg py-2 transition-colors ${mode===m?"bg-forest-900 text-cream-50":"bg-surface-sub text-ink-muted"}`}>
                    {m==="existing"?"Sudah Ada":<><UserPlus size={12} className="inline mr-1"/>Buyer Baru</>}
                  </button>
                ))}
              </div>
              {mode==="existing"
                ? <Select
                    value={buyerId}
                    onChange={(e)=>setBuyerId(e.target.value)}
                    options={buyers.map(b=>({ value: b.id, label: b.name }))}
                    placeholder="Pilih buyer..."
                    ariaLabel="Buyer / Pendukung"
                  />
                : <div className="space-y-2">
                    <input type="text" placeholder="Nama buyer (orang/perusahaan)" value={newBuyerName} onChange={(e)=>setNewBuyerName(e.target.value)} className={inputCls}/>
                    <input type="email" placeholder="Email (opsional)" value={newBuyerEmail} onChange={(e)=>setNewBuyerEmail(e.target.value)} className={inputCls}/>
                  </div>
              }
            </FormStep>

            <FormStep n={2} label="Tanggal Adopsi">
              <DateField value={adoptedDate} onChange={(e)=>setAdoptedDate(e.target.value)}/>
            </FormStep>
          </div>

          <FormStep n={3} label="Paket Kontribusi" wajib>
            <Select
              value={packageName}
              onChange={(e)=>setPackageName(e.target.value)}
              options={PACKAGE_OPTIONS.map(p=>({ value: p, label: p }))}
              ariaLabel="Paket Kontribusi"
            />

            {/* Semua yang bergantung pada paket hidup DI DALAM langkah 3, jadi
                apa pun yang muncul selalu tampil di bawah pilihan yang
                memunculkannya. */}
            <div className="mt-3 space-y-3">
              {!isInstitutional && (
                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1.5">Pohon yang Didukung <span className="text-bad">*</span></label>
                  <Select
                    value={treeId}
                    onChange={(e)=>setTreeId(e.target.value)}
                    options={trees.map((tr)=>({
                      value: tr.id,
                      label: `${tr.id} — ${tr.species}`,
                      hint: `${formatNumber(tr.co2_eq_kg??tr.co2EqKg??0,1)} kg CO₂e`,
                    }))}
                    placeholder="Pilih pohon..."
                    ariaLabel="Pohon yang Didukung"
                  />
                </div>
              )}
              {isBasicCarbon && (
                <BasicCarbonTierPicker value={basicTier} onChange={setBasicTier} />
              )}
              {isTourism && (
                <CarbonTourismTierPicker value={tourismTier} onChange={setTourismTier} />
              )}
              {isEsg && (
                <EsgPartnershipTierPicker value={esgTier} onChange={setEsgTier} />
              )}
              {isTreeAdoption && (
                <TreeAdoptionTierPicker value={treeTier} onChange={setTreeTier} />
              )}
            </div>
          </FormStep>
        </div>

        {/* Kaki tetap. Galat dan tombol simpan tidak lagi ikut hanyut ke bawah
            bersama isi form. */}
        <div className="shrink-0 border-t border-line px-6 py-4 space-y-3">
          {error && (
            <div className="flex items-center gap-2 bg-bad-soft text-bad text-xs rounded-lg p-3">
              <AlertCircle size={13} className="shrink-0"/>{error}
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-forest-900 hover:bg-forest-800 disabled:opacity-60 text-cream-50 font-semibold text-sm rounded-xl py-3 transition-colors">
            {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>}
            {loading ? "Menyimpan..." : "Buat Sertifikat"}
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}

