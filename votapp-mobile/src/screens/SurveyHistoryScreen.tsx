// -----------------------------
// Componente SurveyHistoryScreen (compacto estilo billetera)
// -----------------------------
import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../Types/Navigation";
import Ionicons from "@expo/vector-icons/Ionicons";

type Props = NativeStackScreenProps<RootStackParamList, "SurveyHistoryScreen">;

export default function SurveyHistoryScreen({ route }: Props) {
  const { history } = route.params;

  const renderItem = ({ item }: { item: typeof history[0] }) => (
    <View style={styles.row}>
      <Text style={styles.surveyTitle} numberOfLines={1}>
        {item.title}
      </Text>
      <View style={styles.rowRight}>
        <Text style={styles.badge}>✔</Text>
        <Text style={styles.date}>
          {new Date(item.completed_at).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons
          name="list-outline"
          size={22}
          color="#111827"
          style={{ marginRight: 8 }}
        />
        <Text style={styles.title}>Historial completo de encuestas</Text>
      </View>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb", padding: 20 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  title: { fontSize: 20, fontWeight: "700", color: "#111827" },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#fff",
    borderRadius: 6,
    marginBottom: 8,
    paddingHorizontal: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  surveyTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    marginRight: 8,
  },
  rowRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  badge: {
    backgroundColor: "#10B981",
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
    textAlign: "center",
  },
  date: { fontSize: 11, color: "#6B7280" },
});