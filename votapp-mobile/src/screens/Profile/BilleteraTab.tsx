// src/screens/Profile/BilleteraTab.tsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../../config/api";
import BilleteraCard from "../../components/BilleteraCard";
import WalletHistoryList from "../../components/WalletHistoryList";

type Movimiento = {
  id: number;
  monto: number;
  fecha: string;
  patrocinado: boolean;
  survey: {
    title: string;          // 👈 usar campo real
    media_urls: string[];   // 👈 usar campo real
  };
};

type Wallet = {
  id: number;
  balance: number;
  actualizado_en: string;
  movimientos: Movimiento[];
};

export default function BilleteraTab() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        const res = await fetch(`${API_URL}/users/me/wallet/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data: Wallet = await res.json();
          setWallet(data);
        } else if (res.status === 404) {
          setWallet(null);
        } else {
          setError("No se pudo cargar la billetera.");
        }
      } catch (err) {
        console.log("Error obteniendo billetera:", err);
        setError("No se pudo cargar la billetera.");
      } finally {
        setLoading(false);
      }
    };
    fetchWallet();
  }, []);

  if (loading) return <Text style={styles.text}>Cargando billetera...</Text>;
  if (error) return <Text style={styles.text}>{error}</Text>;

  return (
    <View style={styles.container}>
      {/* Balance y últimos movimientos */}
      <BilleteraCard wallet={wallet} />

      {/* Grid visual con encuestas patrocinadas */}
      <Text style={styles.subtitle}>Encuestas patrocinadas</Text>
      <WalletHistoryList />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  subtitle: { fontSize: 16, fontWeight: "600", marginBottom: 6 },
  text: { fontSize: 14, textAlign: "center", marginVertical: 10 },
});