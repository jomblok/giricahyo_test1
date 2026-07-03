import { Leaf, PlusSquare, Award, LogOut, Users } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import ScanBarcodeButton from "./ScanBarcodeButton";
import { useAuth } from "../lib/AuthContext";

const ROLE_BADGE = {
  admin: "bg-forest-700 text-cream-50/80",
  farmer: "bg-sage-500/30 text-sage-400",
  buyer: "bg-gold-500/20 text-gold-500",
};
const ROLE_LABEL = { admin: "Admin", farmer: "Petani", buyer: "Buyer" };

const ADMIN_NAV = [
  { to: "/generate-qr", label: "Generate QR", icon: PlusSquare },
  { to: "/sertifikat",  label: "Kelola Sertifikat", icon: Award },
  { to: "/pengguna",    label: "Kelola Pengguna", icon: Users },
];

export default function Header() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  return (
    <header className="bg-forest-900 text-cream-50">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-4 flex items-center justify-between gap-3">
        {/* Logo */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="bg-sage-500/20 rounded-xl p-2 shrink-0">
            <Leaf size={22} className="text-sage-400" strokeWidth={2.2} />
          </div>
          <div className="leading-tight min-w-0">
            <h1 className="font-bold text-base md:text-lg tracking-tight">Giricahyo Carbon</h1>
            <p className="text-[11px] text-cream-50/55 hidden sm:block">Manajemen Bisnis Karbon Komunitas</p>
          </div>
        </div>

        {/* Aksi */}
        <div className="flex items-center gap-2 md:gap-3">
          <ScanBarcodeButton />

          <div className="flex items-center gap-2 pl-3 border-l border-cream-50/15">
            <div className="hidden lg:block leading-tight text-right">
              <p className="text-sm font-semibold">{user?.name}</p>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${ROLE_BADGE[user?.role]}`}>
                {ROLE_LABEL[user?.role]}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-sage-500 flex items-center justify-center text-xs font-bold text-forest-950 shrink-0">
              {user?.name?.[0] ?? "?"}
            </div>
            <button onClick={logout} title="Keluar" className="text-cream-50/40 hover:text-cream-50 transition-colors p-1" aria-label="Keluar">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Baris navigasi khusus admin — tetap terlihat di semua ukuran layar,
          diletakkan di baris terpisah supaya tidak sesak di mobile. */}
      {user?.role === "admin" && (
        <div className="border-t border-cream-50/10">
          <div className="max-w-[1400px] mx-auto px-4 md:px-8 flex items-center gap-1 overflow-x-auto">
            {ADMIN_NAV.map(({ to, label, icon: Icon }) => {
              const active = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2.5 border-b-2 whitespace-nowrap transition-colors ${
                    active
                      ? "border-gold-500 text-cream-50"
                      : "border-transparent text-cream-50/55 hover:text-cream-50/85"
                  }`}
                >
                  <Icon size={13} />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
