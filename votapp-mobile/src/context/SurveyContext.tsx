// src/context/SurveyContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config/api";

// 👇 Tipo de encuesta (alineado con SurveySimpleResponse del backend)
export interface Survey {
  id: number;
  title: string;
  description?: string;
  imagenes?: string[];
  videos?: string[];
  media_url?: string;
  media_urls?: string[];
  media_type?: string;
  fecha_creacion?: string;
  fecha_expiracion?: string;
  segundos_restantes?: number;
  patrocinada?: boolean;
  patrocinador?: string;
  es_patrocinada?: boolean;
  recompensa_puntos?: number;
  recompensa_dinero?: number;
  presupuesto_total?: number;
  visibilidad_resultados?: "publica" | "privada";
  tipo?: "normal" | "simple";
  sexo?: string;
  ciudad?: string;
  ocupacion?: string;
  nivel_educativo?: string;
  religion?: string;
  nacionalidad?: string;
  estado_civil?: string;
  questions?: {
    id: number;
    texto: string;
    opciones: {
      id: number;
      texto: string;
      votos: number;
    }[];
  }[];
}

// 👇 Tipo de perfil de usuario
export interface UserProfile {
  id: number;
  nombre?: string;
  email?: string;
  avatar_url?: string;
  puntos?: number;
  encuestas_creadas?: number;
}

// 👇 Tipo del contexto
interface SurveyContextType {
  surveys: Survey[];
  profile: UserProfile | null;
  refreshSurveys: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// 👇 valores iniciales vacíos
export const SurveyContext = createContext<SurveyContextType>({
  surveys: [],
  profile: null,
  refreshSurveys: async () => {},
  refreshProfile: async () => {},
});

// 👇 hook para usar el contexto
export const useSurveyContext = () => useContext(SurveyContext);

// 👇 Provider
export const SurveyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // ✅ refrescar encuestas simples usando /me/surveys/simple
  const refreshSurveys = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;

      const res = await fetch(`${API_URL}/api/users/me/surveys/simple`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        console.error("Error cargando encuestas simples:", res.status);
        return;
      }

      const data = await res.json();
      setSurveys(data);
    } catch (err) {
      console.error("Error en refreshSurveys:", err);
    }
  };

  // ✅ refrescar perfil usando /me
  const refreshProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;

      const res = await fetch(`${API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        console.error("Error cargando perfil:", res.status);
        return;
      }

      const data = await res.json();
      setProfile(data);
    } catch (err) {
      console.error("Error en refreshProfile:", err);
    }
  };

  useEffect(() => {
    refreshProfile();
    refreshSurveys();
  }, []);

  return (
    <SurveyContext.Provider value={{ surveys, profile, refreshSurveys, refreshProfile }}>
      {children}
    </SurveyContext.Provider>
  );
};