// src/components/SimpleSurveyGrid.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Text,
  Dimensions,
  StyleSheet,
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

interface Survey {
  id: number;
  titulo: string;
  preguntas?: Pregunta[];
  imagenes: string[];
  created_at?: string;
  tipo?: string;          // "simple" o "normal"
  description?: string;
  reward?: number;        // 👈 nuevo campo para mostrar recompensa
}

type Props = {
  data?: Survey[];
};

export default function SimpleSurveyGrid({ data }: Props) {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const loadSurveys = async () => {
      if (data) {
        const sorted = [...data].sort((a, b) => {
          if (a.created_at && b.created_at) {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          }
          return b.id - a.id;
        });
        setSurveys(sorted);
        setLoading(false);
        return;
      }

      try {
        const token = await AsyncStorage.getItem("userToken");
        if (!token) {
          console.warn("No se encontró token de usuario");
          return;
        }

        const res = await fetch(`${API_URL}/users/me/surveys/simple`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const raw = await res.json();
        const normalized = Array.isArray(raw)
          ? raw.map((s: any) => ({
              id: s.id,
              titulo: s.titulo ?? s.title,
              preguntas: (s.preguntas ?? s.questions ?? []).map((q: any) => ({
                id: q.id,
                texto: q.texto ?? q.text,
                opciones: (q.opciones ?? q.options ?? []).map((o: any) => ({
                  id: o.id,
                  texto: o.texto ?? o.text,
                  votos: o.votos ?? o.count ?? 0,
                })),
              })),
              imagenes: s.imagenes ?? s.media_urls ?? [],
              created_at: s.created_at ?? s.date ?? null,
              tipo: s.tipo ?? "simple",
              description: s.description ?? "",
              reward: s.reward ?? null,   // 👈 normalizamos reward si viene del backend
            }))
          : [];

        normalized.sort((a, b) => {
          if (a.created_at && b.created_at) {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          }
          return b.id - a.id;
        });

        setSurveys(normalized);
      } catch (err) {
        console.error("Error cargando encuestas:", err);
      } finally {
        setLoading(false);
      }
    };
    loadSurveys();
  }, [data]);

  if (loading) return <ActivityIndicator size="large" color="#2563EB" />;

  if (!loading && surveys.length === 0) {
    return (
      <View style={{ alignItems: "center", marginTop: 10 }}>
        <Text style={{ color: "#6B7280" }}>No hay encuestas disponibles</Text>
      </View>
    );
  }

  const screenWidth = Dimensions.get("window").width;
  const cardWidth = (screenWidth - 64) / 3;

  return (
    <FlatList
      data={surveys}
      keyExtractor={(item) => item.id.toString()}
      numColumns={3}
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
                surveyType: item.tipo ?? "normal",
                title: item.titulo,
                description: item.description ?? "",
                questions: item.preguntas,
                media_url: firstImage,
                media_urls: item.imagenes,
              })
            }
            style={[styles.card, { width: cardWidth }]}
          >
            <Image source={{ uri: firstImage }} style={styles.image} resizeMode="cover" />
            <Text style={styles.title} numberOfLines={2}>{item.titulo}</Text>

            {/* 👇 Mostrar recompensa si existe */}
            {item.reward !== undefined && item.reward !== null && (
              <Text style={styles.reward}>💵 ${item.reward}</Text>
            )}
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 6,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: 80,
    borderRadius: 6,
    marginBottom: 6,
  },
  title: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  reward: {
    fontSize: 11,
    fontWeight: "600",
    color: "#16A34A",   // verde para resaltar
    marginTop: 2,
    textAlign: "center",
  },
});