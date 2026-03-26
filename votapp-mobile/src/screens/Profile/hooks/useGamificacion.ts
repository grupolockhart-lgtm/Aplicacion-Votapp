
// src/screens/Profile/hooks/useGamificacion.ts

import { useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../../../config/api";

export function useGamificacion() {
  const [refreshGamificacion, setRefreshGamificacion] = useState(false);

  const fetchGamificacion = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;
      const res = await fetch(`${API_URL}/gamificacion/estado`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      console.log("Gamificación actualizada:", data);
      setRefreshGamificacion(prev => !prev);
    } catch (err) {
      console.error("Error cargando gamificación:", err);
    }
  }, []);

  return { refreshGamificacion, fetchGamificacion };
}