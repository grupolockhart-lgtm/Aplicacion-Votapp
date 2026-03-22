// src/context/SurveyContext.tsx
import React, { createContext, useContext } from "react";

// 👇 Tipo de encuesta (alineado con SurveySimpleResponse del backend)
export interface Survey {
  id: number;
  title: string;
  description?: string;

  // 👇 multimedia
  imagenes?: string[];
  videos?: string[];
  media_url?: string;
  media_urls?: string[];
  media_type?: string;

  // 👇 tiempos y expiración
  fecha_creacion?: string;
  fecha_expiracion?: string;
  segundos_restantes?: number;

  // 👇 patrocinio y recompensas
  patrocinada?: boolean;
  patrocinador?: string;
  es_patrocinada?: boolean;
  recompensa_puntos?: number;
  recompensa_dinero?: number;
  presupuesto_total?: number;

  // 👇 visibilidad y tipo
  visibilidad_resultados?: "publica" | "privada";
  tipo?: "normal" | "simple";

  // 👇 segmentación
  sexo?: string;
  ciudad?: string;
  ocupacion?: string;
  nivel_educativo?: string;
  religion?: string;
  nacionalidad?: string;
  estado_civil?: string;

  // 👇 preguntas (para encuestas simples)
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

// 👇 Tipo del contexto
interface SurveyContextType {
  surveys: Survey[];
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
