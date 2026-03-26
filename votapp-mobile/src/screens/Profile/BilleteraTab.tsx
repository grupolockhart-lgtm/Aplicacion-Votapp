// src/screens/Profile/BilleteraTab.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import WalletHistoryList from "../../components/WalletHistoryList";

const wallet = {
  balance: 2350,
  actualizado_en: new Date().toISOString(),
  movimientos: [
    { id: "1", tipo: "ingreso", monto: 500, fecha: "2026-03-20" },
    { id: "2", tipo: "retiro", monto: 200, fecha: "2026-03-21" },
    { id: "3", tipo: "ingreso", monto: 300, fecha: "2026-03-22" },
  ],
};

export default function BilleteraTab({ navigation }: any) {
  return (
    <View style={styles.container}>
      {/* Balance y datos */}
      <Text style={styles.title}>Billetera</Text>
      <Text style={styles.balance}>Balance: {wallet.balance} monedas</Text>
      <Text style={styles.updated}>
        Última actualización: {new Date(wallet.actualizado_en).toLocaleString()}
      </Text>

      {/* Movimientos en lista simple */}
      <Text style={styles.subtitle}>Últimos movimientos</Text>
      <FlatList
        data={wallet.movimientos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Text style={styles.text}>
            {item.tipo === "ingreso" ? "➕ Ingreso" : "➖ Retiro"} de {item.monto} el{" "}
            {new Date(item.fecha).toLocaleDateString()}
          </Text>
        )}
      />

      <TouchableOpacity
        style={styles.historyButton}
        onPress={() =>
          navigation.navigate("WalletHistoryScreen", { movimientos: wallet.movimientos })
        }
      >
        <Text style={styles.historyText}>Ver historial completo →</Text>
      </TouchableOpacity>

      {/* 👇 Grid visual con encuestas/movimientos */}
      <Text style={[styles.subtitle, { marginTop: 16 }]}>Encuestas patrocinadas</Text>
      <WalletHistoryList />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  balance: { fontSize: 16, fontWeight: "600" },
  updated: { fontSize: 14, color: "#555", marginBottom: 12 },
  subtitle: { fontSize: 16, fontWeight: "600", marginBottom: 6 },
  text: { fontSize: 14, marginBottom: 4 },
  historyButton: { marginTop: 10 },
  historyText: { color: "#2563EB", fontWeight: "600" },
});