
// votapp-movile/src/config/api.ts
import { APP_BASE_URL } from "@env";

// URL base dinámica según .env
export const API_URL = `${APP_BASE_URL}/api`;

// Endpoints centralizados
export const endpoints = {
  // Usuarios
  me: `${API_URL}/users/me`,
  searchUsers: `${API_URL}/users/search`,
  walletHistory: `${API_URL}/surveys/users/me/wallet/history`, // 👈 aquí

  // Amigos
  friends: `${API_URL}/friends`,
  friendsPending: `${API_URL}/friends/pending`,
  friendsSearch: `${API_URL}/friends/search`,

  // Notificaciones
  notifications: `${API_URL}/notifications`,
  notificationsUnreadCount: `${API_URL}/notifications/unread_count`,

  // Encuestas
  surveys: `${API_URL}/surveys`,
  surveysSimple: `${API_URL}/surveys/simple`,
  surveyResults: (id: number) => `${API_URL}/results/${id}`,

  // Uploads
  uploadImage: `${API_URL}/upload/image`,
  uploadVideo: `${API_URL}/upload/video`,

  // Administración
  adminSurveysHistory: (originalId: number) =>
    `${API_URL}/admin/surveys/history/${originalId}`,
};




///export const API_URL = "http://10.0.0.178:8000/api";///
