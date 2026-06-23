

// src/config/api.ts

const API_BASE_URL = "https://aplicacion-votapp.onrender.com";

export const API_URL = `${API_BASE_URL}/api`;

console.log("🔍 API_URL en runtime:", API_URL);

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

    // ✅ Nuevo endpoint para resultados web
    resultsWeb: (id: number) => `${API_URL}/surveys/web/${id}/results`,  
    
    // ✅ Nuevos helpers
    update: (id: number) => `${API_URL}/surveys/${id}`,
    pause: (id: number) => `${API_URL}/surveys/${id}/pause`,
    resume: (id: number) => `${API_URL}/surveys/${id}/resume`,

  },
  notifications: {
    unreadCount: `${API_URL}/notifications/unread_count`,
  },
};