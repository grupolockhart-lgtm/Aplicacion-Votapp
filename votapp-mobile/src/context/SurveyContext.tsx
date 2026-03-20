// src/context/SurveyContext.tsx
import React, { createContext, useContext } from "react";

// 👇 Tipo de encuesta (puedes expandir según tu modelo real)
export interface Survey {
  id: number;
  title: string;
  description?: string;
  media_url?: string;
  media_urls?: string[];
  media_type?: string;
  segundos_restantes?: number;
  patrocinada?: boolean;
  patrocinador?: string;
  es_patrocinada?: boolean;
  recompensa_puntos?: number;
  recompensa_dinero?: number;
  presupuesto_total?: number;
  visibilidad_resultados?: "publica" | "privada";
  tipo?: "normal" | "simple";
}

// 👇 Tipo del contexto
interface SurveyContextType {
  surveys: Survey[]; // ✅ ahora incluye las encuestas
  refreshSurveys: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// 👇 valores iniciales vacíos
export const SurveyContext = createContext<SurveyContextType>({
  surveys: [],
  refreshSurveys: async () => {},
  refreshProfile: async () => {},
});

// 👇 hook para usar el contexto
export const useSurveyContext = () => useContext(SurveyContext);

