// sponsor-portal/src/services/api.js

import { API_URL } from "../config/api";  // 👈 viene de config/api.ts

// -----------------------------
// Login de Sponsor
// -----------------------------
export async function login(email, password) {
  const res = await fetch(`${API_URL}/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
  });

  if (!res.ok) {
    throw new Error(`Error en login: ${res.status}`);
  }

  const data = await res.json();
  return data; // { access_token, token_type }
}

// -----------------------------
// Obtener datos del usuario
// -----------------------------
export async function getMe(token) {
  const res = await fetch(`${API_URL}/users/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    throw new Error(`Error obteniendo usuario: ${res.status}`);
  }

  const data = await res.json();

  // Normalizamos para que siempre exista user.wallet
  const user = data.user || data;
  return {
    ...user,
    wallet: user.billetera || data.wallet || null
  };
}

// -----------------------------
// Registro de Sponsor
// -----------------------------
export async function registerSponsor(payload) {
  const res = await fetch(`${API_URL}/users/register_sponsor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (!res.ok) {
    // 👇 devolvemos el JSON de error para que el frontend lo maneje
    throw { response: { data } };
  }

  return data; // { access_token, token_type }
}


