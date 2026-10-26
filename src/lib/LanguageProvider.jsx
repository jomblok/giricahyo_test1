// src/lib/LanguageProvider.jsx
//
// DIPISAH DARI LanguageContext.jsx supaya berkas ini hanya mengekspor komponen.
// Fast Refresh Vite hanya bisa memperbarui di tempat modul yang semua
// ekspornya komponen; berkas campuran komponen + hook dimuat ulang penuh
// setiap kali disunting, dan state halaman yang sedang diuji ikut hilang.
// Hook dan konteksnya tetap di LanguageContext.jsx, jadi impor di berkas lain tidak berubah.

import { useState, useEffect } from "react";
import { LanguageContext, translations } from "./LanguageContext";

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
