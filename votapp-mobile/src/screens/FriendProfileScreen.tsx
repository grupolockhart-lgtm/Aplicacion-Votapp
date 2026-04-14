// src/screens/FriendProfileScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";

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
  status?: string; // estado de amistad
};

export default function FriendProfileScreen({ route }: FriendProfileProps) {
  const { friendId } = route.params;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await fetch(
        `https://aplicacion-votapp-test.onrender.com/api/usuarios/${friendId}?current_user_id=1`
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

  const sendFriendRequest = async () => {
    try {
      await fetch(
        `https://aplicacion-votapp-test.onrender.com/api/friends/request?user_id=1&friend_id=${user?.id}`,
        { method: "POST" }
      );
      alert("Solicitud enviada");
    } catch (err) {
      console.error("Error al enviar solicitud:", err);
    }
  };

  const acceptFriendRequest = async (friendshipId: number) => {
    try {
      await fetch(
        `https://aplicacion-votapp-test.onrender.com/api/friends/${friendshipId}?action=accepted`,
        { method: "PUT" }
      );
      alert("Solicitud aceptada");
      fetchUser(); // refrescar estado
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
      fetchUser(); // refrescar estado
    } catch (err) {
      console.error("Error al rechazar solicitud:", err);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [friendId]);

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

      {/* Mostrar botón solo si NO son amigos todavía */}
      {user.status !== "accepted" && (
        <TouchableOpacity
          style={[styles.button, styles.request]}
          onPress={sendFriendRequest}
        >
          <Text style={styles.buttonText}>Enviar solicitud de amistad</Text>
        </TouchableOpacity>
      )}

      {/* Ejemplo: botones para aceptar/rechazar si la solicitud está pendiente */}
      {user.status === "pending" && (
        <View style={{ flexDirection: "row", justifyContent: "center" }}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#2196F3", marginRight: 8 }]}
            onPress={() => acceptFriendRequest(user.id)}
          >
            <Text style={styles.buttonText}>Aceptar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#F44336" }]}
            onPress={() => rejectFriendRequest(user.id)}
          >
            <Text style={styles.buttonText}>Rechazar</Text>
          </TouchableOpacity>
        </View>
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
  },
  request: { backgroundColor: "#4CAF50" },
  buttonText: { color: "#fff", fontWeight: "bold", textAlign: "center" },
});

