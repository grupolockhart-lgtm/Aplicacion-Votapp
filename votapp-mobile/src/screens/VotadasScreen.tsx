// src/screens/VotadasScreen.tsx
import React, { useState, useRef } from "react";
import { FlatList, ViewToken } from "react-native";
import { useNavigation } from "@react-navigation/native";
import SurveyCard from "@/components/SurveyCard";

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
}

interface VotadasProps {
  surveys: Survey[];
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
      renderItem={({ item }) => (
        <SurveyCard
          survey={item}
          globalMuted={globalMuted}
          toggleMute={toggleMute}
          badgeText={
            item.es_patrocinada
              ? `💰 Patrocinada - Votada (+${item.recompensa_puntos ?? 0} pts / $${item.recompensa_dinero ?? 0})`
              : "✅ Votada"
          }
          isVisible={visibleIds.includes(item.id)}
          onPress={() =>
            (navigation as any).navigate("ResultsScreen", {
              surveyId: item.id,
              title: item.title,
              description: item.description,
              questions: item.questions,
              media_url: item.media_url,
              media_urls: item.media_urls,
              refreshSurveys,
              refreshProfile,
            })
          }
        />
      )}
      onViewableItemsChanged={onViewableItemsChanged.current}
      viewabilityConfig={viewabilityConfig}
    />
  );
}