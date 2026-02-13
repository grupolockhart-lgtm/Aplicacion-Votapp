// src/components/SurveyCard.tsx
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import FeedMedia from "@/components/FeedMedia";
import FeedMediaYoutube from "@/components/FeedMediaYoutube";
import SurveyMediaCarousel from "@/components/SurveyMediaCarousel";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config/api";

interface Survey {
  id: number;
  title: string;
  description?: string;
  media_url?: string;
  media_urls?: string[] | string;
  media_type?: string;
  segundos_restantes?: number;
  patrocinada?: boolean;
  patrocinador?: string;
  es_patrocinada?: boolean;
  recompensa_puntos?: number;
  recompensa_dinero?: number;
  presupuesto_total?: number;
  visibilidad_resultados?: "publica" | "privada";
}

export default function SurveyCard({
  survey,
  globalMuted,
  toggleMute,
  badgeText,
  isVisible,
  children,
  onPress,
}: {
  survey: Survey;
  globalMuted: boolean;
  toggleMute: () => void;
  badgeText: string;
  isVisible: boolean;
  children?: React.ReactNode;
  onPress?: () => void;
}) {
  const isFocused = useIsFocused();
  const active = isFocused && isVisible;
  const navigation = useNavigation();

  const [commentsCount, setCommentsCount] = useState<number>(0);

  useEffect(() => {
    const fetchCommentsCount = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        const res = await fetch(`${API_URL}/comments/survey/${survey.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setCommentsCount(data.length);
        }
      } catch (err) {
        console.log("Error obteniendo comentarios:", err);
      }
    };

    if (isFocused) {
      fetchCommentsCount();
    }
  }, [isFocused, survey.id]);

  return (
    <View style={[styles.post, survey.es_patrocinada && styles.patrocinadaPost]}>
      {survey.media_url?.includes("youtube.com") ? (
        // ✅ Siempre prioriza YouTube si el enlace es válido
        <FeedMediaYoutube source_url={survey.media_url} />
      ) : survey.media_url && /\.(mp4|mov)$/i.test(survey.media_url) ? (
        // ✅ Videos locales (mp4/mov)
        <FeedMedia
          media_url={survey.media_url}
          isActive={active}
          globalMuted={globalMuted}
          toggleMute={toggleMute}
        />
      ) : Array.isArray(survey.media_urls) && survey.media_urls.length > 0 ? (
        // ✅ Carrusel solo si no hay video
        <SurveyMediaCarousel
          media={survey.media_urls.map((url) => ({ url, type: "image" }))}
          globalMuted={globalMuted}
          toggleMute={toggleMute}
          isActive={active}
        />
      ) : (
        <Text style={{ padding: 12, color: "#888" }}>
          No hay contenido multimedia disponible
        </Text>
      )}

      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <View style={styles.postContent}>
          <Text style={styles.cardTitle}>{survey.title}</Text>
          {survey.description && (
            <Text style={styles.cardDescription}>{survey.description}</Text>
          )}

          {badgeText ? (
            <View
              style={[
                styles.badge,
                survey.es_patrocinada && styles.patrocinadaBadge,
                badgeText === "Participaste" && styles.participasteBadge,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  survey.es_patrocinada && styles.patrocinadaBadgeText,
                  badgeText === "Participaste" && styles.participasteBadgeText,
                ]}
              >
                {badgeText}
                {survey.es_patrocinada &&
                  ` - ${survey.recompensa_puntos} pts / $${survey.recompensa_dinero}`}
              </Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() =>
          (navigation as any).navigate("SurveyCommentsScreen", {
            surveyId: survey.id,
          })
        }
        activeOpacity={0.7}
      >
        <Text style={styles.commentsText}>
          💬 {commentsCount} comentarios
        </Text>
      </TouchableOpacity>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  post: {
    marginBottom: 20,
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  patrocinadaPost: { borderColor: "#FFD700", borderWidth: 2 },
  postContent: { padding: 12 },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#111827" },
  cardDescription: { fontSize: 14, color: "#555", marginTop: 4 },
  badge: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  patrocinadaBadge: { backgroundColor: "#FFD700" },
  badgeText: { fontSize: 12, fontWeight: "600", color: "#374151" },
  patrocinadaBadgeText: { color: "#000" },
  participasteBadge: { backgroundColor: "#10B981" },
  participasteBadgeText: { color: "#fff" },
  commentsText: { fontSize: 13, color: "#2563eb", marginTop: 6 },
});