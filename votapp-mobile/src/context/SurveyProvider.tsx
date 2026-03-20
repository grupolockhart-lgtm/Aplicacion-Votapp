

// src/context/SurveyProvider.tsx
import React from "react";
import { SurveyContext } from "./SurveyContext";

interface Props {
  children: React.ReactNode;
}

export default function SurveyProvider({ children }: Props) {
  // 👇 aquí defines la lógica real de refresco
  const refreshSurveys = async () => {
    console.log("Refrescando encuestas...");
    // tu lógica de actualización de encuestas
  };

  const refreshProfile = async () => {
    console.log("Refrescando perfil...");
    // tu lógica de actualización de perfil
  };

  return (
    <SurveyContext.Provider value={{ refreshSurveys, refreshProfile }}>
      {children}
    </SurveyContext.Provider>
  );
}
