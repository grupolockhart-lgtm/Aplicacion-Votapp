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
  TouchableOpacity,
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

  // ✅ Estado para selección múltiple
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
      const url = `${API_URL}/api/surveys/simple/${surveyId}/assign/${friendId}`;

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
          // ✅ Resolver creador y asignador desde friends
          const creatorName = item.usuario_alias || `ID ${item.usuario_id}`;
          const creatorAvatar = item.usuario_avatar_url;
          const assignerName = item.asignador_alias || `ID ${item.asignado_por}`;
          const assignerAvatar = item.asignador_avatar_url;


          return (
            <SurveyCard
              survey={item}
              globalMuted={globalMuted}
              toggleMute={toggleMute}
              badgeText={""} // 👈 vacío para no duplicar info
              isVisible={true}
              onPress={() => {
                setSelectedSurveyId(item.id);
                refreshFriends();
                setModalVisible(true);
              }}
            >
              {item.segundos_restantes !== undefined && (
                <CountdownTimer segundosIniciales={item.segundos_restantes} />
              )}

              {/* ✅ Mostrar creador y asignador */}
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                {creatorAvatar && (
                  <Image
                    source={{ uri: creatorAvatar }}
                    style={{ width: 28, height: 28, borderRadius: 14, marginRight: 6 }}
                  />
                )}
                {item.usuario_id === item.asignado_por ? (
                  <Text style={{ fontSize: 14 }}>Creada y asignada por {creatorName}</Text>
                ) : (
                  <>
                    <Text style={{ fontSize: 14 }}>Creada por {creatorName}</Text>
                    {assignerAvatar && (
                      <Image
                        source={{ uri: assignerAvatar }}
                        style={{ width: 28, height: 28, borderRadius: 14, marginLeft: 12, marginRight: 6 }}
                      />
                    )}
                    <Text style={{ fontSize: 14 }}>Asignada por {assignerName}</Text>
                  </>
                )}
              </View>


              {/* ✅ Botón único universal */}
              <Button
                title="Asignar a amigos"
                onPress={() => {
                  setSelectedSurveyId(item.id);
                  refreshFriends();
                  setModalVisible(true);
                }}
              />
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
                <View style={{ flexDirection: "row", alignItems: "center", padding: 12 }}>
                  <Image source={{ uri: item.avatar_url }} style={{ width: 32, height: 32, borderRadius: 16, marginRight: 10 }} />
                  <Text style={{ flex: 1 }}>{item.alias || item.nombre || item.correo}</Text>
                  <Text style={{ color: "green" }}>✔ Ya asignado</Text>
                </View>
              )}
            />

            {/* Sección de selección múltiple */}
            <Text style={{ fontSize: 16, marginVertical: 10 }}>Selecciona amigos para asignar</Text>
            <FlatList
              data={friends.filter(f =>
                !surveys.find(s => s.id === selectedSurveyId)?.asignado_a?.includes(f.friend_id)
              )}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => {
                const isSelected = selectedFriends.includes(item.friend_id);
                return (
                  <TouchableOpacity
                    style={{ flexDirection: "row", alignItems: "center", padding: 12 }}
                    onPress={() => {
                      if (isSelected) {
                        setSelectedFriends(selectedFriends.filter(id => id !== item.friend_id));
                      } else {
                        setSelectedFriends([...selectedFriends, item.friend_id]);
                      }
                    }}
                  >
                    <Image source={{ uri: item.avatar_url }} style={{ width: 32, height: 32, borderRadius: 16, marginRight: 10 }} />
                    <Text style={{ flex: 1 }}>{item.alias || item.nombre || item.correo}</Text>
                    <Text>{isSelected ? "✅" : "⬜"}</Text>
                  </TouchableOpacity>
                );
              }}
            />

            {/* Botón para asignar en lote */}
            <Button
              title="Asignar seleccionados"
              onPress={handleAssignMultiple}
              disabled={assigning || selectedFriends.length === 0}
            />

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

