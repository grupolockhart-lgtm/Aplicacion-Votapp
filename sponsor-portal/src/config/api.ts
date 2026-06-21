

// src/config/api.ts

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"; // fallback local

export const API_URL = `${API_BASE_URL}/api`;

// 👉 Endpoints centralizados
export const ENDPOINTS = {
  users: {
    me: `${API_URL}/users/me`,
    login: `${API_URL}/users/login`,
    register: `${API_URL}/users/register`,
  },
  surveys: {
    base: `${API_URL}/surveys`,                 // 👈 nuevo base
    create: `${API_URL}/surveys`,
    upload: `${API_URL}/surveys/upload`,
    list: `${API_URL}/surveys`,

    // ✅ Nuevo endpoint para encuestas publicadas del sponsor autenticado
    publishedMine: `${API_URL}/surveys/me/published`,

  },
  notifications: {
    unreadCount: `${API_URL}/notifications/unread_count`,
  },
};