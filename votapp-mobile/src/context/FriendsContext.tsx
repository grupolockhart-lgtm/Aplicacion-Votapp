// src/context/FriendsContext.tsx
import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// 👇 Importar las variables de entorno
// Si usas react-native-dotenv:
import { APP_BASE_URL } from "@env";

export type Friend = {
  id: number;              // id de la relación de amistad
  friend_id: number;       // id del usuario amigo
  alias?: string;
  nombre?: string;
  correo?: string;
  avatar_url?: string;
  bio?: string;
  status: string;
};

interface FriendsContextType {
  friends: Friend[];
  refreshFriends: () => Promise<void>;
}

export const FriendsContext = createContext<FriendsContextType>({
  friends: [],
  refreshFriends: async () => {},
});

export const FriendsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [friends, setFriends] = useState<Friend[]>([]);

  const refreshFriends = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;

      // 👇 obtener el userId directamente del backend usando APP_BASE_URL
      const resUser = await fetch(`${APP_BASE_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resUser.ok) {
        console.error("Error obteniendo usuario:", resUser.status);
        return;
      }
      const userData = await resUser.json();
      const userId = userData.user?.id || userData.id;
      console.log("UserId obtenido del backend:", userId);

      // 👇 ahora sí pedir amigos con ese userId
      const res = await fetch(
        `${APP_BASE_URL}/api/friends?user_id=${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) {
        console.error("Error al cargar amigos:", res.status);
        return;
      }

      const data = await res.json();
      //console.log("Respuesta /api/friends:", data);
      setFriends(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error cargando amigos:", err);
    }
  };

  useEffect(() => {
    refreshFriends();
  }, []);

  return (
    <FriendsContext.Provider value={{ friends, refreshFriends }}>
      {children}
    </FriendsContext.Provider>
  );
};

