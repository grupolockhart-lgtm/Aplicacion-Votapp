// src/context/SurveyProvider.tsx
import React, { useState, ReactNode } from "react";
import { SurveyContext } from "./SurveyContext";
import { API_URL } from "../config/api";
import type { Survey } from "./SurveyContext"; // 👈 reutilizamos el tipo

interface Props {
  children: ReactNode;
}

export default function SurveyProvider({ children }: Props) {
  const [surveys, setSurveys] = useState<Survey[]>([]);

  const refreshSurveys = async () => {
    try {
      const res = await fetch(`${API_URL}/surveys`);
      if (res.ok) {
        const data = await res.json();

        // 👇 normalizamos multimedia y preguntas
        const normalized: Survey[] = data.map((s: any) => ({
          id: s.id,
          title: s.titulo ?? s.title ?? "",
          description: s.description ?? "",
          // multimedia
          imagenes: Array.isArray(s.imagenes) ? s.imagenes : [],
          videos: Array.isArray(s.videos) ? s.videos : [],
          media_url: s.media_url ?? (s.imagenes?.[0] ?? null),
          media_urls: Array.isArray(s.media_urls)
            ? s.media_urls
            : s.media_urls
            ? [s.media_urls]
            : [...(s.imagenes ?? []), ...(s.videos ?? [])],
          media_type: s.media_type ?? "native",
          // tiempos
          fecha_creacion: s.fecha_creacion,
          fecha_expiracion: s.fecha_expiracion,
          segundos_restantes: s.segundos_restantes ?? 0,
          // patrocinio y recompensas
          patrocinada: s.patrocinada ?? false,
          patrocinador: s.patrocinador ?? null,
          es_patrocinada: s.es_patrocinada ?? false,
          recompensa_puntos: s.recompensa_puntos ?? 0,
          recompensa_dinero: s.recompensa_dinero ?? 0,
          presupuesto_total: s.presupuesto_total ?? 0,
          visibilidad_resultados: s.visibilidad_resultados ?? "publica",
          tipo: s.tipo ?? "normal",
          // segmentación
          sexo: s.sexo,
          ciudad: s.ciudad,
          ocupacion: s.ocupacion,
          nivel_educativo: s.nivel_educativo,
          religion: s.religion,
          nacionalidad: s.nacionalidad,
          estado_civil: s.estado_civil,
          // preguntas (solo para encuestas simples)
          questions: s.preguntas?.map((p: any) => ({
            id: p.id,
            texto: p.texto,
            opciones: p.opciones?.map((o: any) => ({
              id: o.id,
              texto: o.texto,
              votos: o.votos ?? 0,
            })) ?? [],
          })) ?? [],
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


