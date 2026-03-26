import React, { useState } from "react";
import { FlatList, View, Text, Image, StyleSheet } from "react-native";

const initialData = [
  { id: "1", titulo: "Destino favorito?", votos: 120, imagen: "https://picsum.photos/200/300?1" },
  { id: "2", titulo: "Pizza o Hamburguesa?", votos: 98, imagen: "https://picsum.photos/200/300?2" },
  { id: "3", titulo: "Noche de Juegos", votos: 56, imagen: "https://picsum.photos/200/300?3" },
  { id: "4", titulo: "Género Musical?", votos: 107, imagen: "https://picsum.photos/200/300?4" },
  { id: "5", titulo: "¿Perro o Gato?", votos: 78, imagen: "https://picsum.photos/200/300?5" },
  { id: "6", titulo: "Maratón de Pelis?", votos: 56, imagen: "https://picsum.photos/200/300?6" },
];

export default function EncuestasTab() {
  const [encuestas, setEncuestas] = useState(initialData);

  // Simulación de carga de más encuestas
  const loadMore = () => {
    const newData = [
      { id: String(encuestas.length + 1), titulo: "Nueva encuesta", votos: 42, imagen: "https://picsum.photos/200/300?7" },
      { id: String(encuestas.length + 2), titulo: "Otra encuesta", votos: 33, imagen: "https://picsum.photos/200/300?8" },
    ];
    setEncuestas([...encuestas, ...newData]);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* 👇 Título principal */}
      <Text style={styles.header}>Mis Encuestas</Text>

      <FlatList
        data={encuestas}
        numColumns={3}   // 👈 ahora en 3 columnas
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.imagen }} style={styles.image} />
            <Text style={styles.title}>{item.titulo}</Text>
            <Text style={styles.votes}>{item.votos} votos</Text>
          </View>
        )}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 12,
    marginLeft: 12,
    color: "#111827",
  },
  card: {
    width: "30%",          // 👈 ocupa un tercio del ancho
    margin: 6,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: 100,           // 👈 ajustado para que se vea bien en 3 columnas
    borderRadius: 8,
  },
  title: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  votes: {
    fontSize: 11,
    color: "#555",
  },
});