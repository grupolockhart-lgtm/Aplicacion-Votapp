// src/screens/FinalizadasScreen.tsx
import React, { useState, useRef } from "react";
import { FlatList, ViewToken, Button, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import SurveyCard from "@/components/SurveyCard";
import type { Survey } from "@/screens/SurveysScreen";

interface FinalizadasProps {
  surveys: Survey[];
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
      ? surveys.filter((s) => s.patrocinador === currentSponsorId)
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
      renderItem={({ item }) => (
        <View>
          <SurveyCard
            survey={item}
            globalMuted={globalMuted}
            toggleMute={toggleMute}
            badgeText={
              item.tipo === "simple"
                ? "📝 Encuesta Simple - Finalizada"
                : item.es_patrocinada
                ? `💰 Patrocinada - Finalizada (+${item.recompensa_puntos ?? 0} pts / $${item.recompensa_dinero ?? 0})`
                : "🏁 Finalizada"
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
      )}
      onViewableItemsChanged={onViewableItemsChanged.current}
      viewabilityConfig={viewabilityConfig}
    />
  );
}