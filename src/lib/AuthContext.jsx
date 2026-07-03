// src/lib/AuthContext.jsx
// AuthContext versi API — login/logout lewat Laravel backend.
// Token JWT disimpan di localStorage dan dikirim otomatis oleh api.js.

import { createContext, useContext, useState, useEffect } from "react";
import { authApi, accountApi, saveToken, clearToken } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true); // cek token saat pertama load

  // Saat app pertama dibuka: cek apakah token masih valid
  useEffect(() => {
    async function checkToken() {
      const token = localStorage.getItem("gjr_token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const me = await authApi.me();
        setUser(me);
      } catch {
        clearToken(); // token kadaluarsa, hapus
      } finally {
        setLoading(false);
      }
    }
    checkToken();
  }, []);

  // Login — kirim ke POST /api/auth/login
  async function login(email, password) {
    try {
      const res = await authApi.login(email, password);
      saveToken(res.token);
      setUser(res.user);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  // Logout — kirim ke POST /api/auth/logout lalu bersihkan state
  async function logout() {
    try { await authApi.logout(); } catch { /* abaikan error */ }
    clearToken();
    setUser(null);
  }

  // Buat akun baru (dipanggil dari ManageUsersPage)
  // Backend otomatis buat record farmer/buyer + akun secara atomik
  async function registerUser({ name, email, password, role, groupCoop, address, phone }) {
    try {
      const res = await accountApi.create({
        name,
        email,
        password,
        role,
        group_coop: groupCoop || "Kelompok Tani Giricahyo I",
        address:    address   || "Giricahyo, Purwosari, Gunungkidul",
        phone:      phone     || "",
      });
      return { ok: true, account: res.account };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  if (loading) {
    // Tampilkan spinner sementara cek token — cegah flash halaman login
    return (
      <div className="min-h-screen bg-forest-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-sage-400/30 border-t-sage-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, registerUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() { return useContext(AuthContext); }
