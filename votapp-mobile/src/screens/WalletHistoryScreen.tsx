import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../Types/Navigation";
import Ionicons from "@expo/vector-icons/Ionicons";

type Props = NativeStackScreenProps<RootStackParamList, "WalletHistoryScreen">;

export default function WalletHistoryScreen({ route }: Props) {
  const { movimientos } = route.params;

  const renderItem = ({ item }: { item: typeof movimientos[0] }) => (
    <View style={[styles.card, item.tipo === "ingreso" ? styles.ingresoCard : styles.retiroCard]}>
      <Text style={styles.cardTitle}>
        {item.tipo === "ingreso" ? "➕ Ingreso" : "➖ Retiro"}
      </Text>
      <Text style={styles.cardText}>Monto: {item.monto}</Text>
      <Text style={styles.cardText}>
        Fecha: {new Date(item.fecha).toLocaleDateString()}
      </Text>

      {/* 👇 Badge opcional */}
      {item.patrocinado && (
        <View style={[styles.badge, styles.patrocinadaBadge]}>
          <Text style={[styles.badgeText, styles.patrocinadaBadgeText]}>Patrocinado</Text>
        </View>
      )}
      {item.bonus && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Bonus</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="wallet-outline" size={22} color="#111827" style={{ marginRight: 8 }} />
        <Text style={styles.title}>Historial completo de movimientos</Text>
      </View>
      <FlatList
        data={movimientos}
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
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  ingresoCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#10B981", // verde para ingresos
  },
  retiroCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#EF4444", // rojo para retiros
  },
  cardTitle: { fontSize: 16, fontWeight: "600", marginBottom: 4, color: "#111827" },
  cardText: { fontSize: 14, color: "#374151" },
  badge: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  patrocinadaBadge: {
    backgroundColor: "#FFD700", // dorado para patrocinados
  },
  badgeText: { fontSize: 12, fontWeight: "600", color: "#374151" },
  patrocinadaBadgeText: {
    color: "#000", // texto negro sobre dorado
  },
});



