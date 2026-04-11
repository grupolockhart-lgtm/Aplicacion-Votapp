

// src/screens/NotificationsScreen.tsx
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Button } from "react-native";

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch("https://aplicacion-votapp-test.onrender.com/api/notifications?user_id=1")
      .then((res) => res.json())
      .then((data) => setNotifications(data));

    fetch("https://aplicacion-votapp-test.onrender.com/api/notifications/unread_count?user_id=1")
      .then((res) => res.json())
      .then((data) => setUnreadCount(data.unread_count));
  }, []);

  const markAsRead = (id: number) => {
    fetch(`https://aplicacion-votapp-test.onrender.com/api/notifications/${id}/read`, {
      method: "PUT",
    }).then(() => {
      // refrescar después de marcar como leída
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: "read" } : n))
      );
      setUnreadCount((prev) => prev - 1);
    });
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontWeight: "bold", fontSize: 18 }}>
        Notificaciones 🔔 ({unreadCount} sin leer)
      </Text>
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
          </View>
        )}
      />
    </View>
  );
}
