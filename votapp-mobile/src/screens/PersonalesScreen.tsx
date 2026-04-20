// src/screens/PersonalesScreen.tsx
import React, { useState, useContext } from "react";
import {
  FlatList,
  Text,
  Button,
  Modal,
  View,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CountdownTimer from "@/components/CountdownTimer";
import SurveyCard from "@/components/SurveyCard";
import type { Survey } from "@/screens/SurveysScreen";
import { FriendsContext } from "@/context/FriendsContext";

// -------------------
// Props
// -------------------
interface PersonalesProps {
  surveys: Survey[];
  globalMuted: boolean;
  toggleMute: () => void;
  refreshSurveys: () => void;
}

// -------------------
// Componente principal
// -------------------
export default function PersonalesScreen({
  surveys,
  globalMuted,
  toggleMute,
  refreshSurveys,
}: PersonalesProps) {
  const navigation = useNavigation();
  const { friends } = useContext(FriendsContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSurveyId, setSelectedSurveyId] = useState<number | null>(null);

  // -------------------
  // Asignar encuesta simple a un amigo
  // -------------------
  const handleAssign = async (surveyId: number, friendId: number) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const API_URL = "http://localhost:8000"; // 👈 ajusta según tu backend
      await fetch(`${API_URL}/surveys/simple/${surveyId}/assign/${friendId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setModalVisible(false);
      await refreshSurveys();
    } catch (error) {
      console.error("Error asignando encuesta:", error);
    }
  };

  return (
    <>
      <FlatList
        // 👇 Ordenamos por fecha de creación (más recientes primero)
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

            {/* 👇 Solo las encuestas propias pueden asignarse */}
            {item.usuario_id === item.current_user_id && (
              <Button
                title="Asignar a amigo"
                onPress={() => {
                  setSelectedSurveyId(item.id);
                  setModalVisible(true);
                }}
              />
            )}
          </SurveyCard>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 20 }}>
            No tienes encuestas personales
          </Text>
        }
      />

      {/* -------------------
          Modal de selección de amigos
          ------------------- */}
      <Modal visible={modalVisible} animationType="slide">
        <View style={{ flex: 1, padding: 20 }}>
          <Text style={{ fontSize: 18, marginBottom: 10 }}>
            Selecciona un amigo
          </Text>
          <FlatList
            data={friends}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={{
                  padding: 12,
                  borderBottomWidth: 1,
                  borderColor: "#ccc",
                }}
                onPress={() =>
                  selectedSurveyId && handleAssign(selectedSurveyId, item.id)
                }
              >
                <Text style={{ fontSize: 16 }}>
                  {item.alias || item.nombre}
                </Text>
              </TouchableOpacity>
            )}
          />
          <Button title="Cerrar" onPress={() => setModalVisible(false)} />
        </View>
      </Modal>
    </>
  );
}


