


import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";

type Movimiento = {
  id: number;
  tipo: "ingreso" | "retiro";
  monto: number;
  fecha: string;
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
  const navigation = useNavigation<any>();

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Billetera</Text>
      {wallet ? (
        <>
          <Text style={styles.text}>Balance: {wallet.balance}</Text>
          <Text style={styles.text}>
            Última actualización: {new Date(wallet.actualizado_en).toLocaleString()}
          </Text>

          {wallet.movimientos && wallet.movimientos.length > 0 ? (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.subtitle}>Últimos movimientos</Text>

              {wallet.movimientos.slice(0, 3).map((m) => (
                <Text key={m.id} style={styles.text}>
                  {m.tipo === "ingreso" ? "➕ Ingreso" : "➖ Retiro"} de {m.monto} el{" "}
                  {new Date(m.fecha).toLocaleDateString()}
                </Text>
              ))}

              <TouchableOpacity
                style={{ marginTop: 8 }}
                onPress={() =>
                  navigation.navigate("WalletHistoryScreen", {
                    movimientos: wallet.movimientos,
                  })
                }
              >
                <Text style={styles.link}>Ver historial completo →</Text>
              </TouchableOpacity>
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
  card: { padding: 16, backgroundColor: "#fff", borderRadius: 8, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  text: { fontSize: 14, marginBottom: 4 },
  subtitle: { fontSize: 16, fontWeight: "600", marginBottom: 6 },
  link: { color: "#2563EB", fontWeight: "600" },
});