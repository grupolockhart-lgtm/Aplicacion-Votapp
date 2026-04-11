
// src/screens/FriendProfileScreen.tsx
import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";

type FriendProfileProps = {
  route: { params: { friendId: number } };
};

type User = {
  id: number;
  username: string;
  email: string;
  bio?: string;
};

export default function FriendProfileScreen({ route }: FriendProfileProps) {
  const { friendId } = route.params;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await fetch(
        `https://aplicacion-votapp-test.onrender.com/api/users/${friendId}`
      );
      const data = await res.json();
      setUser(data);
    } catch (err) {
      console.error("Error al cargar perfil:", err);
    } finally {
      setLoading(false);
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
      <Text style={styles.title}>Perfil de {user.username}</Text>
      <Text style={styles.info}>ID: {user.id}</Text>
      <Text style={styles.info}>Email: {user.email}</Text>
      {user.bio && <Text style={styles.info}>Bio: {user.bio}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f5f5f5" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 12 },
  info: { fontSize: 16, marginBottom: 8 },
});