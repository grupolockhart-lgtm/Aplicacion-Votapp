// src/screens/DisponiblesScreen.tsx
import React, { useState, useRef } from "react";
import { FlatList, ViewToken } from "react-native";
import { useNavigation } from "@react-navigation/native";
import CountdownTimer from "@/components/CountdownTimer";
import SurveyCard from "@/components/SurveyCard";

interface Survey {
  id: number;
  title: string;
  description?: string;
  questions: any[];
  media_url?: string;
  media_urls?: string[];
  media_type?: "native" | "webview";   // ✅ añadido
  segundos_restantes?: number;
  patrocinada?: boolean;
  patrocinador?: string;
  es_patrocinada?: boolean;

  recompensa_puntos?: number;
  recompensa_dinero?: number;
  presupuesto_total?: number;
  visibilidad_resultados?: "publica" | "privada";
}

interface DisponiblesProps {
  surveys: Survey[];
  globalMuted: boolean;
  toggleMute: () => void;
  refreshSurveys: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export default function DisponiblesScreen({
  surveys,
  globalMuted,
  toggleMute,
  refreshSurveys,
  refreshProfile,
}: DisponiblesProps) {
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
              ? `💰 Patrocinada - ${item.recompensa_puntos ?? 0} pts / $${item.recompensa_dinero ?? 0}`
              : "⏳ Disponible"
          }
          isVisible={visibleIds.includes(item.id)}
          onPress={() =>
            (navigation as any).navigate("VoteScreen", {
              surveyId: item.id,
              title: item.title,
              description: item.description,
              questions: item.questions,
              media_url: item.media_url,
              media_urls: item.media_urls,
              media_type: item.media_type,   // ✅ ahora sí se pasa
              refreshSurveys,
              refreshProfile,
            })
          }
        >
          {typeof item.segundos_restantes === "number" && (
            <CountdownTimer segundosIniciales={item.segundos_restantes} />
          )}
        </SurveyCard>
      )}
      onViewableItemsChanged={onViewableItemsChanged.current}
      viewabilityConfig={viewabilityConfig}
    />
  );
}