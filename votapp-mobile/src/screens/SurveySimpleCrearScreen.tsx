// -------------------
// SurveySimpleCrearScreen (con navegación a Preview)
// -------------------
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config/api";

type CustomButtonProps = {
  title: string;
  onPress: () => void;
};

const CustomButton: React.FC<CustomButtonProps> = ({ title, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={{
      backgroundColor: "#4A90E2",
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      marginVertical: 5,
    }}
  >
    <Text
      style={{
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
        textAlign: "center",
      }}
    >
      {title}
    </Text>
  </TouchableOpacity>
);

export default function SurveySimpleCrearScreen() {
  const navigation = useNavigation();

  const [titulo, setTitulo] = useState("");
  const [preguntas, setPreguntas] = useState([{ texto: "", opciones: [{ texto: "" }] }]);
  const [imagenes, setImagenes] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [fechaExpiracion, setFechaExpiracion] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("userToken").then((value) => {
      if (value) {
        console.log("Token recuperado:", value);
        setToken(value);
      }
    });
  }, []);

  const agregarPregunta = () => {
    setPreguntas([...preguntas, { texto: "", opciones: [{ texto: "" }] }]);
  };

  const actualizarPregunta = (index: number, texto: string) => {
    const nuevas = [...preguntas];
    nuevas[index].texto = texto;
    setPreguntas(nuevas);
  };

  const agregarOpcion = (preguntaIndex: number) => {
    const nuevas = [...preguntas];
    nuevas[preguntaIndex].opciones.push({ texto: "" });
    setPreguntas(nuevas);
  };

  const actualizarOpcion = (preguntaIndex: number, opcionIndex: number, texto: string) => {
    const nuevas = [...preguntas];
    nuevas[preguntaIndex].opciones[opcionIndex].texto = texto;
    setPreguntas(nuevas);
  };

// -------------------
// PICK IMAGE
// -------------------
const pickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: "images",
    quality: 1,
  });

  if (!result.canceled) {
    const uri = result.assets[0].uri;

    const manipulated = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1080 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );

    const formData = new FormData();
    formData.append("file", {
      uri: manipulated.uri,
      name: "survey_image.jpg",
      type: "image/jpeg",
    } as any);

    if (!token) {
      console.log("No hay token disponible");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/upload/image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      console.log("Respuesta completa del backend:", data);

      if (data.url) {
        console.log("Imagen subida, URL pública:", data.url);
        setImagenes((prev) => [...prev, data.url]);
      } else {
        console.log("⚠️ El backend no devolvió 'url'. Respuesta:", data);
      }
    } catch (err) {
      console.log("Error subiendo imagen:", err);
    }
  }
};




// -------------------
// PICK VIDEO
// -------------------
const pickVideo = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: "videos",
    quality: 1,
  });

  if (!result.canceled) {
    const uri = result.assets[0].uri;

    const formData = new FormData();
    formData.append("file", {
      uri,
      name: "survey_video.mp4",
      type: "video/mp4",
    } as any);

    if (!token) {
      console.log("No hay token disponible");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/upload/video`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      console.log("Respuesta completa del backend (video):", data);

      if (data.url) {
        console.log("Video subido, URL pública:", data.url);
        setVideos((prev) => [...prev, data.url]);
      } else {
        console.log("⚠️ El backend no devolvió 'url'. Respuesta:", data);
      }
    } catch (err) {
      console.log("Error subiendo video:", err);
    }
  }
};

// -------------------
// PREVISUALIZAR ENCUESTA
// -------------------
const previsualizarEncuesta = () => {
  const fechaFinal =
    fechaExpiracion || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const draftSurvey = {
    titulo,
    preguntas,
    imagenes,
    videos,
    fecha_expiracion: fechaFinal.toISOString(),
  };

  navigation.navigate("SurveySimplePreviewScreen", { draftSurvey, token });
};



  // -------------------
  // RETURN COMPLETO
  // -------------------
  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f9f9f9" }}>
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 15, color: "#333" }}>
          Crear encuesta simple
        </Text>

        <Text style={{ fontSize: 16, color: "#555", marginBottom: 5 }}>
          Título de la encuesta
        </Text>
        <TextInput
          value={titulo}
          onChangeText={setTitulo}
          placeholder="Escribe el título"
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 8,
            padding: 10,
            marginBottom: 15,
            fontSize: 16,
            backgroundColor: "#fff",
          }}
        />

        <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 10 }}>Preguntas</Text>
        {preguntas.map((pregunta, index) => (
          <View key={index} style={{ marginBottom: 20 }}>
            <TextInput
              value={pregunta.texto}
              onChangeText={(texto) => actualizarPregunta(index, texto)}
              placeholder={`Pregunta ${index + 1}`}
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                borderRadius: 8,
                padding: 10,
                marginVertical: 5,
                backgroundColor: "#fff",
              }}
            />

            {pregunta.opciones.map((opcion, opcionIndex) => (
              <TextInput
                key={opcionIndex}
                value={opcion.texto}
                onChangeText={(texto) => actualizarOpcion(index, opcionIndex, texto)}
                placeholder={`Opción ${opcionIndex + 1}`}
                style={{
                  borderWidth: 1,
                  borderColor: "#ccc",
                  borderRadius: 8,
                  padding: 10,
                  marginVertical: 5,
                  backgroundColor: "#fff",
                }}
              />
            ))}
            <CustomButton title="Agregar opción" onPress={() => agregarOpcion(index)} />
          </View>
        ))}
        <CustomButton title="Agregar pregunta" onPress={agregarPregunta} />

        <Text style={{ fontSize: 16, fontWeight: "600", marginTop: 20 }}>Multimedia</Text>
        <View style={{ flexDirection: "row", marginVertical: 10 }}>
          <CustomButton title="Añadir Imagen" onPress={pickImage} />
          <View style={{ width: 10 }} />
          <CustomButton title="Añadir Video" onPress={pickVideo} />
        </View>

        {imagenes.map((img, i) => (
          <View
            key={i}
            style={{
              shadowColor: "#000",
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 3,
              borderRadius: 10,
              overflow: "hidden",
              marginVertical: 5,
            }}
          >
            <Image
              source={{ uri: img }}
              style={{
                width: 120,
                height: 120,
                borderRadius: 10,
              }}
            />
          </View>
        ))}
        {videos.map((vid, i) => (
          <Text key={i} style={{ marginVertical: 5, color: "#333" }}>
            🎥 {vid}
          </Text>
        ))}

        <Text style={{ fontSize: 16, fontWeight: "600", marginTop: 20 }}>Fecha de expiración</Text>
        <CustomButton title="Seleccionar fecha" onPress={() => setShowPicker(true)} />

        {fechaExpiracion && (
          <Text style={{ marginVertical: 10, color: "#555" }}>
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

        <CustomButton title="Previsualizar Encuesta" onPress={previsualizarEncuesta} />
      </View>
    </ScrollView>
  );
}

