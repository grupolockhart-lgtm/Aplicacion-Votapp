import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config/api";

export default function GamificacionCard({
  refreshTrigger,
  puntosProp,
  nivelProp,
  rachaProp,
}: {
  refreshTrigger?: boolean;
  puntosProp?: number;
  nivelProp?: number;
  rachaProp?: number;
}) {
  const [puntos, setPuntos] = useState(puntosProp ?? 0);
  const [racha, setRacha] = useState(rachaProp ?? 0);
  const [nivel, setNivel] = useState(nivelProp ?? 1);
  const [logros, setLogros] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchGamificacion = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;
      const res = await fetch(`${API_URL}/gamificacion/estado`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPuntos(data.puntos);
      setRacha(data.racha_dias);
      setNivel(data.nivel);
      setLogros(data.logros);
    } catch (err) {
      console.error("Error cargando gamificación:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (
      puntosProp === undefined &&
      nivelProp === undefined &&
      rachaProp === undefined
    ) {
      fetchGamificacion();
    }
  }, [refreshTrigger]);

  return (
    <View>
      <Text style={styles.text}>Puntos: {puntos}</Text>
      <Text style={styles.text}>Racha: {racha} días</Text>
      <Text style={styles.text}>Nivel: {nivel}</Text>
      {logros.length > 0 ? (
        <>
          <Text style={styles.header}>Logros:</Text>
          {logros.map((item, index) => (
            <Text key={index} style={styles.text}>
              {item.icono} {item.nombre} - {item.descripcion}
            </Text>
          ))}
        </>
      ) : (
        <Text style={styles.text}>Aún no tienes logros</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: 14, marginBottom: 4, color: "#111827" },
  header: { fontSize: 16, marginTop: 8, marginBottom: 4, fontWeight: "bold", color: "#1f2937" },
});