// src/components/WalletHistoryList.tsx
import React, { useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config/api";
import SimpleSurveyGrid from "./SimpleSurveyGrid";
import { useFocusEffect } from "@react-navigation/native";
import { SurveyHistoryOut } from "../Types/survey";

type Movimiento = {
  id: number;
  monto: number;
  fecha: string;
  patrocinado: boolean;
  survey?: {
    id?: number;
    title?: string;
    description?: string;
    tipo?: string;
    questions?: any[];
    media_url?: string;
    media_urls?: string[] | string;
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

          if (res.ok && isActive) {
            setMovements(data.movimientos || []);
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

  // 🔄 Transformamos movimientos en SurveyHistoryOut con nombres en español
  const gridData: SurveyHistoryOut[] = movements.map((m) => {
    let imagenes: string[] = [];
    try {
      imagenes = Array.isArray(m.survey?.media_urls)
        ? (m.survey?.media_urls as string[])
        : m.survey?.media_urls
        ? JSON.parse(m.survey.media_urls as string)
        : [];
    } catch (e) {
      console.warn("[WARN] media_urls inválido:", m.survey?.media_urls);
    }

    return {
      id: m.survey?.id ?? 0,                              // 👈 solo el id de la encuesta
      titulo: m.survey?.title ?? "Encuesta sin título",   // 👈 español
      preguntas: m.survey?.questions ?? [],               // 👈 español
      imagenes,                                           // 👈 español
      created_at: m.fecha,
      tipo: "normal",                                     // patrocinadas siempre normales
      description: m.survey?.description ?? "",
      media_url: m.survey?.media_url ?? null,
      media_urls: imagenes,
      reward: m.monto,   // 👈 aquí pasas el valor ganado
    };
  });

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