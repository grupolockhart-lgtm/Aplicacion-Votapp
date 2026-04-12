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
  apellido?: string;
  correo: string;
  ciudad?: string;
  profesion?: string;
  alias?: string;
  avatar_url?: string;
  bio?: string;
  nivel?: number;
  puntos?: number;
  racha_dias?: number;
};

export default function FriendProfileScreen({ route }: FriendProfileProps) {
  const { friendId } = route.params;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await fetch(
        `https://aplicacion-votapp-test.onrender.com/api/usuarios/${friendId}`
      );
      const data = await res.json();
      setUser(data);
    } catch (err) {
      console.error("Error al cargar perfil:", err);
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async () => {
    try {
      await fetch(
        `https://aplicacion-votapp-test.onrender.com/api/friends/request`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: 1, friend_id: user?.id }),
        }
      );
      alert("Solicitud enviada");
    } catch (err) {
      console.error("Error al enviar solicitud:", err);
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
      <Text style={styles.title}>
        Perfil de {user.nombre} {user.apellido}
      </Text>
      {user.alias && <Text style={styles.info}>Alias: {user.alias}</Text>}
      <Text style={styles.info}>ID: {user.id}</Text>
      <Text style={styles.info}>Correo: {user.correo}</Text>
      {user.ciudad && <Text style={styles.info}>Ciudad: {user.ciudad}</Text>}
      {user.profesion && (
        <Text style={styles.info}>Profesión: {user.profesion}</Text>
      )}
      {user.bio && <Text style={styles.info}>Bio: {user.bio}</Text>}
      {user.nivel && <Text style={styles.info}>Nivel: {user.nivel}</Text>}
      {user.puntos !== undefined && (
        <Text style={styles.info}>Puntos: {user.puntos}</Text>
      )}
      {user.racha_dias !== undefined && (
        <Text style={styles.info}>Racha de días: {user.racha_dias}</Text>
      )}

      <TouchableOpacity
        style={[styles.button, styles.request]}
        onPress={sendFriendRequest}
      >
        <Text style={styles.buttonText}>Enviar solicitud de amistad</Text>
      </TouchableOpacity>
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