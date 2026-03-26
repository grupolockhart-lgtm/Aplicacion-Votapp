// src/screens/Profile/hooks/useProfile.ts
import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { API_URL } from "../../../config/api";

export const useProfile = (navigation: any) => {
  const [profile, setProfile] = useState<any>(null);

  const refreshProfile = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;

      const res = await fetch(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      // 👇 Log para inspeccionar la estructura real
      console.log("Perfil recibido desde backend:", data);

      if (!res.ok) throw new Error(data?.detail || "Error al cargar perfil");

      setProfile(data);
    } catch (err: any) {
      Alert.alert("Error", err.message || "No se pudo cargar el perfil");
    }
  }, []);

  // Cargar perfil al montar
  useEffect(() => {
    refreshProfile();
  }, []);

  // Refrescar perfil cada vez que la pantalla se enfoca
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      refreshProfile();
    });
    return unsubscribe;
  }, [navigation]);

  return { profile, refreshProfile };
};