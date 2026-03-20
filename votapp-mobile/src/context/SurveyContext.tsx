

// src/context/SurveyContext.tsx
import React, { createContext, useContext } from "react";

interface SurveyContextType {
  refreshSurveys: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// 👇 valores iniciales vacíos
export const SurveyContext = createContext<SurveyContextType>({
  refreshSurveys: async () => {},
  refreshProfile: async () => {},
});

// 👇 hook para usar el contexto
export const useSurveyContext = () => useContext(SurveyContext);
