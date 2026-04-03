// src/screens/SurveyHistoryList.tsx
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config/api";
import SimpleSurveyGrid from "../components/SimpleSurveyGrid";

interface SurveyHistory {
  id: number;
  title: string;
  description?: string | null;
  tipo?: string | null; // "simple" o "normal"
  questions?: any[] | null;
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

        const res = await fetch(`${API_URL}/me/surveys/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const raw: SurveyHistory[] = await res.json();

        const normalized = Array.isArray(raw)
          ? raw.map((s: SurveyHistory) => {
              const imagenes =
                Array.isArray(s.media_urls) && s.media_urls.length > 0
                  ? s.media_urls
                  : s.media_url
                  ? [s.media_url]
                  : [];

              return {
                id: s.id,
                titulo: s.title,
                preguntas: (s.questions ?? []).map((q: any) => ({
                  id: q.id,
                  texto: q.texto ?? q.text,
                  opciones: (q.opciones ?? []).map((o: any) => ({
                    id: o.id,
                    texto: o.texto ?? o.text,
                    votos: o.votos ?? 0, // 👈 asegurar campo votos
                  })),
                  total_votos: q.total_votos ?? 0,
                })),
                imagenes,
                created_at: s.completed_at ?? new Date().toISOString(),
                description: s.description ?? "",
                tipo: s.tipo ?? "normal",
              };
            })
          : [];



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
