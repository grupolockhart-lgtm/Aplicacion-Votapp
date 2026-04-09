// src/components/GamificacionCard.tsx

import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config/api";

interface GamificacionProps {
  refreshTrigger?: boolean;
  puntosProp?: number;
  nivelProp?: number;
  rachaProp?: number;
}

export default function GamificacionCard({
  refreshTrigger,
  puntosProp,
  nivelProp,
  rachaProp,
}: GamificacionProps) {
  const [puntos, setPuntos] = useState(puntosProp ?? 0);
  const [racha, setRacha] = useState(rachaProp ?? 0);
  const [nivel, setNivel] = useState(nivelProp ?? 1);
  const [logros, setLogros] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedLogro, setSelectedLogro] = useState<any | null>(null);

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
    <View style={styles.container}>
      {/* Datos principales en horizontal */}
      <View style={styles.row}>
        <Text style={styles.item}>⭐ Puntos: {puntos}</Text>
        <Text style={styles.item}>🔥 Racha: {racha} días</Text>
        <Text style={styles.item}>🏆 Nivel: {nivel}</Text>
      </View>

      {/* Logros en scroll horizontal */}
      {logros.length > 0 ? (
        <View style={styles.logrosWrapper}>
          <View style={styles.logrosContainer}>
            <Text style={styles.header}>Logros:</Text>
            <FlatList
              data={logros}
              horizontal
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => setSelectedLogro(item)}>
                  <View style={styles.logroItem}>
                    <Text style={styles.icon}>{item.icono}</Text>
                  </View>
                </TouchableOpacity>
              )}
              showsHorizontalScrollIndicator={false}
              nestedScrollEnabled={true}   // ✅ agregado para evitar el warning
            />
          </View>
        </View>
      ) : (
        <Text style={styles.text}>Aún no tienes logros</Text>
      )}

      {/* Modal para detalle de logro */}
      <Modal
        visible={!!selectedLogro}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedLogro(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedLogro?.nombre}</Text>
            <Text style={styles.modalDescription}>{selectedLogro?.descripcion}</Text>
            <TouchableOpacity onPress={() => setSelectedLogro(null)}>
              <Text style={styles.closeButton}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 6,
    paddingVertical: 6,   // 👈 menos padding vertical
    paddingHorizontal: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginBottom: 2,      // 👈 menos margen inferior
    marginTop: 2,         // 👈 menos margen superior
  },
  item: {
    fontSize: 15,         // 👈 más pequeño
    fontWeight: "600",
    color: "#111827",
    marginHorizontal: 4,
    lineHeight: 16,       // 👈 controla altura de línea, menos aire
  },
  text: {
    fontSize: 15,
    marginBottom: 2,
    color: "#111827",
    lineHeight: 14,
  },
  header: {
    fontSize: 15,
    marginTop: 4,
    marginBottom: 2,
    fontWeight: "bold",
    color: "#1f2937",
    marginRight: 6,
    lineHeight: 15,
  },
  logrosWrapper: {
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  logrosContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logroItem: {
    alignItems: "center",
    marginRight: 6,       // 👈 menos separación
  },
  icon: {
    fontSize: 13,         // 👈 más pequeño
    lineHeight: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 6,
    padding: 16,
    width: "80%",
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 6,
  },
  modalDescription: {
    fontSize: 12,
    marginBottom: 12,
  },
  closeButton: {
    fontSize: 14,
    color: "#2563EB",
    fontWeight: "600",
    textAlign: "center",
  },
});