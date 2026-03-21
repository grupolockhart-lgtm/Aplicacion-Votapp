// src/screens/VoteScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config/api";
import FeedMedia from "../components/FeedMedia";
import FeedMediaYoutube from "../components/FeedMediaYoutube";
import SurveyMediaCarousel from "../components/SurveyMediaCarousel";

import type { RootStackParamList } from "../Types/Navigation";
import { useSurveyContext } from "../context/SurveyContext";

interface Option {
  id: number;
  text: string;
}

interface Question {
  id: number;
  text: string;
  options: Option[];
}

type Props = NativeStackScreenProps<RootStackParamList, "VoteScreen">;

export default function VoteScreen({ route, navigation }: Props) {
  const { surveyId, surveyType, questions, media_url, media_urls } = route.params;
  const { refreshSurveys, refreshProfile } = useSurveyContext();

  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [loading, setLoading] = useState(false);
  const [globalMuted, setGlobalMuted] = useState(true);

  useEffect(() => {
    const checkVote = async () => {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;

      const endpoint =
        surveyType === "normal"
          ? `${API_URL}/surveys/${surveyId}/my-vote`
          : `${API_URL}/${surveyId}/my-vote`;


      try {
        const res = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          if (data?.answers?.length > 0) {
            navigation.replace("ResultsScreen", {
              surveyId,
              surveyType,
              media_url,
              media_urls,
              title: "Resultados",
              description: "Resultados de la encuesta",
            });
          }
        } else if (res.status === 401) {
          await AsyncStorage.removeItem("userToken");
          Alert.alert("Sesión expirada", "Por favor inicia sesión nuevamente.");
          navigation.navigate("LoginScreen");
        }
      } catch (err) {
        console.log("Error verificando voto:", err);
      }
    };
    checkVote();
  }, [surveyId, surveyType]);

  const handleSelect = (questionId: number, optionId: number) => {
    setAnswers({ ...answers, [questionId]: optionId });
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      Alert.alert("Error", "Debes responder todas las preguntas antes de confirmar.");
      return;
    }

    if (loading) return;

    const token = await AsyncStorage.getItem("userToken");
    if (!token) {
      Alert.alert("Error", "No se encontró el token de sesión. Inicia sesión nuevamente.");
      navigation.navigate("LoginScreen");
      return;
    }

    const payload = {
      answers: Object.entries(answers).map(([qId, optId]) => ({
        question_id: Number(qId),
        option_id: optId,
      })),
    };

    const endpoint =
      surveyType === "normal"
        ? `${API_URL}/surveys/${surveyId}/vote`
        : `${API_URL}/${surveyId}/vote`;


    try {
      setLoading(true);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (res.status === 401) {
        await AsyncStorage.removeItem("userToken");
        Alert.alert("Sesión expirada", "Tu sesión ha caducado. Inicia sesión nuevamente.");
        navigation.navigate("LoginScreen");
        return;
      }

      if (!res.ok) {
        const message = data?.detail || data?.message || "Error al enviar voto";
        throw new Error(message);
      }

      Alert.alert("¡Respuestas enviadas!", "Tus votos han sido registrados correctamente.");
      await refreshProfile();
      await refreshSurveys();

      navigation.replace("ResultsScreen", {
        surveyId,
        surveyType,
        media_url,
        media_urls,
        title: "Resultados",
        description: "Resultados de la encuesta",
      });
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Encuesta</Text>

      {media_url?.includes("youtube.com") ? (
        <FeedMediaYoutube source_url={media_url} />
      ) : media_url && /\.(mp4|mov)$/i.test(media_url) ? (
        <FeedMedia
          media_url={media_url}
          isActive={true}
          globalMuted={globalMuted}
          toggleMute={() => setGlobalMuted(!globalMuted)}
        />
      ) : Array.isArray(media_urls) && media_urls.length > 0 ? (
        <SurveyMediaCarousel
          media={media_urls.map((url) => ({ url, type: "image" }))}
          globalMuted={globalMuted}
          toggleMute={() => setGlobalMuted(!globalMuted)}
          isActive={true}
        />
      ) : (
        <Text style={{ padding: 12, color: "#888" }}>
          No hay contenido multimedia disponible
        </Text>
      )}

      {questions.map((q: Question) => (
        <View key={q.id} style={styles.questionBlock}>
          <Text style={styles.questionText}>{q.text}</Text>
          {q.options.map((o: Option) => (
            <TouchableOpacity
              key={o.id}
              style={[
                styles.optionButton,
                answers[q.id] === o.id && styles.optionSelected,
              ]}
              onPress={() => handleSelect(q.id, o.id)}
            >
              <Text style={styles.optionText}>{o.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>Confirmar Voto</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  title: { fontSize: 22, fontWeight: "700", marginVertical: 15, color: "#111827" },
  questionBlock: { marginBottom: 25 },
  questionText: { fontSize: 18, fontWeight: "600", marginBottom: 8, color: "#111827" },
  optionButton: {
    padding: 12,
    marginVertical: 4,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
  },
  optionSelected: {
    backgroundColor: "#DBEAFE",
    borderColor: "#2563EB",
  },
  optionText: { fontSize: 16, color: "#111827" },
  submitButton: {
    backgroundColor: "#2563EB",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});