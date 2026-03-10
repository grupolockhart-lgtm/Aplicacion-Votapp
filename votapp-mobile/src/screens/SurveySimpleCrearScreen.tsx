// -------------------
// SurveySimpleCrearScreen
// -------------------
import React, { useState } from "react";
import { View, Text, TextInput, Button, FlatList, Image } from "react-native";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function SurveySimpleCrearScreen() {
  const [titulo, setTitulo] = useState("");
  const [preguntas, setPreguntas] = useState([
    { texto: "", opciones: [{ texto: "", votos: 0 }] },
  ]);
  const [imagenes, setImagenes] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [fechaExpiracion, setFechaExpiracion] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  // Preguntas y opciones
  const agregarPregunta = () => {
    setPreguntas([...preguntas, { texto: "", opciones: [{ texto: "", votos: 0 }] }]);
  };

  const actualizarPregunta = (index: number, texto: string) => {
    const nuevas = [...preguntas];
    nuevas[index].texto = texto;
    setPreguntas(nuevas);
  };

  const agregarOpcion = (preguntaIndex: number) => {
    const nuevas = [...preguntas];
    nuevas[preguntaIndex].opciones.push({ texto: "", votos: 0 });
    setPreguntas(nuevas);
  };

  const actualizarOpcion = (preguntaIndex: number, opcionIndex: number, texto: string) => {
    const nuevas = [...preguntas];
    nuevas[preguntaIndex].opciones[opcionIndex].texto = texto;
    setPreguntas(nuevas);
  };

  // Multimedia
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled) {
      setImagenes([...imagenes, result.assets[0].uri]);
    }
  };

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 1,
    });
    if (!result.canceled) {
      setVideos([...videos, result.assets[0].uri]);
    }
  };

  // Enviar encuesta
  const crearEncuesta = async () => {
    const body = {
      titulo,
      preguntas,
      imagenes,
      videos,
      fecha_expiracion: fechaExpiracion ? fechaExpiracion.toISOString() : null,
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

      <Text style={{ fontSize: 16 }}>Preguntas</Text>
      <FlatList
        data={preguntas}
        renderItem={({ item, index }) => (
          <View style={{ marginBottom: 20 }}>
            <TextInput
              value={item.texto}
              onChangeText={(texto) => actualizarPregunta(index, texto)}
              placeholder={`Pregunta ${index + 1}`}
              style={{ borderWidth: 1, padding: 8, marginVertical: 5 }}
            />

            <FlatList
              data={item.opciones}
              renderItem={({ item: opcion, index: opcionIndex }) => (
                <TextInput
                  value={opcion.texto}
                  onChangeText={(texto) => actualizarOpcion(index, opcionIndex, texto)}
                  placeholder={`Opción ${opcionIndex + 1}`}
                  style={{ borderWidth: 1, padding: 8, marginVertical: 5 }}
                />
              )}
              keyExtractor={(_, i) => i.toString()}
            />
            <Button title="Agregar opción" onPress={() => agregarOpcion(index)} />
          </View>
        )}
        keyExtractor={(_, i) => i.toString()}
      />
      <Button title="Agregar pregunta" onPress={agregarPregunta} />

      <Text style={{ fontSize: 16, marginTop: 20 }}>Multimedia</Text>
      <View style={{ flexDirection: "row", marginVertical: 10 }}>
        <Button title="Añadir Imagen" onPress={pickImage} />
        <View style={{ width: 10 }} />
        <Button title="Añadir Video" onPress={pickVideo} />
      </View>

      {imagenes.map((img, i) => (
        <Image key={i} source={{ uri: img }} style={{ width: 100, height: 100, marginVertical: 5 }} />
      ))}
      {videos.map((vid, i) => (
        <Text key={i} style={{ marginVertical: 5 }}>🎥 {vid}</Text>
      ))}

      <Text style={{ fontSize: 16, marginTop: 20 }}>Fecha de expiración</Text>
      <Button title="Seleccionar fecha" onPress={() => setShowPicker(true)} />

      {fechaExpiracion && (
        <Text style={{ marginVertical: 10 }}>
          Fecha seleccionada: {fechaExpiracion.toLocaleDateString()}
        </Text>
      )}

      {showPicker && (
        <DateTimePicker
          value={fechaExpiracion || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowPicker(false);
            if (selectedDate) {
              setFechaExpiracion(selectedDate);
            }
          }}
        />
      )}

      <Button title="Crear Encuesta" onPress={crearEncuesta} />
    </View>
  );
}