// sponsor-portal/src/services/api.js

import { API_URL } from "../config/api";  // 👈 ahora viene de config/api.ts

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


