// src/screens/FriendsScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FontAwesome } from "@expo/vector-icons";  // 👈 Expo ya trae íconos integrados

type Friend = {
  id: number;               // id de la relación
  friend_id?: number;       // id del amigo (cuando aceptado)
  otro_usuario_id?: number; // id del usuario solicitante en pendientes
  status: string;
  nombre?: string;
  correo?: string;
  alias?: string;
  avatar_url?: string;
  bio?: string;
};


type Usuario = {
  id: number;
  nombre?: string;
  correo: string;
  alias?: string;
  avatar_url?: string;
  bio?: string;
};

export default function FriendsScreen() {
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]); // 👈 solicitudes pendientes
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

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

  const fetchFriends = async () => {
    if (!userId || !token) return;
    try {
      const res = await fetch(
        `https://aplicacion-votapp-test.onrender.com/api/friends?user_id=${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setFriends(data);
    } catch (err) {
      console.error("Error al cargar amigos:", err);
    }
  };

  const fetchPendingRequests = async () => {
    if (!userId || !token) return;
    try {
      const res = await fetch(
        `https://aplicacion-votapp-test.onrender.com/api/friends/pending?current_user_id=${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setPendingRequests(data);
    } catch (err) {
      console.error("Error al cargar solicitudes pendientes:", err);
    }
  };

  const updateFriendStatus = async (friendshipId: number, action: string) => {
    if (!token) return;
    try {
      await fetch(
        `https://aplicacion-votapp-test.onrender.com/api/friends/${friendshipId}?action=${action}`,
        { method: "PUT", headers: { Authorization: `Bearer ${token}` } }
      );
      // refrescar ambas listas
      fetchFriends();
      fetchPendingRequests();
    } catch (err) {
      console.error("Error al actualizar estado:", err);
    }
  };

  const searchUsers = async () => {
    if (!userId || !token) return;
    try {
      const res = await fetch(
        `https://aplicacion-votapp-test.onrender.com/api/friends/search?query=${query}&current_user_id=${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.detail) {
        Alert.alert("Error de búsqueda", data.detail);
        setSearchResults([]);
      } else {
        setSearchResults(data.results || []);
      }
    } catch (err) {
      console.error("Error al buscar usuarios:", err);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchFriends();
      fetchPendingRequests();
    }
  }, [userId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="blue" />
        <Text>Cargando usuario...</Text>
      </View>
    );
  }

  if (!userId) {
    return (
      <View style={styles.center}>
        <Text>Error: no se pudo obtener el usuario</Text>
      </View>
    );
  }

const renderFriendItem = ({ item }: { item: Friend }) => (
  <View style={styles.friendCard}>
    <Image
      source={{ uri: item.avatar_url || "https://via.placeholder.com/60" }}
      style={styles.friendAvatar}
    />
    <View style={styles.friendInfo}>
      <Text style={styles.friendName}>{item.alias || item.nombre}</Text>
      <Text style={styles.friendAlias}>{item.correo}</Text>
      {item.status === "pending" && (
        <Text style={styles.friendStatus}>Solicitud pendiente</Text>
      )}
    </View>

    {item.status === "pending" ? (
      <View style={styles.friendActionsColumn}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.acceptBtn]}
          onPress={() => updateFriendStatus(item.id, "accepted")}
        >
          <FontAwesome name="check" size={16} color="#fff" />
          <Text style={styles.actionText}>Aceptar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.rejectBtn]}
          onPress={() => updateFriendStatus(item.id, "rejected")}
        >
          <FontAwesome name="times" size={16} color="#fff" />
          <Text style={styles.actionText}>Rechazar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.profileBtn]}
          onPress={() =>
            navigation.navigate("FriendProfileScreen", { friendId: item.friend_id })
          }
        >
          <FontAwesome name="user" size={16} color="#fff" />
          <Text style={styles.actionText}>Ver perfil</Text>
        </TouchableOpacity>
      </View>
    ) : (
      <View style={styles.friendActions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.profileBtn]}
          onPress={() =>
            navigation.navigate("FriendProfileScreen", { friendId: item.friend_id })
          }
        >
          <FontAwesome name="user" size={16} color="#fff" />
          <Text style={styles.actionText}>Ver perfil</Text>
        </TouchableOpacity>
      </View>
    )}
  </View>
);


  const renderSearchItem = ({ item }: { item: Usuario }) => (
    <View style={styles.friendCard}>
      <Image
        source={{ uri: item.avatar_url || "https://via.placeholder.com/60" }}
        style={styles.friendAvatar}
      />
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.alias || item.nombre}</Text>
        <Text style={styles.friendAlias}>{item.correo}</Text>
      </View>
      <View style={styles.friendActions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.profileBtn]}
          onPress={() => navigation.navigate("FriendProfileScreen", { friendId: item.id })}
        >
          <FontAwesome name="user" size={16} color="#fff" />
          <Text style={styles.actionText}>Ver perfil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Buscador */}
      <TextInput
        style={styles.input}
        placeholder="Buscar por alias o correo"
        value={query}
        onChangeText={setQuery}
      />
      <TouchableOpacity style={[styles.actionBtn, styles.profileBtn]} onPress={searchUsers}>
        <FontAwesome name="search" size={16} color="#fff" />
        <Text style={styles.actionText}>Buscar</Text>
      </TouchableOpacity>

      {/* Resultados de búsqueda */}
      {searchResults.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Resultados de búsqueda</Text>
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderSearchItem}
            ListEmptyComponent={<Text style={styles.empty}>No se encontraron usuarios</Text>}
          />
        </>
      )}

      {/* Solicitudes pendientes */}
      <Text style={styles.sectionTitle}>Solicitudes pendientes</Text>
      <FlatList
        data={pendingRequests}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderFriendItem}
        ListEmptyComponent={<Text style={styles.empty}>No tienes solicitudes pendientes</Text>}
      />

      {/* Lista de amigos */}
      <Text style={styles.sectionTitle}>Amigos</Text>
      <FlatList
        data={friends}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderFriendItem}
        ListEmptyComponent={<Text style={styles.empty}>No tienes amigos todavía</Text>}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f5f5f5" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  input: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 10,
    color: "#333",
  },
  friendCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    marginVertical: 6,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  friendAvatar: { width: 60, height: 60, borderRadius: 30 },
  friendInfo: { flex: 1, marginLeft: 12 },
  friendName: { fontSize: 16, fontWeight: "bold" },
  friendAlias: { fontSize: 14, color: "#777" },
  friendStatus: { fontSize: 12, color: "#f39c12", marginTop: 4 },

  // Para amigos aceptados (horizontal)
  friendActions: { flexDirection: "row" },

  // Para solicitudes pendientes (vertical)
  friendActionsColumn: {
    flexDirection: "column",
    alignItems: "flex-start",
    marginLeft: 6,
  },

  actionBtn: {
    flexDirection: "row", // ícono + texto alineados
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginTop: 6, // separación entre botones cuando están en columna
  },
  acceptBtn: { backgroundColor: "#4CAF50" },   // verde aceptar
  rejectBtn: { backgroundColor: "#F44336" },   // rojo rechazar
  profileBtn: { backgroundColor: "#2196F3" },  // azul ver perfil
  actionText: { color: "#fff", fontWeight: "bold", marginLeft: 4 },
  empty: { textAlign: "center", marginTop: 20, color: "#999" },
});

