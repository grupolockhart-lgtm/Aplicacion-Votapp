// src/screens/DisponiblesScreen.tsx
import React, { useState, useRef } from "react";
import { FlatList, ViewToken } from "react-native";
import { useNavigation } from "@react-navigation/native";
import CountdownTimer from "@/components/CountdownTimer";
import SurveyCard from "@/components/SurveyCard";
import type { Survey } from "@/screens/SurveysScreen";  // 👈 Importamos el tipo único

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
      // 👇 Ordenamos por fecha_creacion DESC (más recientes primero)
      data={[...surveys].sort(
        (a, b) =>
          new Date(b.fecha_creacion ?? 0).getTime() -
          new Date(a.fecha_creacion ?? 0).getTime()
      )}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => {
        // 👇 Log compacto solo para encuestas simples
        if (item.tipo === "simple") {
          console.log("RenderItem recibió encuesta simple:", {
            id: item.id,
            title: item.title,
          });
        }

        return (
          <SurveyCard
            survey={item}
            globalMuted={globalMuted}
            toggleMute={toggleMute}
            badgeText={
              item.tipo === "simple"
                ? "📝 Encuesta Simple"
                : item.patrocinada
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
                media_type: item.media_type,
                refreshSurveys,
                refreshProfile,
              })
            }
          >
            {item.segundos_restantes !== undefined && (
              <CountdownTimer segundosIniciales={item.segundos_restantes} />
            )}
          </SurveyCard>
        );
      }}
      onViewableItemsChanged={onViewableItemsChanged.current}
      viewabilityConfig={viewabilityConfig}
    />
  );
}
