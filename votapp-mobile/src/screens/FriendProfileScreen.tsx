// src/screens/FriendProfileScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PublicProfileCard from "../components/PublicProfileCard";
import GamificacionCard from "../components/GamificacionCard";
import ProfileTabs from "./Profile/ProfileTabs";

type FriendProfileProps = {
  route: { params: { friendId: number } };
};

type User = {
  id: number;
  nombre: string;
  alias?: string;
  avatar_url?: string;
  bio?: string;
  nivel?: number;
  puntos?: number;
  racha_dias?: number;
  ultima_participacion?: string;
  status?: string | null;
  friendship_id?: number;
};

export default function FriendProfileScreen({ route }: FriendProfileProps) {
  const { friendId } = route.params;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("userToken");
        if (!storedToken) return;

        const res = await fetch("https://aplicacion-votapp-test.onrender.com/api/users/me", {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        const data = await res.json();
        setCurrentUserId(data.user?.id || data.id);
      } catch (err) {
        console.error("Error obteniendo usuario actual:", err);
      }
    };
    loadCurrentUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch(
        `https://aplicacion-votapp-test.onrender.com/api/usuarios/${friendId}?current_user_id=${currentUserId}`
      );
      const data = await res.json();
      setUser(data.usuario ? data.usuario : data);
    } catch (err) {
      console.error("Error al cargar perfil:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserId) {
      fetchUser();
    }
  }, [friendId, currentUserId]);

  const sendFriendRequest = async () => {
    if (!user) return;
    setSending(true);
    try {
      await fetch(
        `https://aplicacion-votapp-test.onrender.com/api/friends/request?user_id=${currentUserId}&friend_id=${user.id}`,
        { method: "POST" }
      );
      Alert.alert("Solicitud enviada");
      setUser((prev) => prev ? { ...prev, status: "pending" } : prev);
    } catch (err) {
      console.error("Error al enviar solicitud:", err);
    } finally {
      setSending(false);
      fetchUser();
    }
  };

  const acceptFriendRequest = async (friendshipId: number) => {
    try {
      await fetch(
        `https://aplicacion-votapp-test.onrender.com/api/friends/${friendshipId}?action=accepted`,
        { method: "PUT" }
      );
      Alert.alert("Solicitud aceptada");
      fetchUser();
    } catch (err) {
      console.error("Error al aceptar solicitud:", err);
    }
  };

  const rejectFriendRequest = async (friendshipId: number) => {
    try {
      await fetch(
        `https://aplicacion-votapp-test.onrender.com/api/friends/${friendshipId}?action=rejected`,
        { method: "PUT" }
      );
      Alert.alert("Solicitud rechazada");
      fetchUser();
    } catch (err) {
      console.error("Error al rechazar solicitud:", err);
    }
  };

  const deleteFriendship = async (friendshipId: number) => {
    Alert.alert("Confirmar", "¿Seguro que quieres eliminar esta amistad?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            const storedToken = await AsyncStorage.getItem("userToken");
            await fetch(
              `https://aplicacion-votapp-test.onrender.com/api/friends/${friendshipId}`,
              {
                method: "DELETE",
                headers: { Authorization: `Bearer ${storedToken}` },
              }
            );
            Alert.alert("Amistad eliminada");
            setUser((prev) =>
              prev ? { ...prev, status: null, friendship_id: undefined } : prev
            );
          } catch (err) {
            console.error("Error al eliminar amistad:", err);
            Alert.alert("Error eliminando amistad");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text>No se pudo cargar el perfil</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Perfil público */}
      <PublicProfileCard
        alias={user.alias}
        bio={user.bio}
        avatarUrl={user.avatar_url}
        onSave={() => {}} // solo visualización
      />

      {/* Gamificación y logros */}
      <GamificacionCard
        nivelProp={user.nivel}
        puntosProp={user.puntos}
        rachaProp={user.racha_dias}
      />


      {/* Tab de encuestas publicadas */}
      <ProfileTabs
        profile={{ public_profile: user }}
        friendMode={true}
        friendId={user.id}
      />

      {/* Acciones de amistad */}
      {(!user.status || user.status === "rejected") && (
        <TouchableOpacity
          style={[styles.button, styles.request]}
          onPress={sendFriendRequest}
          disabled={sending}
        >
          <Text style={styles.buttonText}>
            {user.status === "rejected"
              ? "Reenviar solicitud de amistad"
              : "Enviar solicitud de amistad"}
          </Text>
        </TouchableOpacity>
      )}

      {user.status === "pending" && user.friendship_id && (
        <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 12 }}>
          <TouchableOpacity
            style={[styles.button, styles.acceptBtn]}
            onPress={() => acceptFriendRequest(user.friendship_id!)}
          >
            <Text style={styles.buttonText}>Aceptar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.rejectBtn]}
            onPress={() => rejectFriendRequest(user.friendship_id!)}
          >
            <Text style={styles.buttonText}>Rechazar</Text>
          </TouchableOpacity>
        </View>
      )}

      {user.status === "accepted" && user.friendship_id && (
        <TouchableOpacity
          style={[styles.button, styles.deleteBtn]}
          onPress={() => deleteFriendship(user.friendship_id!)}
        >
          <Text style={styles.buttonText}>Eliminar amistad</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 6,
    marginTop: 16,
    alignItems: "center",
  },
  request: { backgroundColor: "#4CAF50" },
  buttonText: { color: "#fff", fontWeight: "bold", textAlign: "center" },
  deleteBtn: { backgroundColor: "#F44336" },
  acceptBtn: { backgroundColor: "#2196F3" },
  rejectBtn: { backgroundColor: "#FF9800" },
});
