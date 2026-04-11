
// src/screens/SearchFriendScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

type User = {
  id: number;
  username: string;
  email: string;
};

export default function SearchFriendScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);

  const searchFriends = async () => {
    try {
      const res = await fetch(
        `https://aplicacion-votapp-test.onrender.com/api/users/search?query=${query}`
      );
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error("Error al buscar amigos:", err);
    }
  };

  const sendFriendRequest = async (friendId: number) => {
    try {
      await fetch(
        `https://aplicacion-votapp-test.onrender.com/api/friends?user_id=1&friend_id=${friendId}`,
        { method: "POST" }
      );
      alert("Solicitud enviada");
    } catch (err) {
      console.error("Error al enviar solicitud:", err);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Buscar por nombre o email"
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={searchFriends}
      />
      <FlatList
        data={results}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.username}</Text>
            <Text style={styles.subtitle}>{item.email}</Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => sendFriendRequest(item.id)}
            >
              <Text style={styles.buttonText}>Agregar amigo</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text>No se encontraron resultados</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#fff",
    padding: 12,
    marginBottom: 8,
    borderRadius: 6,
    elevation: 2,
  },
  title: { fontSize: 16, fontWeight: "bold" },
  subtitle: { fontSize: 14, color: "#666" },
  button: {
    marginTop: 8,
    backgroundColor: "#2196F3",
    paddingVertical: 6,
    borderRadius: 4,
  },
  buttonText: { color: "#fff", textAlign: "center" },
});