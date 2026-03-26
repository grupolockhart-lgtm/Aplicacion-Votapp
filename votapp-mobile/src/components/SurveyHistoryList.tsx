// src/screens/SurveyHistoryList.tsx
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config/api";
import SimpleSurveyGrid from "../components/SimpleSurveyGrid";

interface SurveyHistory {
  id: number;
  title: string;
  completed_at: string;
  media_url?: string | null;
  media_urls?: string[] | null;
}

export default function SurveyHistoryList() {
  const [surveys, setSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        if (!token) {
          console.warn("No se encontró token de usuario");
          return;
        }

        const res = await fetch(`${API_URL}/users/me/surveys/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const raw: SurveyHistory[] = await res.json();

        // 👇 Log de datos crudos del backend
        raw.forEach((s) => {
          console.log(
            `RAW Encuesta ${s.id} → title: ${s.title}, media_url: ${s.media_url}, media_urls: ${JSON.stringify(s.media_urls)}`
          );
        });

        // 👇 Normalizamos igual que en SurveysScreen
        const normalized = Array.isArray(raw)
          ? raw.map((s: SurveyHistory) => ({
              id: s.id,
              titulo: s.title,
              preguntas: [],
              imagenes:
                Array.isArray(s.media_urls) && s.media_urls.length > 0
                  ? s.media_urls
                  : s.media_url
                  ? [s.media_url]
                  : [],
              created_at: s.completed_at ?? null,
            }))
          : [];

        // 👇 Log de encuestas normalizadas
        normalized.forEach((encuesta) => {
          console.log(
            `NORMALIZADA Encuesta ${encuesta.id} → titulo: ${encuesta.titulo}, imagen: ${encuesta.imagenes[0]}`
          );
        });

        setSurveys(normalized);
      } catch (err) {
        console.error("Error cargando historial:", err);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  if (loading) return <ActivityIndicator size="large" color="#2563EB" />;

  if (!loading && surveys.length === 0) {
    return (
      <View style={{ alignItems: "center", marginTop: 10 }}>
        <Text style={{ color: "#6B7280" }}>No hay encuestas en tu historial</Text>
      </View>
    );
  }

  return <SimpleSurveyGrid data={surveys} />;
}