// src/components/SimpleSurveyGrid.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Text,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config/api";
import { useNavigation } from "@react-navigation/native";

interface Opcion {
  id: number;
  texto: string;
  votos: number;
}

interface Pregunta {
  id: number;
  texto: string;
  opciones: Opcion[];
}

interface SimpleSurvey {
  id: number;
  titulo: string;
  preguntas: Pregunta[];
  imagenes: string[];
}

export default function SimpleSurveyGrid() {
  const [surveys, setSurveys] = useState<SimpleSurvey[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const loadSurveys = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        if (!token) {
          console.warn("No se encontró token de usuario");
          return;
        }

        const res = await fetch(`${API_URL}/api/users/me/surveys/simple`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        console.log("Encuestas simples cargadas:", data);

        setSurveys(data);
      } catch (err) {
        console.error("Error cargando encuestas simples:", err);
      } finally {
        setLoading(false);
      }
    };
    loadSurveys();
  }, []);

  if (loading) return <ActivityIndicator size="large" color="#2563EB" />;

  if (!loading && surveys.length === 0) {
    return (
      <View style={{ alignItems: "center", marginTop: 10 }}>
        <Text style={{ color: "#6B7280" }}>No tienes encuestas simples aún</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={surveys}
      keyExtractor={(item) => item.id.toString()}
      numColumns={2}
      key={2}
      columnWrapperStyle={{ justifyContent: "space-between", marginBottom: 12 }}
      contentContainerStyle={{ paddingHorizontal: 16 }}
      renderItem={({ item }) => {
        const firstImage =
          Array.isArray(item.imagenes) && item.imagenes.length > 0
            ? item.imagenes[0]
            : "https://via.placeholder.com/120";

        return (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("ResultsScreen", {
                surveyId: item.id,
                surveyType: "simple",
                title: item.titulo,
                description: "Encuesta simple",
                media_url: firstImage,
              })
            }
            style={{
              flex: 1,
              margin: 6,
              padding: 12,
              borderRadius: 8,
              backgroundColor: "#F9FAFB",
              shadowColor: "#000",
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 8 }}>
              {item.titulo}
            </Text>
            <Image
              source={{ uri: firstImage }}
              style={{ width: "100%", height: 120, borderRadius: 8 }}
              resizeMode="cover"
            />
            {item.preguntas.map((pregunta) => (
              <View key={pregunta.id} style={{ marginTop: 10 }}>
                <Text style={{ fontSize: 14, fontWeight: "600" }}>
                  {pregunta.texto}
                </Text>
                {pregunta.opciones.map((opcion) => (
                  <Text key={opcion.id} style={{ fontSize: 13, color: "#374151" }}>
                    • {opcion.texto} ({opcion.votos} votos)
                  </Text>
                ))}
              </View>
            ))}
          </TouchableOpacity>
        );
      }}
    />
  );
}