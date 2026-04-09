// src/components/SurveyHistoryList.tsx
import React, { useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config/api";
import SimpleSurveyGrid from "../components/SimpleSurveyGrid";
import { useFocusEffect } from "@react-navigation/native";
import { SurveyHistoryOut } from "../Types/survey";

export default function SurveyHistoryList() {
  const [surveys, setSurveys] = useState<SurveyHistoryOut[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      async function loadHistory() {
        console.log("[DEBUG] Entrando a loadHistory()");

        try {
          const token = await AsyncStorage.getItem("userToken");
          console.log("[DEBUG] Token en frontend:", token);

          if (!token) {
            console.warn("[WARN] No se encontró token de usuario");
            return;
          }

          console.log("[DEBUG] Llamando API:", `${API_URL}/users/me/surveys/history`);

          const res = await fetch(`${API_URL}/users/me/surveys/history`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          console.log("[DEBUG] Status HTTP:", res.status);

          const raw = await res.json();
          console.log("[DEBUG] Respuesta cruda del backend:", raw);

          if (!res.ok) {
            console.warn("[WARN] Error HTTP:", res.status, raw);
            if (isActive) setSurveys([]);
            return;
          }

          if (Array.isArray(raw)) {
            console.log("[DEBUG] Historial recibido, cantidad:", raw.length);
            raw.forEach((item, idx) => {
              console.log(`[DEBUG] Encuesta[${idx}]:`, item);
            });
            if (isActive) {
              setSurveys(raw);
            }
          } else {
            console.warn("[WARN] Respuesta inesperada (no es array):", raw);
            if (isActive) setSurveys([]);
          }
        } catch (err) {
          console.error("[ERROR] Error cargando historial:", err);
        } finally {
          console.log("[DEBUG] Finalizando loadHistory()");
          if (isActive) setLoading(false);
        }
      }

      loadHistory();
      return () => {
        console.log("[DEBUG] Cleanup: isActive = false");
        isActive = false;
      };
    }, [])
  );

  if (loading) {
    console.log("[DEBUG] Renderizando ActivityIndicator (loading)");
    return <ActivityIndicator size="large" color="#2563EB" />;
  }

  if (!loading && surveys.length === 0) {
    console.log("[DEBUG] Renderizando mensaje: No hay encuestas en tu historial");
    return (
      <View style={{ alignItems: "center", marginTop: 10 }}>
        <Text style={{ color: "#6B7280" }}>No hay encuestas en tu historial</Text>
      </View>
    );
  }

  console.log("[DEBUG] Renderizando SimpleSurveyGrid con", surveys.length, "encuestas");
  return <SimpleSurveyGrid data={surveys} />;
}