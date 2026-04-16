// src/screens/NotificationsScreen.tsx
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Button, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function NotificationsScreen() {
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTokenAndUser = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("userToken");
        if (!storedToken) {
          setLoading(false);
          return;
        }
        setToken(storedToken);

        const res = await fetch("https://aplicacion-votapp-test.onrender.com/api/users/me", {
          headers: { Authorization: `Bearer ${storedToken}` },
        });

        if (!res.ok) throw new Error("Token inválido o expirado");
        const data = await res.json();
        setUserId(data.user?.id || data.id);
      } catch (err) {
        console.error("Error obteniendo usuario:", err);
      } finally {
        setLoading(false);
      }
    };

    loadTokenAndUser();
  }, []);

  const fetchNotifications = async () => {
    if (!userId || !token) return;
    try {
      const res = await fetch(
        `https://aplicacion-votapp-test.onrender.com/api/notifications?user_id=${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      console.error("Error obteniendo notificaciones:", err);
    }
  };

  const fetchUnreadCount = async () => {
    if (!userId || !token) return;
    try {
      const res = await fetch(
        `https://aplicacion-votapp-test.onrender.com/api/notifications/unread_count?user_id=${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setUnreadCount(data.unread_count);
    } catch (err) {
      console.error("Error obteniendo contador:", err);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [userId]);

  const acceptFriendRequest = async (friendshipId: number, notificationId: number) => {
    if (!token) return;
    try {
      await fetch(
        `https://aplicacion-votapp-test.onrender.com/api/friends/${friendshipId}?action=accepted`,
        { method: "PUT", headers: { Authorization: `Bearer ${token}` } }
      );
      fetchNotifications();
      fetchUnreadCount();
    } catch (err) {
      console.error("Error aceptando solicitud:", err);
    }
  };

  const rejectFriendRequest = async (friendshipId: number, notificationId: number) => {
    if (!token) return;
    try {
      await fetch(
        `https://aplicacion-votapp-test.onrender.com/api/friends/${friendshipId}?action=rejected`,
        { method: "PUT", headers: { Authorization: `Bearer ${token}` } }
      );
      fetchNotifications();
      fetchUnreadCount();
    } catch (err) {
      console.error("Error rechazando solicitud:", err);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="blue" />
        <Text>Cargando usuario...</Text>
      </View>
    );
  }

  if (!userId) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Error: no se pudo obtener el usuario</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontWeight: "bold", fontSize: 18 }}>
        Notificaciones 🔔 ({unreadCount} sin leer)
      </Text>
      <Button title="Marcar todas como leídas" onPress={fetchUnreadCount} />

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={{ marginVertical: 8 }}>
            <Text>{item.message}</Text>
            <Text>Estado: {item.status}</Text>

            {item.type === "friend_request" && item.status === "unread" && (
              <View style={{ flexDirection: "row", marginTop: 4 }}>
                <Button
                  title="Aceptar solicitud"
                  onPress={() => acceptFriendRequest(item.related_id, item.id)}
                />
                <View style={{ width: 8 }} />
                <Button
                  title="Rechazar solicitud"
                  color="red"
                  onPress={() => rejectFriendRequest(item.related_id, item.id)}
                />
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
}


