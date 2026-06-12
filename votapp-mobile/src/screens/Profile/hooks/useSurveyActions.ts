

import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../../../config/api";

export function useSurveyActions(setProfile: any, setRefreshGamificacion: any) {
  const votarEncuesta = async (id: number) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;

      const res = await fetch(`${API_URL}/surveys/${id}/vote`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answers: [{ question_id: 1, option_id: 2 }] }),
      });

      const data = await res.json();

      setProfile((prev: any) => ({
        ...prev,
        public_profile: {
          ...prev?.public_profile,
          puntos: data.usuario_puntos,
          nivel: data.usuario_nivel,
          racha_dias: data.usuario_racha,
        },
      }));

      setRefreshGamificacion((prev: boolean) => !prev);
    } catch (err) {
      console.error("Error al votar:", err);
    }
  };

  return { votarEncuesta };
}
