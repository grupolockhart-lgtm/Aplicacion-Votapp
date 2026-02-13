import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import axios from "axios";
import { useRoute } from "@react-navigation/native";

interface Survey {
  id: number;
  titulo: string;
  estado: string;
  version: number;
  creado_en: string;
}

export default function SurveyHistory() {
  const route = useRoute();
  const { originalId } = route.params as { originalId: number };

  const [history, setHistory] = useState<Survey[]>([]);

  useEffect(() => {
    axios
      .get(`https://aplicacion-votapp.onrender.com/api/admin/surveys/history/${originalId}`)
      .then((res) => setHistory(res.data))
      .catch((err) => console.error(err));
  }, [originalId]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Historial de versiones</Text>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.version}>Versión {item.version}</Text>
            <Text>{item.titulo}</Text>
            <Text>Estado: {item.estado}</Text>
            <Text>Creado: {new Date(item.creado_en).toLocaleDateString()}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 12 },
  item: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 6,
  },
  version: { fontWeight: "bold" },
});