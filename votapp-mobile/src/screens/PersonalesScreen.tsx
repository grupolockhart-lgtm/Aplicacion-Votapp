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
  const { friends, refreshFriends } = useContext(FriendsContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSurveyId, setSelectedSurveyId] = useState<number | null>(null);
  const [assigning, setAssigning] = useState(false);

  // Nuevo: lista de amigos asignados para mostrar en modal
  const [assignedFriendsList, setAssignedFriendsList] = useState<any[]>([]);

  const handleAssign = async (surveyId: number, friendId: number) => {
    try {
      setAssigning(true);
      const token = await AsyncStorage.getItem("userToken");
      const API_URL = "https://aplicacion-votapp-test.onrender.com";

      const url = `${API_URL}/api/surveys/simple/${surveyId}/assign/${friendId}`;
      console.log("URL usada:", url);
      console.log("Token:", token);

      const res = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        Alert.alert("Éxito", "Encuesta asignada correctamente");
      } else {
        const text = await res.text();
        console.error("Respuesta backend:", text);
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
        renderItem={({ item }) => {
          // Encuentra amigos asignados (si asignado_a es array)
          const assignedFriends = friends.filter(f =>
            Array.isArray(item.asignado_a)
              ? item.asignado_a.includes(f.friend_id)
              : f.friend_id === item.asignado_a
          );

          // Lógica del badge resumido
          let badgeText = "";
          if (item.usuario_id === item.current_user_id) {
            badgeText = "📝 Creada por mí";
          } else if (
            Array.isArray(item.asignado_a)
              ? (item.current_user_id !== undefined && item.asignado_a.includes(item.current_user_id))
              : item.asignado_a === item.current_user_id
          ) {
            badgeText = "👤 Asignada a mí";
          } else if (assignedFriends.length > 0) {
            badgeText = `👥 Asignada a grupo (${assignedFriends.length})`;
          } else {
            badgeText = "👥 Asignada";
          }

          return (
            <SurveyCard
              survey={item}
              globalMuted={globalMuted}
              toggleMute={toggleMute}
              badgeText={badgeText}
              isVisible={true}
              onPress={() => {
                // Al tocar la tarjeta, abre modal con detalle de asignados
                setAssignedFriendsList(assignedFriends);
                setModalVisible(true);
              }}
            >
              {item.segundos_restantes !== undefined && (
                <CountdownTimer segundosIniciales={item.segundos_restantes} />
              )}

              {item.usuario_id === item.current_user_id && (
                <Button
                  title="Asignar a amigo"
                  onPress={() => {
                    setSelectedSurveyId(item.id);
                    refreshFriends();
                    setModalVisible(true);
                  }}
                />
              )}
            </SurveyCard>
          );
        }}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 20 }}>
            No tienes encuestas personales
          </Text>
        }
      />

      {/* Modal de detalle de amigos asignados */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              padding: 20,
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
            }}
          >
            <Text style={{ fontSize: 18, marginBottom: 10 }}>
              Amigos asignados
            </Text>

            {assigning ? (
              <View
                style={{
                  justifyContent: "center",
                  alignItems: "center",
                  paddingVertical: 20,
                }}
              >
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={{ marginTop: 10 }}>Asignando encuesta...</Text>
              </View>
            ) : (
              <FlatList
                data={assignedFriendsList}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      padding: 12,
                      borderBottomWidth: 1,
                      borderColor: "#ccc",
                    }}
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
                  </View>
                )}
                ListEmptyComponent={
                  <Text style={{ textAlign: "center", marginTop: 20 }}>
                    No hay amigos asignados
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



