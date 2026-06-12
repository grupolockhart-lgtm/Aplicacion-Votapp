

import React, { createContext, useContext, useState, useEffect } from "react";
import { ENDPOINTS } from "../config/api";

interface User {
  id: number;
  nombre: string;
  email: string;
  rol: string; // "sponsor" o "normal"
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  // 🔄 refrescar perfil desde backend
  const refreshUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(ENDPOINTS.users.me, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        console.error("Error cargando perfil:", res.status);
        return;
      }

      const data = await res.json();
      setUser(data);
    } catch (err) {
      console.error("Error en refreshUser:", err);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
};
