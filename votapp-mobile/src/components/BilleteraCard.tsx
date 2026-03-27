// src/components/BilleteraCard.tsx
import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";

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
  balance: number;
  actualizado_en: string;
  movimientos: Movimiento[];
};

type Props = {
  wallet: Wallet | null;
};

export default function BilleteraCard({ wallet }: Props) {
  return (
    <View style={styles.card}>
      {wallet ? (
        <>
          <Text style={styles.text}>Balance: ${wallet.balance}</Text>
          <Text style={styles.text}>
            Última actualización:{" "}
            {new Date(wallet.actualizado_en).toLocaleString()}
          </Text>

          {wallet.movimientos && wallet.movimientos.length > 0 ? (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.subtitle}>Últimos movimientos</Text>

              {wallet.movimientos.slice(0, 3).map((m) => (
                <View key={m.id} style={styles.movementCard}>
                  {m.survey?.media_urls?.[0] && (
                    <Image
                      source={{ uri: m.survey.media_urls[0] }}
                      style={styles.image}
                    />
                  )}
                  <Text style={styles.text}>{m.survey.title}</Text>
                  <Text style={styles.text}>Monto: ${m.monto}</Text>
                  <Text style={styles.text}>
                    Fecha: {new Date(m.fecha).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.text}>No hay movimientos registrados</Text>
          )}
        </>
      ) : (
        <Text style={styles.text}>Sin billetera registrada</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 12,
  },
  text: { fontSize: 14, marginBottom: 4 },
  subtitle: { fontSize: 16, fontWeight: "600", marginBottom: 6 },
  movementCard: {
    backgroundColor: "#f9f9f9",
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  image: { width: "100%", height: 100, borderRadius: 6, marginBottom: 6 },
});