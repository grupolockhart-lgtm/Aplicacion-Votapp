// src/components/BilleteraCard.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type Wallet = {
  balance: number;
  actualizado_en: string;
};

type Props = {
  wallet: Wallet | null;
};

export default function BilleteraCard({ wallet }: Props) {
  if (!wallet) {
    return (
      <View style={styles.card}>
        <Text style={styles.text}>Sin billetera registrada</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {/* Encabezado con balance al lado */}
      <View style={styles.header}>
        <MaterialCommunityIcons name="wallet-outline" size={18} color="#2563EB" />
        <Text style={styles.title}>Billetera</Text>
        <Text style={styles.balance}>${wallet.balance.toFixed(2)}</Text>
      </View>

      {/* Última actualización */}
      <Text style={styles.updated}>
        Actualizado: {new Date(wallet.actualizado_en).toLocaleDateString()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 0,       // 👈 esquinas cuadradas
    marginBottom: 2,
    alignSelf: "stretch",  // 👈 ocupa todo el ancho disponible
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 6,
    color: "#2563EB",
  },
  balance: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#16A34A",
    marginLeft: "auto",
  },
  updated: {
    fontSize: 11,
    color: "#555",
  },
  text: {
    fontSize: 12,
    color: "#555",
  },
});

