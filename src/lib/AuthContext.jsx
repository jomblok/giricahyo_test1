// src/lib/AuthContext.jsx
// AuthContext versi API — login/logout lewat Laravel backend.
// Token JWT disimpan di localStorage dan dikirim otomatis oleh api.js.

import { createContext, useContext, useState, useEffect } from "react";
import { authApi, accountApi, saveToken, clearToken, saveUser, getSavedUser } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Akun yang tersimpan saat login dipakai LANGSUNG, tanpa menunggu /auth/me.
  //
  // Dulu seluruh aplikasi menampilkan spinner sampai /auth/me kembali, baru
  // kemudian halaman dan datanya mulai diminta — tiga tahap berurutan. Di
  // server Railway satu permintaan ber-database ±1,8 detik, jadi setiap kali
  // web dibuka atau dimuat ulang, 1,8 detik pertama habis hanya untuk
  // menunggu jawaban "ya, Anda masih login".
  //
  // Ini AMAN karena akun tersimpan hanya menentukan TAMPILAN. Setiap endpoint
  // data tetap memeriksa token di server: token yang tidak berlaku dijawab 401
  // dan pengguna dipindah ke /login (lihat gjr:unauthorized di bawah), jadi
  // tidak ada data yang keluar hanya karena isi localStorage diubah.
  const [user, setUser] = useState(() =>
    localStorage.getItem("gjr_token") ? getSavedUser() : null
  );
  // Spinner hanya bila ada token tapi akunnya belum pernah tersimpan — sesi
  // yang login sebelum penyimpanan ini ada. Sekali /auth/me menjawab, sesi
  // itu pun ikut tersimpan.
  const [loading, setLoading] = useState(
    () => !!localStorage.getItem("gjr_token") && !getSavedUser()
  );

  // Token tetap diperiksa ke server — di latar belakang bila akunnya sudah
  // tampil. Hasilnya juga memperbarui akun tersimpan (nama atau peran yang
  // diubah admin).
  useEffect(() => {
    if (!localStorage.getItem("gjr_token")) return;
    authApi.me()
      .then((me) => {
        saveUser(me);
        setUser(me);
      })
      .catch((e) => {
        // 401 sudah ditangani api.js (token dibersihkan, gjr:unauthorized).
        // 403 = akun dinonaktifkan: keluarkan juga. Galat lain — terutama
        // tidak ada sinyal — TIDAK mengeluarkan pengguna. Dulu setiap galat
        // menghapus token, sehingga petani yang membuka aplikasi di kebun
        // tanpa sinyal terlempar ke halaman login.
        if (e.status === 401 || e.status === 403) {
          clearToken();
          setUser(null);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // Sesi habis di tengah pemakaian: api.js menyiarkan "gjr:unauthorized"
  // ketika server membalas 401. Cukup kosongkan user — PrivateRoute yang
  // memindahkan ke /login lewat router, tanpa memuat ulang browser.
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener("gjr:unauthorized", onExpired);
    return () => window.removeEventListener("gjr:unauthorized", onExpired);
  }, []);

  // Login — kirim ke POST /api/auth/login
  async function login(email, password) {
    try {
      const res = await authApi.login(email, password);
      saveToken(res.token);
      saveUser(res.user);
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
      <div className="min-h-screen bg-ground flex items-center justify-center" role="status" aria-label="Memuat">
        <div className="w-8 h-8 border-2 border-brand/25 border-t-brand rounded-full animate-spin" />
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
export function useAuth() {
  return useContext(AuthContext) ?? { user: null, login: () => {}, logout: () => {}, registerUser: () => {} };
}
