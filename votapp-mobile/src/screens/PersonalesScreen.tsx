// src/screens/PersonalesScreen.tsx
import React, { useState, useContext, useEffect } from "react";
import {
  FlatList,
  Text,
  Modal,
  View,
  Image,
  Alert,
  TouchableOpacity,
  StyleSheet,
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
  const [userId, setUserId] = useState<number | null>(null);
  const [selectedFriends, setSelectedFriends] = useState<number[]>([]);

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        if (!token) return;

        const res = await fetch(`${API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) return;

        const profile = await res.json();
        const idValue = profile.user?.id;
        const parsedId = Number(idValue);

        if (!isNaN(parsedId)) {
          await AsyncStorage.setItem("userId", String(parsedId));
          setUserId(parsedId);
        }
      } catch (err) {
        console.error("❌ Error al obtener userId:", err);
      }
    };

    fetchUserId();
  }, []);

  const handleAssign = async (surveyId: number, friendId: number) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const storedUserId = await AsyncStorage.getItem("userId");
      const url = `${API_URL}/surveys/simple/${surveyId}/assign/${friendId}`;

      const res = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ asignado_por: Number(storedUserId) }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Respuesta backend:", text);
        throw new Error("No se pudo asignar la encuesta");
      }
    } catch (error) {
      console.error("Error asignando encuesta:", error);
      throw error;
    }
  };

  const handleAssignMultiple = async () => {
    try {
      setAssigning(true);
      if (!selectedSurveyId) return;

      for (const friendId of selectedFriends) {
        await handleAssign(selectedSurveyId, friendId);
      }

      Alert.alert("Éxito", "Encuesta asignada a los amigos seleccionados");
      setSelectedFriends([]);
      setModalVisible(false);
      await refreshSurveys();
    } catch (error) {
      Alert.alert("Error", "Ocurrió un problema al asignar a varios amigos");
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
          const creatorName = item.usuario_alias || `ID ${item.usuario_id}`;
          const creatorAvatar = item.usuario_avatar_url;
          const assignerName = item.asignador_alias || `ID ${item.asignado_por}`;
          const assignerAvatar = item.asignador_avatar_url;

          return (
            <SurveyCard
              survey={item}
              globalMuted={globalMuted}
              toggleMute={toggleMute}
              badgeText={""}
              isVisible={true}
              onPress={() => {
                navigation.navigate("VoteScreen", {
                  surveyId: item.id,
                  surveyType: item.tipo,
                  title: item.title,
                  description: item.description,
                  questions: item.questions,
                  media_url: item.media_url,
                  media_urls: item.media_urls,
                  media_type: item.media_type,
                });
              }}
            >
              {/* 💬 Comentarios + ⏳ Tiempo restante en la misma fila */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingHorizontal: 0,
                  marginBottom: 0,
                }}
              >
                {/* Comentario */}
                {item.description && (
                  <Text style={{ fontSize: 14, color: "#555", flex: 1 }} numberOfLines={3}>
                    {item.description}
                  </Text>
                )}

                {/* Tiempo restante */}
                {item.segundos_restantes !== undefined && (
                  <CountdownTimer segundosIniciales={item.segundos_restantes} />
                )}
              </View>

              {/* ✅ Mostrar creador y asignador */}
              <View style={[styles.infoRow, { paddingHorizontal: 0, marginBottom: 0 }]}>
                {creatorAvatar && (
                  <Image source={{ uri: creatorAvatar }} style={styles.avatar} />
                )}
                <Text style={styles.infoText}>Creada por {creatorName}</Text>
                {userId !== item.usuario_id && item.asignador_alias && (
                  <>
                    {assignerAvatar && (
                      <Image
                        source={{ uri: assignerAvatar }}
                        style={[styles.avatar, { marginLeft: 12 }]}
                      />
                    )}
                    <Text style={styles.infoText}>Asignada por {assignerName}</Text>
                  </>
                )}
              </View>

              {/* 🎯 Botón moderno */}
              <View style={{ paddingHorizontal: 0, marginTop: 0 }}>
                <TouchableOpacity
                  style={styles.assignButton}
                  onPress={() => {
                    setSelectedSurveyId(item.id);
                    refreshFriends();
                    setModalVisible(true);
                  }}
                >
                  <Text style={styles.assignButtonText}>Asignar a amigos</Text>
                </TouchableOpacity>
              </View>

            </SurveyCard>
          );
        }}


      />
      {/* ✅ Modal solo para asignar */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ backgroundColor: "#fff", padding: 20, borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
            <Text style={{ fontSize: 18, marginBottom: 10 }}>Asignar encuesta</Text>

            {/* Sección de ya asignados */}
            <Text style={{ fontSize: 16, marginVertical: 10 }}>Ya asignados</Text>
            <FlatList
              data={friends.filter(f =>
                surveys.find(s => s.id === selectedSurveyId)?.asignado_a?.includes(f.friend_id)
              )}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.friendRow}>
                  <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
                  <Text style={{ flex: 1 }}>{item.alias || item.nombre || item.correo}</Text>
                  <Text style={{ color: "green" }}>✔ Ya asignado</Text>
                </View>
              )}
            />

            {/* Sección de selección múltiple */}
            <Text style={{ fontSize: 16, marginVertical: 10 }}>Selecciona amigos para asignar</Text>
            <FlatList
              data={friends.filter(f => {
                const survey = surveys.find(s => s.id === selectedSurveyId);
                if (!survey) return false;

                const yaAsignados = survey.asignado_a ?? [];
                const creadorId = survey.usuario_id;

                return (
                  !yaAsignados.includes(f.friend_id) &&
                  f.friend_id !== creadorId &&
                  f.friend_id !== userId
                );
              })}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => {
                const isSelected = selectedFriends.includes(item.friend_id);
                return (
                  <TouchableOpacity
                    style={styles.friendRow}
                    onPress={() => {
                      if (isSelected) {
                        setSelectedFriends(selectedFriends.filter(id => id !== item.friend_id));
                      } else {
                        setSelectedFriends([...selectedFriends, item.friend_id]);
                      }
                    }}
                  >
                    <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
                    <Text style={{ flex: 1 }}>{item.alias || item.nombre || item.correo}</Text>
                    <Text>{isSelected ? "✅" : "⬜"}</Text>
                  </TouchableOpacity>
                );
              }}
            />

            <TouchableOpacity
              style={[styles.assignButton, { opacity: assigning || selectedFriends.length === 0 ? 0.5 : 1 }]}
              onPress={handleAssignMultiple}
              disabled={assigning || selectedFriends.length === 0}
            >
              <Text style={styles.assignButtonText}>Asignar seleccionados</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.assignButton, { backgroundColor: "#6B7280", marginTop: 10 }]}
              onPress={() => !assigning && setModalVisible(false)}
              disabled={assigning}
            >
              <Text style={styles.assignButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 6,
  },
  infoText: {
    fontSize: 13,
    color: "#333",
  },
  assignButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  assignButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
});
