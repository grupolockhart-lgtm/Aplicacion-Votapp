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
} from "react-native";
import { useNavigation } from "@react-navigation/native";

type Friend = {
  id: number;
  friend_id: number;
  status: string;
  nombre?: string;
  correo?: string;
  alias?: string;
  avatar_url?: string;
  bio?: string;
};

type Usuario = {
  id: number;
  nombre: string;
  correo: string;
  alias?: string;
  avatar_url?: string;
  bio?: string;
};

export default function FriendsScreen() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Usuario[]>([]);
  const navigation = useNavigation();

  const fetchFriends = async () => {
    try {
      const res = await fetch(
        "https://aplicacion-votapp-test.onrender.com/api/friends?user_id=1"
      );
      const data = await res.json();
      setFriends(data);
    } catch (err) {
      console.error("Error al cargar amigos:", err);
    }
  };

  const updateFriendStatus = async (friendId: number, action: string) => {
    try {
      await fetch(
        `https://aplicacion-votapp-test.onrender.com/api/friends/${friendId}?action=${action}`,
        { method: "PUT" }
      );
      fetchFriends();
    } catch (err) {
      console.error("Error al actualizar estado:", err);
    }
  };

  const searchUsers = async () => {
    try {
      const res = await fetch(
        `https://aplicacion-votapp-test.onrender.com/api/friends/search?query=${query}`
      );
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (err) {
      console.error("Error al buscar usuarios:", err);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  const renderFriendItem = ({ item }: { item: Friend }) => (
    <View style={styles.card}>
      {item.avatar_url && (
        <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
      )}
      <Text style={styles.title}>
        {item.nombre} {item.alias ? `(${item.alias})` : ""}
      </Text>
      <Text style={styles.subtitle}>{item.correo}</Text>
      <Text style={styles.subtitle}>Estado: {item.status}</Text>

      {item.status === "pending" ? (
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.button, styles.accept]}
            onPress={() => updateFriendStatus(item.id, "accepted")}
          >
            <Text style={styles.buttonText}>Aceptar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.reject]}
            onPress={() => updateFriendStatus(item.id, "rejected")}
          >
            <Text style={styles.buttonText}>Rechazar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.button, styles.profile]}
          onPress={() =>
            navigation.navigate("FriendProfileScreen", {
              friendId: item.friend_id,
            })
          }
        >
          <Text style={styles.buttonText}>Ver perfil</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderSearchItem = ({ item }: { item: Usuario }) => (
    <View style={styles.card}>
      {item.avatar_url && (
        <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
      )}
      <Text style={styles.title}>
        {item.nombre} {item.alias ? `(${item.alias})` : ""}
      </Text>
      <Text style={styles.subtitle}>{item.correo}</Text>
      {item.bio && <Text style={styles.subtitle}>{item.bio}</Text>}
      <TouchableOpacity
        style={[styles.button, styles.profile]}
        onPress={() =>
          navigation.navigate("FriendProfileScreen", { friendId: item.id })
        }
      >
        <Text style={styles.buttonText}>Ver perfil</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Buscador */}
      <TextInput
        style={styles.input}
        placeholder="Buscar por nombre o correo"
        value={query}
        onChangeText={setQuery}
      />
      <TouchableOpacity
        style={[styles.button, styles.profile]}
        onPress={searchUsers}
      >
        <Text style={styles.buttonText}>Buscar</Text>
      </TouchableOpacity>

      {/* Resultados de búsqueda */}
      {searchResults.length > 0 && (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderSearchItem}
          ListEmptyComponent={
            <Text style={styles.empty}>No se encontraron usuarios</Text>
          }
        />
      )}

      {/* Lista de amigos */}
      <FlatList
        data={friends}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderFriendItem}
        ListEmptyComponent={
          <Text style={styles.empty}>No tienes amigos todavía</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f5f5f5" },
  input: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
    alignSelf: "center",
  },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 4, textAlign: "center" },
  subtitle: { fontSize: 14, color: "#666", marginBottom: 8, textAlign: "center" },
  row: { flexDirection: "row", justifyContent: "space-between" },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 6,
  },
  accept: { backgroundColor: "#4CAF50" },
  reject: { backgroundColor: "#F44336" },
  profile: { backgroundColor: "#2196F3" },
  buttonText: { color: "#fff", fontWeight: "bold", textAlign: "center" },
  empty: { textAlign: "center", marginTop: 20, color: "#999" },
});