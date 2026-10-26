import { lazy, Suspense } from "react";

// PANEL AUDIT TAMPILAN — hanya saat pengembangan.
//
// lazy() + import.meta.env.DEV: Rollup mengganti DEV dengan konstanta
// `false` saat build, sehingga cabang di bawah mati dan SELURUH src/dev/
// tidak ikut ke bundel produksi. Diperiksa dengan menggeledah hasil build.
const PanelAudit = import.meta.env.DEV ? lazy(() => import("./dev/PanelAudit")) : null;
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { useAuth } from "./lib/AuthContext";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import PageFallback from "./components/PageFallback";

// Ketiga dashboard ini dimuat sesuai peran. Sebelumnya ketiganya diimpor
// serentak, jadi seorang petani ikut mengunduh dashboard admin lengkap dengan
// Recharts + Leaflet-nya — dan halaman LOGIN pun menyeret keduanya (terukur
// 962 kB JS sebelum orang sempat memasukkan password). Sekarang tiap peran
// hanya mengunduh dashboard-nya sendiri.
const DashboardPage         = lazy(() => import("./pages/DashboardPage"));
const FarmerDashboardPage   = lazy(() => import("./pages/FarmerDashboardPage"));
const BuyerDashboardPage    = lazy(() => import("./pages/BuyerDashboardPage"));

// Halaman berat dimuat saat dibutuhkan saja: peta (Leaflet), QR, dan kamera
// tidak perlu ikut bundel awal yang dilihat semua orang saat login.
const PublicTreePage        = lazy(() => import("./pages/PublicTreePage"));
const GenerateQrPage        = lazy(() => import("./pages/GenerateQrPage"));
const BulkQrPage        = lazy(() => import("./pages/BulkQrPage"));
const NeedsActionPage        = lazy(() => import("./pages/NeedsActionPage"));
const AuditLogPage        = lazy(() => import("./pages/AuditLogPage"));
const MeasurementCyclesPage        = lazy(() => import("./pages/MeasurementCyclesPage"));
const GroupComparisonPage        = lazy(() => import("./pages/GroupComparisonPage"));
const MyCertificatesSheetPage        = lazy(() => import("./pages/MyCertificatesSheetPage"));
const PublicImpactPage        = lazy(() => import("./pages/PublicImpactPage"));
const ManageCertificatesPage= lazy(() => import("./pages/ManageCertificatesPage"));
const ManageUsersPage       = lazy(() => import("./pages/ManageUsersPage"));
const TreesPage             = lazy(() => import("./pages/TreesPage"));
const SpeciesCatalogPage    = lazy(() => import("./pages/SpeciesCatalogPage"));
const FarmersPage           = lazy(() => import("./pages/FarmersPage"));
const MapPage               = lazy(() => import("./pages/MapPage"));
const MyGardenMapPage               = lazy(() => import("./pages/MyGardenMapPage"));
const FundTransparencyPage               = lazy(() => import("./pages/FundTransparencyPage"));
const MeasurementGuidePage               = lazy(() => import("./pages/MeasurementGuidePage"));
const FundPage              = lazy(() => import("./pages/FundPage"));
const MyTreesPage           = lazy(() => import("./pages/MyTreesPage"));
const MySalaryPage          = lazy(() => import("./pages/MySalaryPage"));
const RegisterTreePage      = lazy(() => import("./pages/RegisterTreePage"));
const MyReportsPage         = lazy(() => import("./pages/MyReportsPage"));
const VerifyReportsPage     = lazy(() => import("./pages/VerifyReportsPage"));
const PrintReportPage       = lazy(() => import("./pages/PrintReportPage"));
const SupportedTreesPage    = lazy(() => import("./pages/SupportedTreesPage"));
const MyImpactPage          = lazy(() => import("./pages/MyImpactPage"));

// Route guard: redirect ke /login kalau belum login
function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

// Guard per role. `roles` berisi daftar role yang boleh masuk.
function RoleOnly({ roles, children }) {
  const { user } = useAuth();
  return roles.includes(user?.role) ? children : <Navigate to="/" replace />;
}

// Router ke dashboard sesuai role
function DashboardRouter() {
  const { user } = useAuth();
  if (user?.role === "farmer") return <FarmerDashboardPage />;
  if (user?.role === "buyer")  return <BuyerDashboardPage />;
  return <DashboardPage />; // admin default
}

// Halaman publik pohon DIPASANG ULANG setiap kali ID-nya berganti.
//
// Tanpa key, berpindah dari /pohon/A ke /pohon/B memakai ulang komponen yang
// sama beserta seluruh state-nya: data pohon A tetap tersimpan selama data B
// dimuat, dan kalau B gagal dimuat, kartu A tetap terpampang di bawah alamat
// B tanpa peringatan apa pun. Mengosongkan state satu per satu mudah terlewat
// satu (foto, modal, status simpan); key membuang semuanya sekaligus.
function RutePohonPublik() {
  const { id } = useParams();
  return <PublicTreePage key={id} />;
}

const admin  = (el) => <PrivateRoute><RoleOnly roles={["admin"]}>{el}</RoleOnly></PrivateRoute>;
const farmer = (el) => <PrivateRoute><RoleOnly roles={["farmer"]}>{el}</RoleOnly></PrivateRoute>;
const buyer  = (el) => <PrivateRoute><RoleOnly roles={["buyer"]}>{el}</RoleOnly></PrivateRoute>;

export default function App() {
  return (
    <BrowserRouter>
      <div className="relative min-h-screen bg-ground text-ink transition-colors">
        <Suspense fallback={<PageFallback />}>
          <Routes>
            {/* Publik */}
            <Route path="/login"     element={<LoginRedirect />} />
            <Route path="/pohon/:id" element={<RutePohonPublik />} />
            {/* Publik, tanpa login — dibuka lewat token acak. */}
            <Route path="/dampak-publik/:token" element={<PublicImpactPage />} />

            {/* Ringkasan — isinya tetap lengkap seperti sebelumnya */}
            <Route path="/" element={<PrivateRoute><DashboardRouter /></PrivateRoute>} />

            {/* Admin */}
            <Route path="/pohon"       element={admin(<TreesPage />)} />
            <Route path="/jenis-pohon" element={admin(<SpeciesCatalogPage />)} />
            <Route path="/petani"      element={admin(<FarmersPage />)} />
            <Route path="/peta"        element={admin(<MapPage />)} />
            <Route path="/dana"        element={admin(<FundPage />)} />
            <Route path="/sertifikat"  element={admin(<ManageCertificatesPage />)} />
            <Route path="/pengguna"    element={admin(<ManageUsersPage />)} />
            <Route path="/generate-qr" element={admin(<GenerateQrPage />)} />
            <Route path="/qr-massal"   element={admin(<BulkQrPage />)} />
            {/* Menyetujui laporan mengubah data karbon resmi, jadi admin saja. */}
            <Route path="/laporan"       element={admin(<VerifyReportsPage />)} />
            <Route path="/perlu-tindakan" element={admin(<NeedsActionPage />)} />
            <Route path="/audit" element={admin(<AuditLogPage />)} />
            <Route path="/periode-ukur" element={admin(<MeasurementCyclesPage />)} />
            <Route path="/perbandingan" element={admin(<GroupComparisonPage />)} />
            <Route path="/laporan-cetak" element={admin(<PrintReportPage />)} />

            {/* Petani */}
            <Route path="/pohon-saya" element={farmer(<MyTreesPage />)} />
            <Route path="/gaji"       element={farmer(<MySalaryPage />)} />
            {/* Petani mencatat dari lapangan; keduanya masuk antrean verifikasi. */}
            <Route path="/daftar-pohon" element={farmer(<RegisterTreePage />)} />
            <Route path="/laporan-saya" element={farmer(<MyReportsPage />)} />
            <Route path="/peta-kebun" element={farmer(<MyGardenMapPage />)} />
            <Route path="/dana-desa" element={farmer(<FundTransparencyPage />)} />
            <Route path="/cara-ukur" element={farmer(<MeasurementGuidePage />)} />

            {/* Buyer */}
            <Route path="/dukungan" element={buyer(<SupportedTreesPage />)} />
            <Route path="/dampak"   element={buyer(<MyImpactPage />)} />
            <Route path="/sertifikat-saya" element={buyer(<MyCertificatesSheetPage />)} />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>

        {/* Di luar <Suspense> rute: panel harus tetap bisa dibuka walau
            halamannya sendiri sedang memuat atau gagal. */}
        {PanelAudit && (
          <Suspense fallback={null}>
            <PanelAudit />
          </Suspense>
        )}
      </div>
    </BrowserRouter>
  );
}

function LoginRedirect() {
  const { user } = useAuth();
  return user ? <Navigate to="/" replace /> : <LoginPage />;
}
