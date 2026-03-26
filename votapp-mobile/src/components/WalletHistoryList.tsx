// src/components/WalletHistoryList.tsx
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { API_URL } from "../config/api";
import { RootStackParamList } from "../Types/Navigation";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import SimpleSurveyGrid from "./SimpleSurveyGrid";

type WalletMovement = {
  id: number;
  tipo: "ingreso" | "retiro";
  monto: number;
  fecha: string;
  patrocinado?: boolean;
  bonus?: boolean;
};

export default function WalletHistoryList() {
  const [movements, setMovements] = useState<WalletMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    const fetchMovements = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        const res = await fetch(`${API_URL}/users/me/wallet/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setMovements(data);
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
      {/* 👇 Usamos SimpleSurveyGrid con data */}
      <SimpleSurveyGrid
        data={movements.map((m) => ({
          id: m.id,
          titulo: m.tipo === "ingreso" ? `Ingreso de ${m.monto}` : `Retiro de ${m.monto}`,
          preguntas: [], // no aplican preguntas aquí
          imagenes: [],  // sin imágenes en movimientos
        }))}
      />

      <TouchableOpacity
        style={{ marginTop: 8 }}
        onPress={() =>
          navigation.navigate("WalletHistoryScreen", { movimientos: movements })
        }
      >
        <Text style={{ color: "#2563EB", fontWeight: "600" }}>
          Ver historial completo →
        </Text>
      </TouchableOpacity>
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