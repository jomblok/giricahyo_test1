import { useState, useEffect } from "react";
import { Leaf, Wind, Award, TreeDeciduous, FileCheck, Camera, Eye, ImageOff, User, Sprout, Clock, Check, Compass, Building2, Calendar, Ruler, MapPin } from "lucide-react";
import AppShell from "../components/AppShell";
import CertificateModal from "../components/CertificateModal";
import AdoptTreeModal from "../components/AdoptTreeModal";
import TreeGrowthChart from "../components/TreeGrowthChart";
import FarmerBadgeCard from "../components/FarmerBadgeCard";
import CertificateLifecycleBadge from "../components/CertificateLifecycleBadge";
import CarbonEquivalents from "../components/CarbonEquivalents";
import { useAuth } from "../lib/AuthContext";
import { useApi, ApiState } from "../lib/useApi.jsx";
import { buyerApi, treeApi } from "../lib/api";
import { formatNumber, formatDate } from "../lib/format";
import { useLanguage } from "../lib/LanguageContext";
import { parseBasicCarbonTier, getCertificateLifecycle, formatRupiahShort, formatDuration } from "../lib/basicCarbon";
import { labelPaketAdopsi } from "../lib/packageCatalog";
import { Card, HealthBadge, StatCard, EmptyState, SkeletonCards } from "../components/ui";
import { pakaiFotoTidakAda } from "../lib/fotoTidakAda";
import { gambarJenis } from "../lib/fotoJenis";

// Package 3 & 4 dari PDF "Penguatan Manajemen Bisnis Karbon" — Carbon Tourism
// Experience dan ESG/CSR Partnership. Sama seperti Basic Carbon, keduanya
// kontribusi kelembagaan/pengalaman, bukan dukungan ke satu pohon tertentu,
// jadi dapat kartunya sendiri alih-alih jatuh ke kartu Tree Adoption generik
// (yang sebelumnya menampilkan info pohon yang tidak relevan bagi buyer ini).
const INSTITUTIONAL_PACKAGES = {
  "Carbon Tourism Experience": { icon: Compass, labelKey: "package_tourism_label", descKey: "package_tourism_desc" },
  "ESG/CSR Partnership":       { icon: Building2, labelKey: "package_esg_label", descKey: "package_esg_desc" },
};

// Katalog pohon yang belum diadopsi.
//
// Diekstrak dari badan halaman karena harus muncul di DUA tempat. Sebelumnya
// katalog ini hanya ada di tampilan utama, yang baru dirender kalau buyer
// SUDAH punya minimal satu adopsi — di atasnya ada keluar-awal yang
// menampilkan "hubungi koperasi". Jadi buyer baru tidak punya jalan sama
// sekali untuk mengadopsi dari aplikasi: katalognya ada, tapi terkunci di
// balik syarat yang justru hanya bisa dipenuhi lewat katalog itu.
function KatalogAdopsi({ trees, onPilih }) {
  const { t } = useLanguage();

  return (
    <section className="pt-6 border-t border-line">
      <div className="flex items-end justify-between mb-4 px-1">
        <div>
          <h2 className="text-sm font-bold text-ink flex items-center gap-2">
            <Leaf size={15} className="text-brand" />
            {t("trees_available_for_adoption")}
          </h2>
          <p className="text-xs text-ink-muted mt-0.5 max-w-sm">
            {t("trees_available_for_adoption_desc")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {trees.length > 0 ? (
          trees.map((tree) => {
            // Endpoint asli backend pakai snake_case + farmer_name rata
            // (konsisten dengan treeApi.list()); fallback mock lokal
            // (lib/joins.js) pakai camelCase + objek farmer bersarang.
            // Baca keduanya supaya kartu ini benar di kedua sumber data.
            const healthStatus = tree.health_status ?? tree.healthStatus ?? "baik";
            const co2EqKg = tree.co2_eq_kg ?? tree.co2EqKg;
            const heightM = tree.height_m ?? tree.heightM;
            const farmerName = tree.farmer_name ?? tree.farmer?.name;
            const gambar = gambarJenis(tree.species);
            return (
            <Card key={tree.id} hoverable className="flex flex-col gap-4 overflow-hidden">
              {/* Pita gambar jenis — bahasa visual yang sama dengan kartu jenis
                  di Ringkasan. Katalog ini sebelumnya teks penuh, dan kartu
                  adopsi tanpa gambar sulit dibedakan satu sama lain saat
                  calon pendukung menelusurinya.

                  Ilustrasi, bukan foto pohon ini. Menampilkan gambar pohon
                  lain tepat di atas ID "GJR-L2-003" dan angka CO2-nya akan
                  terbaca sebagai foto pohon tersebut — lihat lib/fotoTidakAda.js. */}
              <div className="relative -mx-5 -mt-5 h-24 overflow-hidden bg-surface-sub">
                <img
                  src={gambar.src}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                {/* SELALU ADA DI SINI, beda dengan kartu di Ringkasan.
                    Kartu itu berjudul "Jati — 86 pohon", jadi gambar jenis
                    memang isinya. Kartu INI berjudul "GJR-L1-001": sebuah
                    pohon tertentu, lengkap dengan petani dan serapan CO2-nya.
                    Foto jenis tanpa keterangan di posisi itu akan terbaca
                    sebagai foto pohon tersebut — dan pembeli memutuskan
                    mendanai berdasarkan apa yang mereka lihat.

                    Isinya mengikuti gambarnya. Menyebut foto sungguhan
                    sebagai "ilustrasi" sama menyesatkannya dengan tidak
                    memberi keterangan sama sekali. */}
                <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-ink/70 px-2 py-0.5 text-[10px] font-semibold text-surface">
                  {gambar.sementara ? t("illustration") : t("species_photo_not_this_tree")}
                </span>
              </div>

              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] text-brand font-mono-id tracking-widest">{tree.id}</p>
                  <h3 className="font-bold text-ink text-xl">{tree.species}</h3>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-ink-muted">
                    <User size={12} />
                    <span className="truncate">{farmerName || t("farmer")}</span>
                  </div>
                </div>
                <HealthBadge
                  status={healthStatus}
                  label={t(`health_${healthStatus}`)}
                />
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-2 bg-surface-sub p-3 rounded-xl border border-line">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-ink-faint">CO₂ Diserap</p>
                  <p className="font-semibold text-ink">{formatNumber(co2EqKg, 1)} <span className="text-[10px] font-normal opacity-70">kg</span></p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-ink-faint">Tinggi</p>
                  <p className="font-semibold text-ink">{formatNumber(heightM, 1)} <span className="text-[10px] font-normal opacity-70">m</span></p>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={() => onPilih(tree)}
                className="w-full mt-2 py-2.5 rounded-xl bg-brand hover:opacity-90 text-surface font-medium text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Leaf size={16} />
                {t("adopt_now")}
              </button>
            </Card>
            );
          })
        ) : (
          <div className="col-span-full">
            <EmptyState
              icon={TreeDeciduous}
              title={t("no_trees_available")}
              description={t("all_trees_adopted")}
            />
          </div>
        )}
      </div>
    </section>
  );
}

function ImpactCard({ icon, label, value, sub, accent }) {
  return <StatCard layout="inline" icon={icon} label={label} value={value} sub={sub} accent={accent} />;
}

// Komponen Timeline Foto Pohon
function PhotoTimeline({ photos = [] }) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(null);

  if (photos.length === 0) {
    return (
      <div className="flex items-center gap-2 py-3 px-1 text-[11px] text-ink-faint italic">
        <ImageOff size={14} className="shrink-0" />
        <span>{t("no_growth_photos_yet")}</span>
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      {/* Thumbnail row (scrollable) */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {photos.map((p, idx) => (
          <button
            key={idx}
            onClick={() => setExpanded(expanded === idx ? null : idx)}
            aria-label={`${t("photo")} ${idx + 1}`}
            className={`shrink-0 w-20 rounded-xl overflow-hidden border-2 transition-all ${
              expanded === idx
                ? "border-brand shadow-md scale-105"
                : "border-line hover:border-brand/60 hover:scale-105"
            }`}
          >
            <img
              src={p.photo_url}
              alt={p.caption || "Foto pohon"}
              className="w-full h-14 object-cover"
              onError={(e) => pakaiFotoTidakAda(e, `Foto ${idx + 1} tidak tersedia`)}
            />
            <div className="px-1.5 py-1 bg-surface">
              <p className="text-[9px] text-ink-faint truncate">{p.measurement_date}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Expanded View */}
      {expanded !== null && photos[expanded] && (
        <div className="bg-surface border border-line rounded-2xl p-4 space-y-3 shadow-sm gjr-content-in">
          <img
            src={photos[expanded].photo_url}
            alt={photos[expanded].caption || "Foto pohon"}
            className="w-full h-auto rounded-xl shadow-sm border border-line"
            onError={(e) => pakaiFotoTidakAda(e, "Foto pertumbuhan tidak tersedia")}
          />
          <div>
            <p className="font-semibold text-sm text-ink">
              {photos[expanded].caption || "Foto Perkembangan Pohon"}
            </p>
            <div className="flex gap-4 mt-1 text-xs text-ink-muted">
              {photos[expanded].measurement_date && (
                <span className="inline-flex items-center gap-1"><Calendar size={11} />{photos[expanded].measurement_date}</span>
              )}
              {photos[expanded].dbh_cm && (
                <span className="inline-flex items-center gap-1"><Ruler size={11} />DBH: {photos[expanded].dbh_cm} cm</span>
              )}
              {photos[expanded].height_m && (
                <span className="inline-flex items-center gap-1"><TreeDeciduous size={11} />Tinggi: {photos[expanded].height_m} m</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Kartu untuk sertifikat Basic Carbon — kontribusi UMUM ke carbon fund
// komunitas, bukan dukungan ke satu pohon tertentu. Berbeda dari kartu Tree
// Adoption di bawah: tidak menampilkan spesies/foto pohon (buyer tidak
// memilih pohon itu — dipilihkan otomatis di balik layar, lihat
// lib/basicCarbon.js), fokus ke tingkatan, manfaat, dan masa berlaku.
function BasicCarbonBuyerCard({ adoption, tier, onViewCertificate }) {
  const { t, lang } = useLanguage();
  const lifecycle = getCertificateLifecycle(adoption);

  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="bg-brand-soft rounded-xl p-2 shrink-0">
            <Sprout size={18} className="text-brand-ink" />
          </div>
          <div>
            <p className="font-bold text-ink text-base">{tier.name}</p>
            <p className="text-xs text-ink-muted">{t("basic_carbon_contribution_label")}</p>
          </div>
        </div>
        <p className="text-sm font-bold text-warn tabular shrink-0">{formatRupiahShort(tier.price)}</p>
      </div>

      {lifecycle && (
        <div className="flex flex-wrap items-center gap-2">
          <CertificateLifecycleBadge adoption={adoption} size="md" />
          <span className="text-[11px] text-ink-faint flex items-center gap-1">
            <Clock size={11} />
            {t("valid_until")} {formatDate(lifecycle.expiresAt)} · {formatDuration(tier.months, lang)}
          </span>
        </div>
      )}

      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-ink-faint mb-1.5">
          {t("your_benefits")}
        </p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {tier.benefits.map((bKey) => (
            <li key={bKey} className="text-xs text-ink flex items-center gap-1.5">
              <Check size={12} className="text-brand shrink-0" />
              {t(bKey)}
            </li>
          ))}
        </ul>
      </div>

      {adoption.certificate_no && (
        <div className="flex items-center justify-between bg-warn-soft border border-line rounded-xl p-3">
          <div className="flex items-center gap-2">
            <FileCheck size={16} className="text-warn shrink-0" />
            <div>
              <p className="text-[10px] text-warn uppercase tracking-wide font-semibold">
                {t("official_certificate")}
              </p>
              <p className="font-mono-id text-xs font-bold text-ink">{adoption.certificate_no}</p>
            </div>
          </div>
          <button
            onClick={onViewCertificate}
            className="flex items-center gap-1 px-3 py-1.5 bg-forest-900 hover:bg-forest-800 text-cream-50 font-semibold text-xs rounded-xl transition-colors"
          >
            <Eye size={13} />
            <span>{t("view_certificate")}</span>
          </button>
        </div>
      )}
    </Card>
  );
}

// Kartu untuk Carbon Tourism Experience & ESG/CSR Partnership — juga
// kontribusi kelembagaan/pengalaman, bukan per-pohon (lihat komentar
// INSTITUTIONAL_PACKAGES di atas).
function InstitutionalPackageCard({ adoption, info, onViewCertificate }) {
  const { t } = useLanguage();
  const Icon = info.icon;

  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="bg-brand-soft rounded-xl p-2 shrink-0">
            <Icon size={18} className="text-brand-ink" />
          </div>
          <div>
            <p className="font-bold text-ink text-base">{t(info.labelKey)}</p>
            <p className="text-xs text-ink-muted">{adoption.buyer_name}</p>
          </div>
        </div>
        {adoption.adopted_date && (
          <span className="text-[11px] text-ink-faint tabular shrink-0">{formatDate(adoption.adopted_date)}</span>
        )}
      </div>

      <p className="text-xs text-ink-muted leading-relaxed">{t(info.descKey)}</p>

      {adoption.certificate_no && (
        <div className="flex items-center justify-between bg-warn-soft border border-line rounded-xl p-3">
          <div className="flex items-center gap-2">
            <FileCheck size={16} className="text-warn shrink-0" />
            <div>
              <p className="text-[10px] text-warn uppercase tracking-wide font-semibold">
                {t("official_certificate")}
              </p>
              <p className="font-mono-id text-xs font-bold text-ink">{adoption.certificate_no}</p>
            </div>
          </div>
          <button
            onClick={onViewCertificate}
            className="flex items-center gap-1 px-3 py-1.5 bg-forest-900 hover:bg-forest-800 text-cream-50 font-semibold text-xs rounded-xl transition-colors"
          >
            <Eye size={13} />
            <span>{t("view_certificate")}</span>
          </button>
        </div>
      )}
    </Card>
  );
}

export default function BuyerDashboardPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const buyerId = user?.linked_id ?? user?.linkedId ?? "B001";

  const [selectedAdoption, setSelectedAdoption] = useState(null);
  const [availableTrees, setAvailableTrees] = useState([]);
  // Pohon yang sedang ditawarkan di modal adopsi. Sebelumnya di sini ada
  // `adoptingId` untuk memutar spinner pada kartu, karena menekan tombol
  // LANGSUNG membuat adopsi paket 1 pohon tanpa buyer pernah melihat harganya.
  // Sekarang tombol hanya membuka modal; paket dan harganya dipilih di sana.
  const [pohonDiadopsi, setPohonDiadopsi] = useState(null);

  // Diekstrak jadi fungsi tersendiri (bukan cuma isi useEffect) supaya bisa
  // dipanggil ulang setelah buyer berhasil adopsi — pohon yang baru diadopsi
  // harus langsung hilang dari katalog tanpa perlu reload halaman.
  function loadAvailableTrees() {
    treeApi.available()
      .then((res) => setAvailableTrees(res))
      .catch(() => {
        // Katalog DIKOSONGKAN saat API gagal, tidak diisi data contoh.
        //
        // Sebelumnya baris ini jatuh ke lib/joins (data contoh lokal) tanpa
        // penjaga apa pun — termasuk di produksi. Data contohnya memakai ID
        // bergaya GJR-001-001 sementara pohon sungguhan GJR-L1-001, jadi yang
        // tampil adalah sepuluh pohon yang TIDAK ADA, lengkap dengan tombol
        // "Adopsi Sekarang" yang bisa ditekan. Buyer tidak punya cara
        // membedakannya dari katalog asli.
        //
        // Katalog kosong jujur; katalog berisi pohon fiktif tidak.
        setAvailableTrees([]);
      });
  }

  useEffect(() => { loadAvailableTrees(); }, []);

  const { data, loading, error, refetch } = useApi(() => buyerApi.get(buyerId), [buyerId]);

  // Dipanggil modal setelah adopsi berhasil: katalog dan ringkasan dampak
  // keduanya harus segar, karena pohonnya pindah dari satu daftar ke daftar
  // lain. Pesan sukses/gagal ditangani modal (galat tampil di dalam modal,
  // supaya buyer bisa langsung memperbaiki pilihan tanpa mengulang dari awal).
  function setelahAdopsi() {
    loadAvailableTrees();
    refetch();
  }

  const adoptions = data?.adoptions ?? [];
  const totalCo2 = data?.total_co2_kg ?? 0;

  // Buyer yang belum punya adopsi tetap melihat katalog dan modalnya. Tanpa
  // ini, layar ini jadi jalan buntu: satu-satunya jalan ke katalog adalah
  // tampilan utama di bawah, yang hanya dirender kalau adopsinya sudah ada.
  if (!loading && !error && adoptions.length === 0) {
    return (
      <AppShell title={t("nav_overview")} showPeriod={false}>
        <div className="gjr-stagger space-y-8">
          <div className="py-10 flex flex-col items-center text-center gap-4">
            <div className="bg-surface-sub border border-line rounded-2xl p-5">
              <TreeDeciduous size={40} className="text-ink-faint mx-auto" strokeWidth={1.5} />
            </div>
            <h2 className="font-bold text-ink text-lg">{t("no_adopted_trees")}</h2>
            {/* Paket kelembagaan (Carbon Tourism, ESG/CSR) memang masih lewat
                koperasi, jadi kalimat ini tetap benar — tapi sekarang bukan
                satu-satunya pilihan yang ditawarkan. */}
            <p className="text-sm text-ink-muted max-w-xs">{t("contact_coop_for_adoption")}</p>
          </div>

          <KatalogAdopsi trees={availableTrees} onPilih={setPohonDiadopsi} />
        </div>

        <AdoptTreeModal
          isOpen={Boolean(pohonDiadopsi)}
          onClose={() => setPohonDiadopsi(null)}
          tree={pohonDiadopsi}
          onAdopted={setelahAdopsi}
        />
      </AppShell>
    );
  }

  return (
    <AppShell title={t("nav_overview")} showPeriod={false}>
      <div className="gjr-stagger space-y-8">

        {/* Welcome */}
        <div className="flex items-center gap-3">
          <div className="bg-warn-soft rounded-xl p-2.5">
            <Leaf size={20} className="text-warn" />
          </div>
          <div>
            <h2 className="font-bold text-ink text-lg">
              {t("buyer_welcome")} {user?.name}
            </h2>
            <p className="text-xs text-ink-muted">
              {t("buyer_welcome_sub")}
            </p>
          </div>
        </div>

        {/* Impact Cards */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-faint mb-3 px-1">
            {t("support_impact")}
          </h2>
          <ApiState
            loading={loading}
            error={error}
            skeleton={<SkeletonCards count={3} cols="grid-cols-1 sm:grid-cols-3" />}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <ImpactCard
                icon={TreeDeciduous}
                label={t("trees_supported")}
                value={adoptions.length}
                sub={t("active_carbon_trees")}
                accent="sage"
              />
              <ImpactCard
                icon={Wind}
                label={t("total_co2_absorbed")}
                value={`${formatNumber(totalCo2, 1)} kg`}
                sub={t("absorbed_from_your_trees")}
                accent="forest"
              />
              <ImpactCard
                icon={Award}
                label={t("active_certificates")}
                value={adoptions.length}
                sub={t("verified_carbon_credits")}
                accent="gold"
              />
            </div>
          </ApiState>
        </section>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Tree List with Photo Timeline */}
          <div className="lg:col-span-3 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-faint px-1">
              {t("supported_trees_timeline")}
            </h2>

            <ApiState loading={loading} error={error}>
              <div className="space-y-4">
                {adoptions.map((a) => {
                  const basicTier = parseBasicCarbonTier(a.package_name);
                  if (basicTier) {
                    return (
                      <BasicCarbonBuyerCard
                        key={a.id}
                        adoption={a}
                        tier={basicTier}
                        onViewCertificate={() => setSelectedAdoption(a)}
                      />
                    );
                  }

                  const institutional = INSTITUTIONAL_PACKAGES[a.package_name];
                  if (institutional) {
                    return (
                      <InstitutionalPackageCard
                        key={a.id}
                        adoption={a}
                        info={institutional}
                        onViewCertificate={() => setSelectedAdoption(a)}
                      />
                    );
                  }

                  const tree = a.tree;
                  const farmer = a.farmer;
                  const hs = tree?.health_status ?? tree?.healthStatus;
                  const photos = a.photos ?? tree?.photos ?? [];

                  return (
                    <Card key={a.id} className="space-y-4">
                      {/* Tree Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-mono-id text-warn text-xs font-bold mb-1">{a.tree_id}</p>
                          <p className="font-bold text-ink text-base">{tree?.species ?? "—"}</p>
                          <p className="text-xs text-ink-muted mt-0.5">
                            {t("farmer")}: {farmer?.name ?? "—"} · {farmer?.group_coop}
                          </p>
                        </div>
                        {hs && <HealthBadge status={hs} label={t(`health_${hs}`)} />}
                      </div>

                      {/* Tree Stats */}
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          [t("co2_absorbed"), `${tree ? formatNumber(tree.co2_eq_kg ?? tree.co2EqKg, 1) : "—"} kg`],
                          [t("adoption_date"), a.adopted_date ? formatDate(a.adopted_date) : "—"],
                          [t("adoption_package"), labelPaketAdopsi(a.package_name, a.package_tier)],
                        ].map(([lbl, val]) => (
                          <div key={lbl} className="bg-surface-sub rounded-xl p-3 text-center">
                            <p className="text-[10px] uppercase tracking-wide text-ink-faint mb-1">{lbl}</p>
                            <p className="text-xs font-bold text-ink leading-tight">{val}</p>
                          </div>
                        ))}
                      </div>

                      {/* Koordinat pohon sudah lama ada di data tapi tidak
                          pernah ditawarkan sebagai tujuan. Buyer yang ingin
                          melihat pohonnya harus menyalin angka desimalnya
                          sendiri. Tautan ini membuka peta pada titik itu.
                          target="_blank" + rel noopener: halaman peta tidak
                          boleh memegang referensi ke dasbor ini. */}
                      {tree?.latitude != null && tree?.longitude != null && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${tree.latitude},${tree.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 rounded-xl border border-line bg-surface-sub px-3 py-2 text-xs font-medium text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
                        >
                          <MapPin size={14} className="shrink-0" />
                          {t("visit_my_tree")}
                          <span className="font-mono-id text-[10px] tabular-nums text-ink-faint">
                            {Number(tree.latitude).toFixed(4)}, {Number(tree.longitude).toFixed(4)}
                          </span>
                        </a>
                      )}

                      {/* Riwayat serapan karbon. Deretnya diambil saat panel
                          dibuka saja — kartu ini bisa muncul puluhan kali di
                          satu layar. */}
                      <TreeGrowthChart treeId={a.tree_id} />

                      <FarmerBadgeCard
                        farmerId={tree?.farmer_id ?? farmer?.id}
                        farmerName={farmer?.name ?? tree?.farmer?.name}
                      />

                      {/* === FOTO PERKEMBANGAN POHON (Bisa Dilihat Buyer) === */}
                      <div className="bg-brand-soft/60 rounded-2xl p-4 border border-line">
                        <div className="flex items-center gap-2 mb-2">
                          <Camera size={15} className="text-brand shrink-0" />
                          <h4 className="font-semibold text-sm text-ink">
                            {t("tree_growth_photo_timeline")}
                          </h4>
                          {photos.length > 0 && (
                            <span className="ml-auto text-[11px] bg-brand-soft text-brand-ink px-2 py-0.5 rounded-full font-semibold">
                              {photos.length} foto
                            </span>
                          )}
                        </div>
                        <PhotoTimeline photos={photos} />
                      </div>

                      {/* Certificate */}
                      {a.certificate_no && (
                        <div className="flex items-center justify-between bg-warn-soft border border-line rounded-xl p-3">
                          <div className="flex items-center gap-2">
                            <FileCheck size={16} className="text-warn shrink-0" />
                            <div>
                              <p className="text-[10px] text-warn uppercase tracking-wide font-semibold">
                                {t("official_certificate")}
                              </p>
                              <p className="font-mono-id text-xs font-bold text-ink">{a.certificate_no}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedAdoption(a)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-forest-900 hover:bg-forest-800 text-cream-50 font-semibold text-xs rounded-xl transition-colors"
                          >
                            <Eye size={13} />
                            <span>{t("view_certificate")}</span>
                          </button>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </ApiState>
          </div>

          {/* Environmental Impact */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-faint px-1">
              {t("environmental_equivalents")}
            </h2>
            <CarbonEquivalents totalCo2={totalCo2} />
          </div>
        </div>

        <KatalogAdopsi trees={availableTrees} onPilih={setPohonDiadopsi} />

        <footer className="text-center text-[11px] text-ink-faint pt-4 pb-2">
          {t("buyer_footer")}
        </footer>
      </div>

      {/* Certificate Modal */}
      <CertificateModal
        isOpen={Boolean(selectedAdoption)}
        onClose={() => setSelectedAdoption(null)}
        adoption={selectedAdoption}
      />

      <AdoptTreeModal
        isOpen={Boolean(pohonDiadopsi)}
        onClose={() => setPohonDiadopsi(null)}
        tree={pohonDiadopsi}
        onAdopted={setelahAdopsi}
      />
    </AppShell>
  );
}
