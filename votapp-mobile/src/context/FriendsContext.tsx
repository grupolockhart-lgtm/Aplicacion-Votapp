// src/context/FriendsContext.tsx
import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Friend = {
  id: number;
  friend_id?: number;
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

      const res = await fetch("https://aplicacion-votapp-test.onrender.com/api/friends", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setFriends(data);
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
