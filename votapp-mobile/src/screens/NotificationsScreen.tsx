// src/screens/NotificationsScreen.tsx
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Button } from "react-native";

export default function NotificationsScreen({ userId = 1 }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = () => {
    fetch(`https://aplicacion-votapp-test.onrender.com/api/notifications?user_id=${userId}`)
      .then((res) => res.json())
      .then((data) => setNotifications(data))
      .catch(console.error);
  };

  const fetchUnreadCount = () => {
    fetch(`https://aplicacion-votapp-test.onrender.com/api/notifications/unread_count?user_id=${userId}`)
      .then((res) => res.json())
      .then((data) => setUnreadCount(data.unread_count))
      .catch(console.error);
  };

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [userId]);

  const markAsRead = (id: number) => {
    fetch(`https://aplicacion-votapp-test.onrender.com/api/notifications/${id}/read`, {
      method: "PUT",
    }).then(() => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: "read" } : n))
      );
      fetchUnreadCount();
    });
  };

  const markAllAsRead = () => {
    fetch(`https://aplicacion-votapp-test.onrender.com/api/notifications/read_all?user_id=${userId}`, {
      method: "PUT",
    }).then(() => {
      setNotifications((prev) => prev.map((n) => ({ ...n, status: "read" })));
      setUnreadCount(0);
    });
  };

  const acceptFriendRequest = (friendshipId: number, notificationId: number) => {
    fetch(`https://aplicacion-votapp-test.onrender.com/api/friends/${friendshipId}?action=accepted`, {
      method: "PUT",
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Solicitud aceptada:", data);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId
              ? { ...n, status: "read", message: data.notification?.message || n.message }
              : n
          )
        );
        fetchUnreadCount();
      })
      .catch(console.error);
  };

  const rejectFriendRequest = (friendshipId: number, notificationId: number) => {
    fetch(`https://aplicacion-votapp-test.onrender.com/api/friends/${friendshipId}?action=rejected`, {
      method: "PUT",
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Solicitud rechazada:", data);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId
              ? { ...n, status: "read", message: data.notification?.message || n.message }
              : n
          )
        );
        fetchUnreadCount();
      })
      .catch(console.error);
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontWeight: "bold", fontSize: 18 }}>
        Notificaciones 🔔 ({unreadCount} sin leer)
      </Text>
      <Button title="Marcar todas como leídas" onPress={markAllAsRead} />

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={{ marginVertical: 8 }}>
            <Text>{item.message}</Text>
            <Text>Estado: {item.status}</Text>

            {item.status === "unread" && (
              <Button title="Marcar como leída" onPress={() => markAsRead(item.id)} />
            )}

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