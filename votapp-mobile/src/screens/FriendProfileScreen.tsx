// src/screens/FriendProfileScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type FriendProfileProps = {
  route: { params: { friendId: number } };
};

type User = {
  id: number;
  nombre: string;
  correo: string;
  alias?: string;
  avatar_url?: string;
  bio?: string;
  nivel?: number;
  puntos?: number;
  racha_dias?: number;
  ultima_participacion?: string;
  status?: string | null;   // 👈 ahora acepta null
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
      console.log("Respuesta backend:", data);
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
      alert("Solicitud enviada");
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
      alert("Solicitud aceptada");
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
      alert("Solicitud rechazada");
      fetchUser();
    } catch (err) {
      console.error("Error al rechazar solicitud:", err);
    }
  };

  const deleteFriendship = async (friendshipId: number) => {
    Alert.alert(
      "Confirmar",
      "¿Seguro que quieres eliminar esta amistad?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await fetch(
                `https://aplicacion-votapp-test.onrender.com/api/friends/${friendshipId}`,
                { method: "DELETE" }
              );
              alert("Amistad eliminada");
              setUser((prev) =>
                prev ? { ...prev, status: null, friendship_id: undefined } : prev
              );
            } catch (err) {
              console.error("Error al eliminar amistad:", err);
              alert("Error eliminando amistad");
            }
          },
        },
      ]
    );
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
      {user.avatar_url && (
        <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
      )}
      <Text style={styles.title}>Perfil de {user.nombre}</Text>
      {user.alias && <Text style={styles.info}>Alias: {user.alias}</Text>}
      <Text style={styles.info}>ID: {user.id}</Text>
      <Text style={styles.info}>Correo: {user.correo}</Text>
      {user.bio && <Text style={styles.info}>Bio: {user.bio}</Text>}
      {user.nivel && <Text style={styles.info}>Nivel: {user.nivel}</Text>}
      {user.puntos !== undefined && (
        <Text style={styles.info}>Puntos: {user.puntos}</Text>
      )}
      {user.racha_dias !== undefined && (
        <Text style={styles.info}>Racha de días: {user.racha_dias}</Text>
      )}
      {user.ultima_participacion && (
        <Text style={styles.info}>
          Última participación: {user.ultima_participacion}
        </Text>
      )}

      {/* Botón de enviar solicitud */}
      {(!user.status || user.status === "rejected") && (
        <TouchableOpacity
          style={[styles.button, styles.request]}
          onPress={sendFriendRequest}
          disabled={sending}
        >
          {sending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {user.status === "rejected"
                ? "Reenviar solicitud de amistad"
                : "Enviar solicitud de amistad"}
            </Text>
          )}
        </TouchableOpacity>
      )}

      {/* Texto informativo si está pendiente */}
      {user.status === "pending" && (
        <View style={{ marginTop: 16, alignItems: "center" }}>
          <Text style={{ fontSize: 16, fontWeight: "bold", color: "#555" }}>
            Solicitud en espera
          </Text>
        </View>
      )}

      {/* Botones de aceptar/rechazar */}
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

      {/* Botón de eliminar amistad */}
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
  container: { flex: 1, padding: 16, backgroundColor: "#f5f5f5" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    alignSelf: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  info: { fontSize: 16, marginBottom: 8, textAlign: "center" },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 6,
    marginTop: 16,
    alignItems: "center",
  },
  request: { backgroundColor: "#4CAF50" },   // verde para enviar solicitud
  buttonText: { color: "#fff", fontWeight: "bold", textAlign: "center" },
  deleteBtn: { backgroundColor: "#F44336" }, // rojo para eliminar amistad
  acceptBtn: { backgroundColor: "#2196F3" }, // azul para aceptar
  rejectBtn: { backgroundColor: "#FF9800" }, // naranja para rechazar
});

