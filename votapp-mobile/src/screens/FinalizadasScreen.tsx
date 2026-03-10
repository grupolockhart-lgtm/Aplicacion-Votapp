// src/screens/FinalizadasScreen.tsx
import React, { useState, useRef } from "react";
import { FlatList, ViewToken, Button, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import SurveyCard from "@/components/SurveyCard";

// -------------------
// Tipos
// -------------------

// Normal
interface Survey {
  id: number;
  title: string;
  description?: string;
  media_url?: string;
  media_urls?: string[];
  sponsor_id?: string;
  patrocinador?: string;
  es_patrocinada?: boolean;
  recompensa_puntos?: number;
  recompensa_dinero?: number;
  presupuesto_total?: number;
  visibilidad_resultados?: "publica" | "privada";
  tipo?: "normal";
}

// Simple
interface SurveySimple {
  id: number;
  titulo: string;
  opciones: { id: number; texto: string; votos: number }[];
  imagenes?: string[];
  videos?: string[];
  fecha_expiracion?: string;
  estado?: string;
  tipo?: "simple";
}

// Unión
type UnifiedSurvey = Survey | SurveySimple;

interface FinalizadasProps {
  surveys: UnifiedSurvey[];   // ✅ ahora acepta ambos tipos
  globalMuted: boolean;
  toggleMute: () => void;
  refreshSurveys: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  userRole: string;
  currentSponsorId?: string;
}

export default function FinalizadasScreen({
  surveys,
  globalMuted,
  toggleMute,
  refreshSurveys,
  refreshProfile,
  userRole,
  currentSponsorId,
}: FinalizadasProps) {
  const navigation = useNavigation();
  const [visibleIds, setVisibleIds] = useState<number[]>([]);

  const filteredSurveys =
    userRole === "sponsor" && currentSponsorId
      ? surveys.filter((s) => (s as Survey).sponsor_id === currentSponsorId)
      : surveys;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      setVisibleIds(viewableItems.map((vi) => vi.item.id as number));
    }
  );

  const viewabilityConfig = { itemVisiblePercentThreshold: 50 };

  return (
    <FlatList
      data={filteredSurveys}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={{ padding: 10 }}
      renderItem={({ item }) => {
        const isSimple = item.tipo === "simple";
        const survey = item as Survey;

        return (
          <View>
            <SurveyCard
              survey={survey}
              globalMuted={globalMuted}
              toggleMute={toggleMute}
              badgeText={
                isSimple
                  ? "📝 Encuesta Simple - Finalizada"
                  : survey.es_patrocinada
                  ? `💰 Patrocinada - Finalizada (+${survey.recompensa_puntos ?? 0} pts / $${survey.recompensa_dinero ?? 0})`
                  : "🏁 Finalizada"
              }
              isVisible={visibleIds.includes(item.id)}
              onPress={() =>
                (navigation as any).navigate("ResultsScreen", {
                  surveyId: item.id,
                  title: isSimple ? (item as SurveySimple).titulo : survey.title,
                  description: isSimple ? undefined : survey.description,
                  media_url: survey.media_url,
                  media_urls: isSimple ? (item as SurveySimple).imagenes : survey.media_urls,
                  refreshSurveys,
                  refreshProfile,
                })
              }
            />

            {/* 👇 Botón de historial solo para admin */}
            {userRole === "admin" && (
              <Button
                title="Ver historial"
                onPress={() =>
                  (navigation as any).navigate("SurveyHistory", {
                    originalId: item.id,
                  })
                }
              />
            )}
          </View>
        );
      }}
      onViewableItemsChanged={onViewableItemsChanged.current}
      viewabilityConfig={viewabilityConfig}
    />
  );
}