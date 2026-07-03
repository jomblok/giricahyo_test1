const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

export function getToken() {
  return localStorage.getItem("giricahyo_token");
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
    localStorage.removeItem("giricahyo_token");
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
  get:    (path)       => request("GET",    path),
  post:   (path, body) => request("POST",   path, body),
  patch:  (path, body) => request("PATCH",  path, body),
  delete: (path)       => request("DELETE", path),
};const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

export function getToken() {
  return localStorage.getItem("giricahyo_token");
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
    localStorage.removeItem("giricahyo_token");
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
  get:    (path)       => request("GET",    path),
  post:   (path, body) => request("POST",   path, body),
  patch:  (path, body) => request("PATCH",  path, body),
  delete: (path)       => request("DELETE", path),
};
