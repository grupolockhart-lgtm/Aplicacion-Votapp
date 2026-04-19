// src/screens/PersonalesScreen.tsx
import React from "react";
import { FlatList, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import CountdownTimer from "@/components/CountdownTimer";
import SurveyCard from "@/components/SurveyCard";
import type { Survey } from "@/screens/SurveysScreen";

// -------------------
// Props
// -------------------
interface PersonalesProps {
  surveys: Survey[];
  globalMuted: boolean;
  toggleMute: () => void;
}

// -------------------
// Componente principal
// -------------------
export default function PersonalesScreen({
  surveys,
  globalMuted,
  toggleMute,
}: PersonalesProps) {
  const navigation = useNavigation();

  return (
    <FlatList
      data={[...surveys].sort(
        (a, b) =>
          new Date(b.fecha_creacion ?? 0).getTime() -
          new Date(a.fecha_creacion ?? 0).getTime()
      )}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <SurveyCard
          survey={item}
          globalMuted={globalMuted}
          toggleMute={toggleMute}
          badgeText={
            item.usuario_id === item.current_user_id
              ? "📝 Creada por mí"
              : "👥 Asignada"
          }
          isVisible={true}
          onPress={() =>
            (navigation as any).navigate("VoteScreen", {
              surveyId: item.id,
              surveyType: item.tipo,
              title: item.title,
              description: item.description,
              questions: item.questions,
              media_url: item.media_url,
              media_urls: item.media_urls,
              media_type: item.media_type,
            })
          }
        >
          {item.segundos_restantes !== undefined && (
            <CountdownTimer segundosIniciales={item.segundos_restantes} />
          )}
        </SurveyCard>
      )}
      ListEmptyComponent={
        <Text style={{ textAlign: "center", marginTop: 20 }}>
          No tienes encuestas personales
        </Text>
      }
    />
  );
}
