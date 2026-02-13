// src/screens/FinalizadasScreen.tsx
import React, { useState, useRef } from "react";
import { FlatList, ViewToken, Button, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import SurveyCard from "@/components/SurveyCard";

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
}

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
      ? surveys.filter((s) => s.sponsor_id === currentSponsorId)
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
              item.es_patrocinada
                ? `💰 Patrocinada - Finalizada (+${item.recompensa_puntos ?? 0} pts / $${item.recompensa_dinero ?? 0})`
                : "🏁 Finalizada"
            }
            isVisible={visibleIds.includes(item.id)}
            onPress={() =>
              (navigation as any).navigate("ResultsScreen", {
                surveyId: item.id,
                title: item.title,
                description: item.description,
                media_url: item.media_url,
                media_urls: item.media_urls,
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
      )}
      onViewableItemsChanged={onViewableItemsChanged.current}
      viewabilityConfig={viewabilityConfig}
    />
  );
}