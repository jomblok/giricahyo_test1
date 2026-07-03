// src/lib/api.js
const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

export function getToken() {
  return localStorage.getItem("giricahyo_token");
}

export function saveToken(token) {
  localStorage.setItem("giricahyo_token", token);
}

export function clearToken() {
  localStorage.removeItem("giricahyo_token");
}

async function request(method, path, body = null) {
  const token = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  if (res.status === 401) {
    clearToken();
    window.location.href = "/login";
    return;
  }

  const data = await res.json();

  if (!res.ok) {
    const error = new Error(data?.message || "Terjadi kesalahan pada server.");
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

export const authApi = {
  login:  (email, password) => api.post("/auth/login", { email, password }),
  logout: ()                => api.post("/auth/logout"),
  me:     ()                => api.get("/auth/me"),
};

export const dashboardApi = {
  summary: () => api.get("/dashboard/summary"),
  trend:   () => api.get("/dashboard/trend"),
};

export const treeApi = {
  list:         (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/trees${qs ? "?" + qs : ""}`);
  },
  get:          (id)         => api.get(`/trees/${id}`),
  getPublic:    (id)         => api.get(`/trees/${id}/public`),
  create:       (data)       => api.post("/trees", data),
  updateHealth: (id, status) => api.patch(`/trees/${id}/health`, { health_status: status }),
};

export const farmerApi = {
  list: ()    => api.get("/farmers"),
  get:  (id)  => api.get(`/farmers/${id}`),
};

export const buyerApi = {
  list: ()    => api.get("/buyers"),
  get:  (id)  => api.get(`/buyers/${id}`),
};

export const speciesApi = {
  list:   ()     => api.get("/species"),
  create: (data) => api.post("/species", data),
};

export const accountApi = {
  list:           ()                   => api.get("/accounts"),
  create:         (data)               => api.post("/accounts", data),
  deactivate:     (id)                 => api.patch(`/accounts/${id}/deactivate`),
  updatePassword: (id, password)       => api.patch(`/accounts/${id}/password`, { password }),
};

export const carbonFundApi = {
  income:       ()     => api.get("/carbon-fund/income"),
  addIncome:    (data) => api.post("/carbon-fund/income", data),
  distribution: ()     => api.get("/carbon-fund/distribution"),
  summary:      ()     => api.get("/carbon-fund/summary"),
};

export const adoptionApi = {
  list:   ()     => api.get("/adoptions"),
  create: (data) => api.post("/adoptions", data),
};
