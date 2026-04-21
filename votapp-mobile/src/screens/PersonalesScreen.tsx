// src/screens/PersonalesScreen.tsx
import React, { useState, useContext } from "react";
import {
  FlatList,
  Text,
  Button,
  Modal,
  View,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CountdownTimer from "@/components/CountdownTimer";
import SurveyCard from "@/components/SurveyCard";
import type { Survey } from "@/screens/SurveysScreen";
import { FriendsContext } from "@/context/FriendsContext";

interface PersonalesProps {
  surveys: Survey[];
  globalMuted: boolean;
  toggleMute: () => void;
  refreshSurveys: () => void;
}

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
  const [assigning, setAssigning] = useState(false);

  // 👇 Log para depuración
  console.log("Amigos en contexto (PersonalesScreen):", friends);

  const handleAssign = async (surveyId: number, friendId: number) => {
    try {
      setAssigning(true);
      const token = await AsyncStorage.getItem("userToken");
      const API_URL = "http://localhost:8000"; // ajusta según tu backend
      const res = await fetch(`${API_URL}/surveys/simple/${surveyId}/assign/${friendId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        Alert.alert("Éxito", "Encuesta asignada correctamente");
      } else {
        Alert.alert("Error", "No se pudo asignar la encuesta");
      }

      setModalVisible(false);
      await refreshSurveys();
    } catch (error) {
      console.error("Error asignando encuesta:", error);
      Alert.alert("Error", "Ocurrió un problema al asignar la encuesta");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <>
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

      {/* Modal de selección de amigos */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}   // 👈 importante
      >
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ backgroundColor: "#fff", padding: 20, borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
            <Text style={{ fontSize: 18, marginBottom: 10 }}>
              Selecciona un amigo
            </Text>

            {assigning ? (
              <View style={{ justifyContent: "center", alignItems: "center", paddingVertical: 20 }}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={{ marginTop: 10 }}>Asignando encuesta...</Text>
              </View>
            ) : (
              <FlatList
                data={friends}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      padding: 12,
                      borderBottomWidth: 1,
                      borderColor: "#ccc",
                    }}
                    onPress={() =>
                      selectedSurveyId && handleAssign(selectedSurveyId, item.friend_id)
                    }
                  >
                    {item.avatar_url && (
                      <Image
                        source={{ uri: item.avatar_url }}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          marginRight: 10,
                        }}
                      />
                    )}
                    <Text style={{ fontSize: 16 }}>
                      {item.alias || item.nombre || item.correo}
                    </Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={{ textAlign: "center", marginTop: 20 }}>
                    No tienes amigos disponibles
                  </Text>
                }
              />
            )}

            <Button
              title="Cerrar"
              onPress={() => !assigning && setModalVisible(false)}
              disabled={assigning}
            />
          </View>
        </View>
      </Modal>

    </>
  );
}


