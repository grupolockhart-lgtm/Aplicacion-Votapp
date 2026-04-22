// src/screens/PersonalesScreen.tsx
import React, { useState, useContext, useEffect } from "react";
import {
  FlatList,
  Text,
  Button,
  Modal,
  View,
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
import { API_URL } from "../config/api";

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

  const [assignedFriendsList, setAssignedFriendsList] = useState<any[]>([]);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        if (!token) return;

        const res = await fetch(`${API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          console.error("Error al obtener perfil:", res.status);
          return;
        }

        const profile = await res.json();
        console.log("Perfil recibido:", profile);

        const idValue = profile.user?.id;
        const parsedId = Number(idValue);

        if (isNaN(parsedId)) {
          console.error("❌ userId no válido:", idValue);
        } else {
          await AsyncStorage.setItem("userId", String(parsedId));
          setUserId(parsedId);
          console.log("✅ userId cargado:", parsedId);
        }
      } catch (err) {
        console.error("❌ Error al obtener userId:", err);
      }
    };

    fetchUserId();
  }, []);

  const handleAssign = async (surveyId: number, friendId: number) => {
    try {
      setAssigning(true);
      const token = await AsyncStorage.getItem("userToken");
      const storedUserId = await AsyncStorage.getItem("userId");
      const url = `${API_URL}/api/surveys/simple/${surveyId}/assign/${friendId}`;

      const res = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ asignado_por: Number(storedUserId) }),
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
          console.log("Comparando:", {
            usuario_id: item.usuario_id,
            userId,
            asignado_a: item.asignado_a,
          });

          const assignedFriends = friends.filter(f =>
            Array.isArray(item.asignado_a)
              ? item.asignado_a.includes(f.friend_id)
              : f.friend_id === item.asignado_a
          );

          let badgeText = "";
          if (userId !== null && item.usuario_id === userId) {
            badgeText = "📝 Creada por mí";
          } else if (
            userId !== null &&
            (Array.isArray(item.asignado_a)
              ? item.asignado_a.includes(userId)
              : item.asignado_a === userId)
          ) {
            badgeText = "👤 Asignada a mí";
          } else if (item.asignado_por) {
            badgeText = `➡️ Asignada por usuario ${item.asignado_por}`;
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
                console.log("Friends en contexto:", friends);
                console.log("Survey seleccionada:", item.id);
                setSelectedSurveyId(item.id); // 👈 ahora siempre se setea
                setAssignedFriendsList(assignedFriends);
                setModalVisible(true);
              }}
            >
              {item.segundos_restantes !== undefined && (
                <CountdownTimer segundosIniciales={item.segundos_restantes} />
              )}

              {userId !== null && item.usuario_id === userId && (
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

            {/* 👇 Mostrar quién asignó la encuesta */}
            {(() => {
              console.log("selectedSurveyId en modal:", selectedSurveyId);
              const asignadorId = surveys.find(s => s.id === selectedSurveyId)?.asignado_por;
              console.log("AsignadorId en modal:", asignadorId);
              const asignador = friends.find(f => Number(f.friend_id) === Number(asignadorId));
              console.log("Asignador encontrado:", asignador);
              return (
                <Text style={{ fontSize: 14, marginBottom: 10 }}>
                  Asignada por: {asignador
                    ? (asignador.alias || asignador.nombre || asignador.correo)
                    : "Desconocido"}
                </Text>
              );
            })()}

            {assigning ? (
              <View style={{ justifyContent: "center", alignItems: "center", paddingVertical: 20 }}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={{ marginTop: 10 }}>Asignando encuesta...</Text>
              </View>
            ) : (
              <FlatList
                data={assignedFriendsList}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <View style={{ flexDirection: "row", alignItems: "center", padding: 12, borderBottomWidth: 1, borderColor: "#ccc" }}>
                    {item.avatar_url && (
                      <Image
                        source={{ uri: item.avatar_url }}
                        style={{ width: 32, height: 32, borderRadius: 16, marginRight: 10 }}
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

