// src/screens/profile/hooks/usePublicProfile.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../../../config/api";
import { Alert } from "react-native";

export function usePublicProfile(refreshProfile: () => void) {
  const savePublicProfile = async (payload: { alias: string; bio: string; avatar_url: string }) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;

      const res = await fetch(`${API_URL}/users/me/public`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const updated = await res.json();
      if (!res.ok) throw new Error(updated?.detail || "Error al guardar perfil público");

      await refreshProfile();

      Alert.alert("Éxito", "Perfil público actualizado correctamente");
    } catch (err: any) {
      Alert.alert("Error", err.message || "No se pudo guardar el perfil público");
    }
  };

  return { savePublicProfile };
}

