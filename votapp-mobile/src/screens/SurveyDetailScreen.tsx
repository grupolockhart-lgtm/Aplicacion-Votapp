import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Button,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config/api";

interface Comment {
  id: number;
  user_id: number;
  content: string;
  created_at?: string;
}

export default function SurveyCommentsScreen({ route }: { route: any }) {
  const { surveyId } = route.params;
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        const res = await fetch(`${API_URL}/comments/survey/${surveyId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setComments(data || []);
      } catch (err) {
        console.log("Error cargando comentarios:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchComments();
  }, [surveyId]);

  const handleAddComment = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const res = await fetch(`${API_URL}/comments/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ survey_id: surveyId, content: newComment }),
      });
      const data = await res.json();
      setComments([data, ...comments]);
      setNewComment("");
    } catch (err) {
      console.log("Error creando comentario:", err);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text>Cargando comentarios...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Comentarios</Text>
      <FlatList
        data={comments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.comment}>
            <Text style={styles.commentUser}>Usuario {item.user_id}:</Text>
            <Text>{item.content}</Text>
          </View>
        )}
      />

      {/* Nuevo comentario */}
      <TextInput
        style={styles.input}
        value={newComment}
        onChangeText={setNewComment}
        placeholder="Escribe tu comentario..."
      />
      <Button title="Comentar" onPress={handleAddComment} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginVertical: 12 },
  comment: {
    marginVertical: 4,
    padding: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 6,
  },
  commentUser: { fontWeight: "bold" },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    padding: 8,
    marginVertical: 8,
    borderRadius: 6,
  },
});