
import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";

export default function HeaderPerfil() {
  const avatarUrl = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  return (
    <View style={styles.header}>
      {/* Avatar */}
      <Image source={{ uri: avatarUrl }} style={styles.avatar} />

      {/* Info del usuario */}
      <View style={styles.info}>
        <Text style={styles.alias}>UsuarioDemo</Text>
        <Text style={styles.level}>Nivel 5 • 2,350 puntos</Text>
        <Text style={styles.bio}>Amante de las encuestas y la música 🎵</Text>

        {/* Métricas */}
        <View style={styles.stats}>
          <Text style={styles.stat}>20 Encuestas</Text>
          <Text style={styles.stat}>1.8k Seguidores</Text>
          <Text style={styles.stat}>250 Seguidos</Text>
        </View>

        {/* Botones */}
        <View style={styles.buttons}>
          <TouchableOpacity style={styles.btnEdit}>
            <Text style={styles.btnText}>Editar Perfil</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnFriends}>
            <Text style={styles.btnText}>Amigos Cercanos</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  info: {
    flex: 1,
  },
  alias: {
    fontSize: 18,
    fontWeight: "bold",
  },
  level: {
    fontSize: 14,
    color: "#555",
  },
  bio: {
    marginTop: 4,
    fontSize: 14,
    color: "#333",
  },
  stats: {
    flexDirection: "row",
    marginTop: 8,
    justifyContent: "space-between",
  },
  stat: {
    fontSize: 14,
    fontWeight: "600",
  },
  buttons: {
    flexDirection: "row",
    marginTop: 10,
  },
  btnEdit: {
    backgroundColor: "#ddd",
    padding: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  btnFriends: {
    backgroundColor: "#4CAF50",
    padding: 6,
    borderRadius: 6,
  },
  btnText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
