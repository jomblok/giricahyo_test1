// src/lib/api.js
// Satu-satunya pintu masuk ke Laravel backend.
// Semua fetch ke API melewati helper ini supaya:
//   1. Base URL cukup diset di satu tempat (.env)
//   2. Authorization header otomatis disertakan
//   3. Error response otomatis di-throw sebagai object { message }

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

// Ambil token dari localStorage
function getToken() {
  return localStorage.getItem("gjr_token");
}

// Simpan / hapus token
export function saveToken(token) {
  localStorage.setItem("gjr_token", token);
}
export function clearToken() {
  localStorage.removeItem("gjr_token");
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────
async function request(method, path, body = null) {
  const token = getToken();
  const headers = { 
    "Content-Type": "application/json",
    "Accept": "application/json"
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  // Token kadaluarsa / tidak valid → hapus token supaya user diarahkan ke login
  if (res.status === 401) {
    clearToken();
    window.location.href = "/login";
    return;
  }

  let data;
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    data = await res.json();
  } else {
    const text = await res.text();
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error(`Pohon dengan ID "${path.split("/").pop()}" tidak ditemukan di database.`);
      }
      throw new Error(`Respon server non-JSON (${res.status}): ${text.substring(0, 80)}`);
    }
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!res.ok) {
    let msg = data?.message || `Terjadi kesalahan (${res.status}).`;
    if (data?.errors && typeof data.errors === "object" && Object.keys(data.errors).length > 0) {
      const details = Object.values(data.errors).flat().join(" • ");
      msg = `${msg}: ${details}`;
    }
    const error = new Error(msg);
    error.errors = data?.errors || {};
    throw error;
  }

  return data;
}

export const api = {
  get:    (path)        => request("GET",    path),
  post:   (path, body)  => request("POST",   path, body),
  patch:  (path, body)  => request("PATCH",  path, body),
  delete: (path)        => request("DELETE", path),
};

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login:  (email, password) => api.post("/auth/login", { email, password }),
  logout: ()                => api.post("/auth/logout"),
  me:     ()                => api.get("/auth/me"),
};

// ── Dashboard (admin) ─────────────────────────────────────────────────────────
export const dashboardApi = {
  summary: () => api.get("/dashboard/summary"),
  trend:   () => api.get("/dashboard/trend"),
};

// ── Pohon ─────────────────────────────────────────────────────────────────────
export const treeApi = {
  list:          (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/trees${qs ? "?" + qs : ""}`);
  },
  get:           (id)          => api.get(`/trees/${id}`),
  getPublic:     (id)          => api.get(`/trees/${id}/public`),
  create:        (data)        => api.post("/trees", data),
  updateHealth:  (id, status)  => api.patch(`/trees/${id}/health`, { health_status: status }),
  addPhoto:      (id, data)    => api.post(`/trees/${id}/photos`, data),
};

// ── Petani ────────────────────────────────────────────────────────────────────
export const farmerApi = {
  list:  ()   => api.get("/farmers"),
  get:   (id) => api.get(`/farmers/${id}`),
};

// ── Buyer ─────────────────────────────────────────────────────────────────────
export const buyerApi = {
  list:  ()   => api.get("/buyers"),
  get:   (id) => api.get(`/buyers/${id}`),
};

// ── Jenis pohon ───────────────────────────────────────────────────────────────
export const speciesApi = {
  list:   ()     => api.get("/species"),
  create: (data) => api.post("/species", data),
};

// ── Akun / User management ────────────────────────────────────────────────────
export const accountApi = {
  list:           ()           => api.get("/accounts"),
  create:         (data)       => api.post("/accounts", data),
  deactivate:     (id)         => api.patch(`/accounts/${id}/deactivate`),
  updatePassword: (id, password) => api.patch(`/accounts/${id}/password`, { password }),
};

// ── Carbon Fund ───────────────────────────────────────────────────────────────
export const carbonFundApi = {
  income:       (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/carbon-fund/income${qs ? "?" + qs : ""}`);
  },
  addIncome:    (data) => api.post("/carbon-fund/income", data),
  distribution: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/carbon-fund/distribution${qs ? "?" + qs : ""}`);
  },
  summary:      (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/carbon-fund/summary${qs ? "?" + qs : ""}`);
  },
};

// ── Sertifikat / Adopsi ───────────────────────────────────────────────────────
export const adoptionApi = {
  list:   ()     => api.get("/adoptions"),
  create: (data) => api.post("/adoptions", data),
};
