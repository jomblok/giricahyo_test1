import { createContext, useContext, useState, useLayoutEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("gjr_theme") || "light");

  // useLayoutEffect, bukan useEffect — dua alasan:
  //
  //   1. Animasi ganti tema (ThemeSwitch) memakai View Transitions API, yang
  //      memotret DOM tepat setelah callback-nya selesai. useEffect berjalan
  //      SETELAH potret diambil, jadi tema barunya tidak akan ikut terpotret
  //      dan animasinya menampilkan dua keadaan yang sama.
  //   2. Saat pertama dimuat, useEffect menyisakan satu frame dengan tema
  //      salah sebelum class-nya terpasang — kedip putih sekilas di tema gelap.
  useLayoutEffect(() => {
    localStorage.setItem("gjr_theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
