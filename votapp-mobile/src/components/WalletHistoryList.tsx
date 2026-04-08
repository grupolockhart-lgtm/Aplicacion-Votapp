// src/components/WalletHistoryList.tsx
import React, { useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config/api";
import SimpleSurveyGrid from "./SimpleSurveyGrid";
import { useFocusEffect } from "@react-navigation/native";

type Movimiento = {
  id: number;              // id del movimiento
  monto: number;
  fecha: string;
  patrocinado: boolean;
  survey: {
    id: number;            // 👈 id de la encuesta
    title: string;
    media_urls: string[] | string; // puede venir como array o string JSON
  };
};

type WalletResponse = {
  id: number;
  balance: number;
  actualizado_en: string;
  movimientos: Movimiento[];
};

export default function WalletHistoryList() {
  const [movements, setMovements] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const fetchMovements = async () => {
        try {
          const token = await AsyncStorage.getItem("userToken");
          if (!token) {
            console.warn("[WARN] No se encontró token de usuario");
            return;
          }

          const res = await fetch(`${API_URL}/surveys/users/me/wallet/history`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const data: WalletResponse = await res.json();
          console.log("[DEBUG] Respuesta completa:", data);
          console.log("[DEBUG] Movimientos recibidos:", data.movimientos);

          if (res.ok && isActive) {
            setMovements(data.movimientos);
          } else if (res.status === 404 && isActive) {
            setMovements([]);
          } else {
            setError("No se pudo cargar el historial de billetera.");
          }
        } catch (err) {
          console.error("[ERROR] Error obteniendo historial de billetera:", err);
          setError("No se pudo cargar el historial de billetera.");
        } finally {
          if (isActive) setLoading(false);
        }
      };

      fetchMovements();
      return () => {
        isActive = false;
      };
    }, [])
  );

  if (loading) return <ActivityIndicator size="large" color="#2563EB" />;
  if (error) return <Text style={styles.text}>{error}</Text>;
  if (movements.length === 0)
    return <Text style={styles.text}>No hay movimientos en tu billetera.</Text>;

  const gridData = movements.map((m) => ({
    id: m.survey.id,        // 👈 ahora usamos el id de la encuesta
    titulo: m.survey.title,
    preguntas: [],          // no hay preguntas en movimientos
    imagenes: Array.isArray(m.survey.media_urls)
      ? m.survey.media_urls
      : JSON.parse(m.survey.media_urls),
    created_at: m.fecha,
    tipo: "patrocinada",    // 👈 marcamos como patrocinada
    description: "",
  }));

  console.log("[DEBUG] Data para grid:", gridData);

  return (
    <View>
      <SimpleSurveyGrid data={gridData} />
    </View>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 14,
    color: "#111827",
    textAlign: "center",
    marginVertical: 10,
  },
});