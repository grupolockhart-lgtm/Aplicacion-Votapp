import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { API_URL } from "../../../config/api";
import { Profile } from "../../../Types/Profile";

export const useProfile = (navigation: any) => {
  const [profile, setProfile] = useState<Profile | null>(null);

  const refreshProfile = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;

      const res = await fetch(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data?.detail || "Error al cargar perfil");

      setProfile(data);
    } catch (err: any) {
      Alert.alert("Error", err.message || "No se pudo cargar el perfil");
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      refreshProfile();
    });
    return unsubscribe;
  }, [navigation]);

  return { profile, refreshProfile, setProfile };
};
