// src/screens/VotadasScreen.tsx
import React, { useState, useRef } from "react";
import { FlatList, ViewToken } from "react-native";
import { useNavigation } from "@react-navigation/native";
import SurveyCard from "@/components/SurveyCard";

// -------------------
// Tipos
// -------------------

// Normal
interface Option {
  id: number;
  text: string;
  count?: number;
  percentage?: number;
}

interface Question {
  id: number;
  text: string;
  options: Option[];
  total_votes?: number | null;
}

interface Survey {
  id: number;
  title: string;
  description?: string;
  questions: Question[];
  media_url?: string;
  media_urls?: string[];
  patrocinada?: boolean;
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

interface VotadasProps {
  surveys: UnifiedSurvey[];   // ✅ ahora acepta ambos tipos
  globalMuted: boolean;
  toggleMute: () => void;
  refreshSurveys: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export default function VotadasScreen({
  surveys,
  globalMuted,
  toggleMute,
  refreshSurveys,
  refreshProfile,
}: VotadasProps) {
  const navigation = useNavigation();
  const [visibleIds, setVisibleIds] = useState<number[]>([]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      setVisibleIds(viewableItems.map((vi) => vi.item.id as number));
    }
  );

  const viewabilityConfig = { itemVisiblePercentThreshold: 50 };

  return (
    <FlatList
      data={surveys}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={{ padding: 10 }}
      renderItem={({ item }) => {
        const isSimple = item.tipo === "simple";
        const survey = item as Survey;

        return (
          <SurveyCard
            survey={survey}
            globalMuted={globalMuted}
            toggleMute={toggleMute}
            badgeText={
              isSimple
                ? "📝 Encuesta Simple - Votada"
                : survey.es_patrocinada
                ? `💰 Patrocinada - Votada (+${survey.recompensa_puntos ?? 0} pts / $${survey.recompensa_dinero ?? 0})`
                : "✅ Votada"
            }
            isVisible={visibleIds.includes(item.id)}
            onPress={() =>
              (navigation as any).navigate("ResultsScreen", {
                surveyId: item.id,
                title: isSimple ? (item as SurveySimple).titulo : survey.title,
                description: isSimple ? undefined : survey.description,
                questions: isSimple ? (item as SurveySimple).opciones : survey.questions,
                media_url: survey.media_url,
                media_urls: isSimple ? (item as SurveySimple).imagenes : survey.media_urls,
                refreshSurveys,
                refreshProfile,
              })
            }
          />
        );
      }}
      onViewableItemsChanged={onViewableItemsChanged.current}
      viewabilityConfig={viewabilityConfig}
    />
  );
}