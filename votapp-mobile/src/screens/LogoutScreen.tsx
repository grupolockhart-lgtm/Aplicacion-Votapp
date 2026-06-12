
import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../Types/Navigation";

type Props = NativeStackScreenProps<RootStackParamList, "LogoutScreen">;

export default function LogoutScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    await AsyncStorage.removeItem("userToken");
    navigation.reset({
      index: 0,
      routes: [{ name: "LoginScreen" }],
    });
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <>
          <ActivityIndicator size="large" color="#EF4444" />
          <Text style={styles.loadingText}>Cerrando sesión...</Text>
        </>
      ) : (
        <View style={styles.card}>
          <Text style={styles.title}>Cerrar sesión</Text>
          <Text style={styles.message}>¿Seguro que quieres cerrar sesión?</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.logoutButton]}
              onPress={handleLogout}
            >
              <Text style={styles.logoutText}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F3F4F6" },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    width: "80%",
    alignItems: "center",
  },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 10, color: "#111827" },
  message: { fontSize: 16, marginBottom: 20, textAlign: "center", color: "#374151" },
  buttonRow: { flexDirection: "row", justifyContent: "space-between", width: "100%" },
  button: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: "center", marginHorizontal: 5 },
  cancelButton: { backgroundColor: "#E5E7EB" },
  logoutButton: { backgroundColor: "#EF4444" },
  cancelText: { color: "#374151", fontSize: 16, fontWeight: "bold" },
  logoutText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  loadingText: { fontSize: 16, marginTop: 10, color: "#EF4444" },
});