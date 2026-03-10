// src/screens/DisponiblesScreen.tsx
import React, { useState, useRef } from "react";
import { FlatList, ViewToken } from "react-native";
import { useNavigation } from "@react-navigation/native";
import CountdownTimer from "@/components/CountdownTimer";
import SurveyCard from "@/components/SurveyCard";

// -------------------
// Tipos
// -------------------

// Normal
interface Survey {
  id: number;
  title: string;
  description?: string;
  questions: any[];
  media_url?: string;
  media_urls?: string[];
  media_type?: "native" | "webview";
  segundos_restantes?: number;
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

interface DisponiblesProps {
  surveys: UnifiedSurvey[];
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
      renderItem={({ item }) => {
        const isSimple = item.tipo === "simple";

        return (
          <SurveyCard
            survey={item as Survey} // ✅ SurveyCard sigue esperando Survey
            globalMuted={globalMuted}
            toggleMute={toggleMute}
            badgeText={
              isSimple
                ? "📝 Encuesta Simple"
                : (item as Survey).es_patrocinada
                ? `💰 Patrocinada - ${(item as Survey).recompensa_puntos ?? 0} pts / $${(item as Survey).recompensa_dinero ?? 0}`
                : "⏳ Disponible"
            }
            isVisible={visibleIds.includes(item.id)}
            onPress={() =>
              (navigation as any).navigate("VoteScreen", {
                surveyId: item.id,
                title: isSimple ? (item as SurveySimple).titulo : (item as Survey).title,
                description: isSimple ? undefined : (item as Survey).description,
                questions: isSimple ? (item as SurveySimple).opciones : (item as Survey).questions,
                media_url: (item as Survey).media_url,
                media_urls: isSimple ? (item as SurveySimple).imagenes : (item as Survey).media_urls,
                media_type: isSimple ? "native" : (item as Survey).media_type,
                refreshSurveys,
                refreshProfile,
              })
            }
          >
            {/* Countdown para simples */}
            {isSimple && (item as SurveySimple).fecha_expiracion && (
              <CountdownTimer
                segundosIniciales={Math.max(
                  0,
                  Math.floor(
                    (new Date((item as SurveySimple).fecha_expiracion!).getTime() - Date.now()) / 1000
                  )
                )}
              />
            )}

            {/* Countdown para normales */}
            {!isSimple && typeof (item as Survey).segundos_restantes === "number" && (
              <CountdownTimer segundosIniciales={(item as Survey).segundos_restantes!} />
            )}
          </SurveyCard>
        );
      }}
      onViewableItemsChanged={onViewableItemsChanged.current}
      viewabilityConfig={viewabilityConfig}
    />
  );
}