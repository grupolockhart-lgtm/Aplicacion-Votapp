// src/context/SurveyProvider.tsx
import React, { useState, ReactNode } from "react";
import { SurveyContext } from "./SurveyContext";
import { API_URL } from "../config/api";
import type { Survey } from "./SurveyContext"; // 👈 reutilizamos el tipo

interface Props {
  children: ReactNode; // ✅ tipado correcto
}

export default function SurveyProvider({ children }: Props) {
  const [surveys, setSurveys] = useState<Survey[]>([]);

  const refreshSurveys = async () => {
    try {
      const res = await fetch(`${API_URL}/surveys`);
      if (res.ok) {
        const data = await res.json();
        // 👇 normalizamos media_urls
        const normalized: Survey[] = data.map((s: any) => ({
          ...s,
          media_urls: Array.isArray(s.media_urls)
            ? s.media_urls
            : s.media_urls
            ? [s.media_urls]
            : [],
        }));
        setSurveys(normalized);
      }
    } catch (err) {
      console.log("Error refrescando encuestas:", err);
    }
  };

  const refreshProfile = async () => {
    console.log("Refrescando perfil...");
    // tu lógica de perfil
  };

  return (
    <SurveyContext.Provider value={{ surveys, refreshSurveys, refreshProfile }}>
      {children}
    </SurveyContext.Provider>
  );
}


