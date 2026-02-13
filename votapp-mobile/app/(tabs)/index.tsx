import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView,
} from "react-native";

type Survey = {
  id: number;
  title: string;
  description: string;
  options: string[];
};

export default function HomeScreen() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://aplicacion-votapp.onrender.com/api/surveys")
      .then((res) => res.json())
      .then((data) => {
        setSurveys(data); // si tu API devuelve directamente un array
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching surveys:", err);
        setLoading(false);
      });
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image
        source={require("../../assets/images/partial-react-logo.png")}
        style={styles.reactLogo}
      />

      <Text style={styles.title}>Encuestas disponibles</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : surveys.length === 0 ? (
        <Text style={styles.emptyText}>No hay encuestas disponibles.</Text>
      ) : (
        surveys.map((survey) => (
          <View key={survey.id} style={styles.surveyCard}>
            <Text style={styles.surveyTitle}>{survey.title}</Text>
            <Text style={styles.surveyDescription}>{survey.description}</Text>
            {survey.options.map((opt, i) => (
              <Text key={i} style={styles.option}>
                • {opt}
              </Text>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
    color: "#666",
  },
  surveyCard: {
    backgroundColor: "#f2f2f2",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  surveyTitle: { fontSize: 18, fontWeight: "600", marginBottom: 4 },
  surveyDescription: { fontSize: 14, marginBottom: 8 },
  option: { fontSize: 14, marginLeft: 8 },
  reactLogo: {
    height: 120,
    width: 200,
    resizeMode: "contain",
    alignSelf: "center",
    marginBottom: 20,
  },
});
