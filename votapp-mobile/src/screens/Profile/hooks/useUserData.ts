// src/screens/Profile/hooks/useUserData.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

export const useUserData = (
  API_URL: string,
  refreshProfile: () => Promise<void>,
  setEditingUserData: (val: boolean) => void
) => {
  const saveUserData = async (payload: {
    telefono_movil: string;
    ciudad: string;
    estado_civil: string;
    nivel_educativo: string;
    profesion: string;
    ocupacion: string;
    religion: string;
  }) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;

      console.log("Payload enviado a /users/me:", payload);

      const res = await fetch(`${API_URL}/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const raw = await res.text();
      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        data = { detail: raw };
      }

      if (!res.ok) {
        throw new Error(data?.detail || "Error al guardar datos");
      }

      console.log("Respuesta backend:", data);

      await refreshProfile();
      setEditingUserData(false);

      Alert.alert("Éxito", "Datos del usuario actualizados correctamente");
    } catch (err: any) {
      Alert.alert("Error", err.message || "No se pudo guardar los datos");
    }
  };

  return { saveUserData };
};