import { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext();

const translations = {
  id: {
    // Navigation & General
    app_title: "Giricahyo Carbon",
    dashboard: "Dashboard",
    trees: "Inventaris Pohon",
    farmers: "Petani",
    buyers: "Buyer / Adopsi",
    certificates: "Sertifikat",
    carbon_fund: "Dana Karbon",
    accounts: "Kelola Akun",
    generate_qr: "Generate QR",
    logout: "Keluar",
    species_catalog: "Katalog Pohon",
    language: "Bahasa",
    theme: "Tema",
    dark_mode: "Mode Gelap",
    light_mode: "Mode Terang",

    // Dashboard titles
    admin_dashboard: "Dashboard Administrator",
    farmer_dashboard: "Dashboard Petani Karbon",
    buyer_dashboard: "Dashboard Portofolio Karbon",

    // Actions & Badges
    add_photo_update: "Tambah Update Foto Pohon",
    view_certificate: "Lihat Sertifikat",
    download_pdf: "Cetak / Unduh PDF",
    growth_timeline: "Timeline Perkembangan Pohon",
    carbon_impact: "Dampak Karbon Diserap",
    filter_month: "Pilih Bulan",
    filter_year: "Pilih Tahun",
    all_months: "Semua Bulan",
    all_years: "Semua Tahun",
    tree_details: "Detail Pohon",
    health_status: "Status Kesehatan",
    good: "Baik",
    moderate: "Sedang",
    poor: "Buruk",
    planted_date: "Tanggal Tanam",
    coordinates: "Koordinat",
    close: "Tutup",
    save: "Simpan",
    cancel: "Batal",
    upload_photo: "Unggah Foto Pertumbuhan",
    photo_url_label: "URL Foto / Link Gambar",
    caption_label: "Catatan Perkembangan",
  },
  en: {
    // Navigation & General
    app_title: "Giricahyo Carbon",
    dashboard: "Dashboard",
    trees: "Tree Inventory",
    farmers: "Farmers",
    buyers: "Buyers / Adoption",
    certificates: "Certificates",
    carbon_fund: "Carbon Fund",
    accounts: "Manage Accounts",
    generate_qr: "Generate QR",
    logout: "Log Out",
    species_catalog: "Tree Species Catalog",
    language: "Language",
    theme: "Theme",
    dark_mode: "Dark Mode",
    light_mode: "Light Mode",

    // Dashboard titles
    admin_dashboard: "Administrator Dashboard",
    farmer_dashboard: "Carbon Farmer Dashboard",
    buyer_dashboard: "Carbon Portfolio Dashboard",

    // Actions & Badges
    add_photo_update: "Add Tree Photo Update",
    view_certificate: "View Certificate",
    download_pdf: "Print / Download PDF",
    growth_timeline: "Tree Growth Timeline",
    carbon_impact: "Sequestrated Carbon Impact",
    filter_month: "Select Month",
    filter_year: "Select Year",
    all_months: "All Months",
    all_years: "All Years",
    tree_details: "Tree Details",
    health_status: "Health Status",
    good: "Good",
    moderate: "Moderate",
    poor: "Poor",
    planted_date: "Planted Date",
    coordinates: "Coordinates",
    close: "Close",
    save: "Save",
    cancel: "Cancel",
    upload_photo: "Upload Growth Photo",
    photo_url_label: "Photo URL / Image Link",
    caption_label: "Growth Note / Caption",
  }
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("gjr_lang") || "id");

  useEffect(() => {
    localStorage.setItem("gjr_lang", lang);
  }, [lang]);

  const toggleLanguage = () => {
    setLang((prev) => (prev === "id" ? "en" : "id"));
  };

  const t = (key) => {
    return translations[lang]?.[key] || translations["id"]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
