

import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";

const gamificacion = {
  logros: [
    { id: "1", nombre: "Primer voto", descripcion: "Participaste en tu primera encuesta" },
    { id: "2", nombre: "Racha 7 días", descripcion: "Votaste durante 7 días seguidos" },
    { id: "3", nombre: "Nivel 5", descripcion: "Alcanzaste el nivel 5" },
  ],
  racha: 12, // días consecutivos
  insignias: ["Explorador", "Influencer", "Analista"],
};

export default function GamificacionTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gamificación</Text>

      {/* Racha */}
      <Text style={styles.subtitle}>🔥 Racha actual: {gamificacion.racha} días</Text>

      {/* Logros */}
      <Text style={styles.subtitle}>🏆 Logros</Text>
      <FlatList
        data={gamificacion.logros}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.logro}>
            <Text style={styles.logroNombre}>{item.nombre}</Text>
            <Text style={styles.logroDesc}>{item.descripcion}</Text>
          </View>
        )}
      />

      {/* Insignias */}
      <Text style={styles.subtitle}>🛡️ Insignias</Text>
      <View style={styles.insignias}>
        {gamificacion.insignias.map((insignia, index) => (
          <Text key={index} style={styles.insignia}>
            {insignia}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 12 },
  subtitle: { fontSize: 16, fontWeight: "600", marginTop: 10, marginBottom: 6 },
  logro: { marginBottom: 8 },
  logroNombre: { fontSize: 14, fontWeight: "600" },
  logroDesc: { fontSize: 12, color: "#555" },
  insignias: { flexDirection: "row", flexWrap: "wrap", marginTop: 6 },
  insignia: {
    backgroundColor: "#2563EB",
    color: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 6,
    fontSize: 12,
    fontWeight: "600",
  },
});