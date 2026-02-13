// -----------------------------
// Componente SurveyHistoryList
// -----------------------------
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { API_URL } from "../config/api";
import { RootStackParamList } from "../Types/Navigation";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

type SurveyHistory = {
  id: number;
  title: string;
  completed_at: string;
};

export default function SurveyHistoryList() {
  const [history, setHistory] = useState<SurveyHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        const res = await fetch(`${API_URL}/users/me/surveys/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setHistory(data);
        } else if (res.status === 404) {
          setHistory([]);
        } else {
          setError("No se pudo cargar el historial.");
        }
      } catch (err) {
        console.log("Error obteniendo historial:", err);
        setError("No se pudo cargar el historial.");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <View style={styles.card}>
        <Text style={styles.text}>Cargando historial...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.card}>
        <Text style={styles.text}>{error}</Text>
      </View>
    );
  }

  if (history.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.text}>No hay encuestas en tu historial.</Text>
      </View>
    );
  }

  const ultimasEncuestas = history.slice(0, 3);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Historial encuestas completadas</Text>
      {ultimasEncuestas.map((item) => (
        <View key={item.id} style={styles.row}>
          <Text
            style={styles.surveyTitle}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.title}
          </Text>
          <View style={styles.rowRight}>
            <Text style={styles.badge}>✔</Text>
            <Text style={styles.date}>
              {new Date(item.completed_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
      ))}

      {/* ✅ Botón al final igual al de Billetera */}
      <TouchableOpacity
        style={{ marginTop: 8 }}
        onPress={() =>
          navigation.navigate("SurveyHistoryScreen", { history })
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
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  text: { fontSize: 14, color: "#111827", textAlign: "center" },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 12, color: "#2563EB" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  surveyTitle: {
    flexShrink: 1,
    flexGrow: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    marginRight: 8,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
  },
  badge: {
    backgroundColor: "#10B981",
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
    textAlign: "center",
  },
  date: { fontSize: 11, color: "#6B7280" },
});


