import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import axios from "axios";

const Tab = createMaterialTopTabNavigator();

type Survey = {
  id: number;
  title: string;
  description: string;
  options: { id: number; text: string }[];
  fecha_expiracion: string;
};

const SurveyList = ({ endpoint }: { endpoint: string }) => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        // 🔒 Token dinámico (ejemplo: desde AsyncStorage o Context)
        const token = "TOKEN_VALIDO"; // reemplaza con tu lógica real

        const res = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // ✅ Validación de la respuesta
        if (Array.isArray(res.data)) {
          setSurveys(res.data);
        } else {
          Alert.alert("Error", "La respuesta del servidor no es válida");
        }
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "No se pudieron cargar las encuestas");
      } finally {
        setLoading(false);
      }
    };

    fetchSurveys();
  }, [endpoint]);

  const renderItem = ({ item }: { item: Survey }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
      <Text style={styles.options}>
        {item.options.map((opt) => `• ${opt.text}`).join("\n")}
      </Text>
      <Text style={styles.expiration}>
        Expira el {new Date(item.fecha_expiracion).toLocaleString("es-DO")}
      </Text>
    </View>
  );

  if (loading) {
    return <ActivityIndicator size="large" color="#000" style={{ marginTop: 20 }} />;
  }

  return (
    <FlatList
      data={surveys}
      renderItem={renderItem}
      keyExtractor={(item) => item.id.toString()}
    />
  );
};

export default function SurveyTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Disponibles">
        {() => <SurveyList endpoint="https://tudominio/api/surveys/disponibles" />}
      </Tab.Screen>
      <Tab.Screen name="Votadas">
        {() => <SurveyList endpoint="https://tudominio/api/surveys/votadas" />}
      </Tab.Screen>
      <Tab.Screen name="Finalizadas">
        {() => <SurveyList endpoint="https://tudominio/api/surveys/finalizadas" />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 16,
    margin: 8,
    borderRadius: 8,
    elevation: 2,
  },
  title: { fontSize: 16, fontWeight: "bold" },
  description: { fontSize: 14, marginBottom: 8 },
  options: { fontSize: 14, color: "#333" },
  expiration: { fontSize: 12, color: "#888", marginTop: 8 },
});