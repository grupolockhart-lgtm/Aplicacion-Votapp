// votapp-mobile/src/screens/SurveySimplePreviewScreen.tsx

import React from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../Types/Navigation";
import { API_URL } from "../config/api";

type Props = NativeStackScreenProps<
  RootStackParamList,
  "SurveySimplePreviewScreen"
>;

export default function SurveySimplePreviewScreen({ route, navigation }: Props) {
  const { draftSurvey, token } = route.params;

  const publicarEncuesta = async () => {
    try {
      const payloadBase64 = token.split(".")[1];
      const payload = JSON.parse(atob(payloadBase64));
      const currentUserId = payload.sub;

      const surveyPayload = {
        titulo: draftSurvey.titulo,
        preguntas: draftSurvey.preguntas,   // 👈 debe tener al menos una pregunta con opciones
        imagenes: draftSurvey.imagenes ?? [],
        videos: draftSurvey.videos ?? [],
        fecha_expiracion: draftSurvey.fecha_expiracion,
        asignado_a: currentUserId,
      };

      console.log("Payload encuesta:", surveyPayload);

      const res = await fetch(`${API_URL}/surveys/simple/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ survey: surveyPayload }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Error ${res.status}: ${errText}`);
      }

      const data = await res.json();
      console.log("Respuesta backend:", data);

      alert("✅ Encuesta publicada correctamente");
      navigation.navigate("MainTabs", { screen: "SurveysScreen" });
    } catch (error) {
      console.error("❌ Error publicando encuesta:", error);
      alert("Error publicando encuesta, revisa consola");
    }
  };


  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f9f9f9", padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 15, color: "#333" }}>
        Previsualización de encuesta
      </Text>

      <Text style={{ fontSize: 20, fontWeight: "600", marginBottom: 10, color: "#222" }}>
        {draftSurvey.titulo}
      </Text>

      {draftSurvey.preguntas.map((p: any, i: number) => (
        <View key={i} style={{ marginVertical: 10 }}>
          <Text style={{ fontSize: 18, fontWeight: "500", marginBottom: 5 }}>
            {i + 1}. {p.texto}
          </Text>
          {p.opciones.map((o: any, j: number) => (
            <Text key={j} style={{ marginLeft: 15, fontSize: 16, color: "#555", marginBottom: 3 }}>
              • {o.texto}
            </Text>
          ))}
        </View>
      ))}

      {draftSurvey.imagenes.map((img: string, i: number) => (
        <Image
          key={i}
          source={{ uri: img }}
          style={{ width: "100%", height: 200, borderRadius: 10, marginVertical: 10 }}
        />
      ))}

      {draftSurvey.videos.map((vid: string, i: number) => (
        <Text key={i} style={{ marginVertical: 5, color: "#333" }}>
          🎥 {vid}
        </Text>
      ))}

      <Text style={{ marginVertical: 15, fontSize: 16, color: "#555" }}>
        Expira: {new Date(draftSurvey.fecha_expiracion).toLocaleDateString()}
      </Text>

      <TouchableOpacity
        onPress={publicarEncuesta}
        style={{ backgroundColor: "green", padding: 12, borderRadius: 8, marginTop: 10 }}
      >
        <Text style={{ color: "#fff", textAlign: "center", fontSize: 16 }}>
          Publicar
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{ backgroundColor: "gray", padding: 12, borderRadius: 8, marginTop: 10 }}
      >
        <Text style={{ color: "#fff", textAlign: "center", fontSize: 16 }}>
          Editar
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
