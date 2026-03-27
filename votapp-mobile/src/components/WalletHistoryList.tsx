// src/components/WalletHistoryList.tsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config/api";
import SimpleSurveyGrid from "./SimpleSurveyGrid";

type Movimiento = {
  id: number;
  monto: number;
  fecha: string;
  patrocinado: boolean;
  survey: {
    titulo_corto: string;
    imagenes: string[];
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

  useEffect(() => {
    const fetchMovements = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        const res = await fetch(`${API_URL}/users/me/wallet/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data: WalletResponse = await res.json();
          setMovements(data.movimientos); // 👈 ahora tomamos solo los movimientos
        } else if (res.status === 404) {
          setMovements([]);
        } else {
          setError("No se pudo cargar el historial de billetera.");
        }
      } catch (err) {
        console.log("Error obteniendo historial de billetera:", err);
        setError("No se pudo cargar el historial de billetera.");
      } finally {
        setLoading(false);
      }
    };
    fetchMovements();
  }, []);

  if (loading) return <Text style={styles.text}>Cargando movimientos...</Text>;
  if (error) return <Text style={styles.text}>{error}</Text>;
  if (movements.length === 0)
    return <Text style={styles.text}>No hay movimientos en tu billetera.</Text>;

  return (
    <View>
      {/* 👇 Grid con encuestas patrocinadas */}
      <SimpleSurveyGrid
        data={movements.map((m) => ({
          id: m.id,
          titulo: m.survey.titulo_corto,
          preguntas: [],
          imagenes: m.survey.imagenes,
          ingreso: m.monto,
          fecha: m.fecha,
        }))}
      />
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