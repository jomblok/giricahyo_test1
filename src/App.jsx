import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./lib/AuthContext";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import FarmerDashboardPage from "./pages/FarmerDashboardPage";
import BuyerDashboardPage from "./pages/BuyerDashboardPage";
import PublicTreePage from "./pages/PublicTreePage";
import GenerateQrPage from "./pages/GenerateQrPage";
import ManageCertificatesPage from "./pages/ManageCertificatesPage";
import ManageUsersPage from "./pages/ManageUsersPage";

// Route guard: redirect ke /login kalau belum login
function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

// Router ke dashboard sesuai role
function DashboardRouter() {
  const { user } = useAuth();
  if (user?.role === "farmer") return <FarmerDashboardPage />;
  if (user?.role === "buyer")  return <BuyerDashboardPage />;
  return <DashboardPage />; // admin default
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Halaman publik */}
        <Route path="/login" element={<LoginRedirect />} />
        <Route path="/pohon/:id" element={<PublicTreePage />} />

        {/* Halaman yang butuh login */}
        <Route path="/" element={<PrivateRoute><DashboardRouter /></PrivateRoute>} />
        <Route path="/generate-qr" element={<PrivateRoute><AdminOnly><GenerateQrPage /></AdminOnly></PrivateRoute>} />
        <Route path="/sertifikat" element={<PrivateRoute><AdminOnly><ManageCertificatesPage /></AdminOnly></PrivateRoute>} />
        <Route path="/pengguna" element={<PrivateRoute><AdminOnly><ManageUsersPage /></AdminOnly></PrivateRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function LoginRedirect() {
  const { user } = useAuth();
  return user ? <Navigate to="/" replace /> : <LoginPage />;
}

// Guard khusus: hanya admin yang bisa akses
function AdminOnly({ children }) {
  const { user } = useAuth();
  return user?.role === "admin" ? children : <Navigate to="/" replace />;
}
