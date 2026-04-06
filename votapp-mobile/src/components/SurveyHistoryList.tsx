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
        try {
          const token = await AsyncStorage.getItem("userToken");
          console.log("Token en frontend:", token);

          if (!token) {
            console.warn("No se encontró token de usuario");
            return;
          }

          const res = await fetch(`${API_URL}/users/me/surveys/history`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const raw = await res.json();

          if (!res.ok) {
            console.warn("Error HTTP:", res.status, raw);
            if (isActive) setSurveys([]);
            return;
          }

          if (Array.isArray(raw)) {
            if (isActive) {
              setSurveys(raw);
            }
          } else {
            console.warn("Respuesta inesperada (no es array):", raw);
            if (isActive) setSurveys([]);
          }
        } catch (err) {
          console.error("Error cargando historial:", err);
        } finally {
          if (isActive) setLoading(false);
        }
      }

      loadHistory();
      return () => {
        isActive = false;
      };
    }, [])
  );

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