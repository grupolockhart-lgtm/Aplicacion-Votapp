// src/components/LogoutButton.tsx

import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

export default function LogoutButton({ navigation }: any) {
  const handleLogout = () => {
    // En vez de ir directo a LoginScreen, vamos a LogoutScreen
    navigation.getParent()?.navigate("LogoutScreen");
  };

  return (
    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
      <Text style={styles.logoutText}>Cerrar sesión</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  logoutButton: {
    backgroundColor: "#EF4444",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  logoutText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});