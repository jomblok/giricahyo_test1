// src/lib/navConfig.js
//
// Sumber tunggal struktur navigasi. Sebelumnya menu hanya ada untuk admin dan
// ditulis langsung di Header.jsx dengan label Bahasa Indonesia yang di-hardcode
// — petani dan buyer sama sekali tidak punya navigasi, dan tombol EN tidak
// pernah mengubah menunya.

import {
  LayoutDashboard, TreeDeciduous, Users, Map, Wallet, BarChart3,
  Award, UserCog, QrCode, Sprout, Leaf, TreePine,
  ClipboardCheck, ClipboardList, PlusCircle, Printer, ListChecks, ScrollText, CalendarRange, Ruler,
} from "lucide-react";

// group: dipakai untuk memisahkan "Utama" dan "Kelola" di sidebar.
const NAV = {
  admin: [
    { to: "/",            key: "nav_overview",     icon: LayoutDashboard, group: "main",   end: true },
    { to: "/pohon",       key: "nav_trees",        icon: TreeDeciduous,   group: "main" },
    { to: "/jenis-pohon", key: "species_catalog",  icon: TreePine,        group: "main" },
    { to: "/petani",      key: "nav_farmers",      icon: Users,           group: "main" },
    { to: "/perbandingan", key: "group_comparison", icon: BarChart3,      group: "main" },
    { to: "/peta",        key: "nav_map",          icon: Map,             group: "main" },
    { to: "/dana",        key: "nav_fund",         icon: Wallet,          group: "main" },
    { to: "/perlu-tindakan", key: "nav_needs_action", icon: ListChecks,   group: "manage" },
    { to: "/periode-ukur", key: "measurement_cycles", icon: CalendarRange, group: "manage" },
    { to: "/laporan",     key: "nav_verify",       icon: ClipboardCheck,  group: "manage" },
    { to: "/sertifikat",  key: "nav_certificates", icon: Award,           group: "manage" },
    { to: "/pengguna",    key: "nav_users",        icon: UserCog,         group: "manage" },
    { to: "/generate-qr", key: "nav_generate_qr",  icon: QrCode,          group: "manage" },
    { to: "/qr-massal",   key: "nav_bulk_qr",      icon: Printer,         group: "manage" },
    { to: "/laporan-cetak", key: "nav_print_report", icon: Printer,       group: "manage" },
    { to: "/audit",       key: "nav_audit",        icon: ScrollText,      group: "manage" },
  ],
  farmer: [
    { to: "/",            key: "nav_overview",     icon: LayoutDashboard, group: "main", end: true },
    { to: "/pohon-saya",  key: "nav_my_trees",     icon: Sprout,          group: "main" },
    { to: "/gaji",        key: "nav_my_salary",    icon: Wallet,          group: "main" },
    { to: "/daftar-pohon", key: "nav_register_tree", icon: PlusCircle,    group: "main" },
    { to: "/laporan-saya", key: "nav_my_reports",   icon: ClipboardList,  group: "main" },
    { to: "/peta-kebun",  key: "nav_my_map",       icon: Map,            group: "main" },
    { to: "/dana-desa",   key: "nav_fund_transparency", icon: Wallet,   group: "main" },
    { to: "/cara-ukur",   key: "nav_guide",        icon: Ruler,          group: "main" },
  ],
  buyer: [
    { to: "/",            key: "nav_overview",     icon: LayoutDashboard, group: "main", end: true },
    { to: "/dukungan",    key: "nav_my_support",   icon: Leaf,            group: "main" },
    { to: "/dampak",      key: "nav_my_impact",    icon: Award,           group: "main" },
    { to: "/sertifikat-saya", key: "certificates_sheet", icon: Printer,   group: "main" },
  ],
};

export function navFor(role) {
  return NAV[role] ?? NAV.admin;
}

// Empat item teratas dipakai sebagai bottom-nav di layar kecil.
export function bottomNavFor(role) {
  return navFor(role).slice(0, 4);
}

export const ROLE_LABEL = {
  admin:  { id: "Admin",  en: "Admin"  },
  farmer: { id: "Petani", en: "Farmer" },
  buyer:  { id: "Buyer",  en: "Buyer"  },
};

export const ROLE_TONE = {
  admin:  "brand",
  farmer: "good",
  buyer:  "warn",
};
