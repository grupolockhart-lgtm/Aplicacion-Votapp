

// -------------------
// SurveySimpleCrearScreen
// -------------------
import React, { useState } from "react";
import { View, Text, TextInput, Button, FlatList, Image } from "react-native";
import * as ImagePicker from "expo-image-picker";

export default function SurveySimpleCrearScreen() {
  const [titulo, setTitulo] = useState("");
  const [opciones, setOpciones] = useState([{ texto: "", votos: 0 }]);
  const [imagenes, setImagenes] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);

  // Añadir opción nueva
  const agregarOpcion = () => {
    setOpciones([...opciones, { texto: "", votos: 0 }]);
  };

  // Actualizar texto de opción
  const actualizarOpcion = (index: number, texto: string) => {
    const nuevas = [...opciones];
    nuevas[index].texto = texto;
    setOpciones(nuevas);
  };

  // Seleccionar imagen
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled) {
      setImagenes([...imagenes, result.assets[0].uri]);
    }
  };

  // Seleccionar video
  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 1,
    });
    if (!result.canceled) {
      setVideos([...videos, result.assets[0].uri]);
    }
  };

  // Enviar encuesta al backend
  const crearEncuesta = async () => {
    const body = {
      titulo,
      opciones,
      imagenes,
      videos,
    };

    try {
        const res = await fetch("https://aplicacion-votapp-test.onrender.com/api/surveys/simple/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        });
      const data = await res.json();
      console.log("✅ Encuesta creada:", data);
      alert("Encuesta creada correctamente");
    } catch (error) {
      console.error("❌ Error creando encuesta:", error);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 10 }}>Título de la encuesta</Text>
      <TextInput
        value={titulo}
        onChangeText={setTitulo}
        placeholder="Escribe el título"
        style={{ borderWidth: 1, padding: 8, marginBottom: 15 }}
      />

      <Text style={{ fontSize: 16 }}>Opciones</Text>
      <FlatList
        data={opciones}
        renderItem={({ item, index }) => (
          <TextInput
            value={item.texto}
            onChangeText={(texto) => actualizarOpcion(index, texto)}
            placeholder={`Opción ${index + 1}`}
            style={{ borderWidth: 1, padding: 8, marginVertical: 5 }}
          />
        )}
        keyExtractor={(_, index) => index.toString()}
      />
      <Button title="Agregar opción" onPress={agregarOpcion} />

      <Text style={{ fontSize: 16, marginTop: 20 }}>Multimedia</Text>
      <View style={{ flexDirection: "row", marginVertical: 10 }}>
        <Button title="Añadir Imagen" onPress={pickImage} />
        <View style={{ width: 10 }} />
        <Button title="Añadir Video" onPress={pickVideo} />
      </View>

      {/* Mostrar imágenes seleccionadas */}
      {imagenes.map((img, i) => (
        <Image key={i} source={{ uri: img }} style={{ width: 100, height: 100, marginVertical: 5 }} />
      ))}

      {/* Mostrar videos seleccionados (solo URI) */}
      {videos.map((vid, i) => (
        <Text key={i} style={{ marginVertical: 5 }}>🎥 {vid}</Text>
      ))}

      <Button title="Crear Encuesta" onPress={crearEncuesta} />
    </View>
  );
}