// src/screens/SurveysScreen.tsx
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config/api";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";

import DisponiblesScreen from "@/screens/DisponiblesScreen";
import VotadasScreen from "@/screens/VotadasScreen";
import FinalizadasScreen from "@/screens/FinalizadasScreen";
import SurveyHistory from "@/screens/SurveyHistory";

// -------------------
// Tipos
// -------------------
interface Option {
  id: number;
  text: string;
  count?: number;
  percentage?: number;
}

interface Question {
  id: number;
  text: string;
  options: Option[];
  total_votes?: number | null;
}

// 👇 Exportamos Survey para usarlo en otros archivos
export interface Survey {
  id: number;
  title: string;
  description?: string;
  fecha_expiracion?: string;
  fecha_creacion?: string;   // 👈 añadimos este campo
  segundos_restantes?: number;
  questions: Question[];
  media_url?: string;
  media_urls?: string[];
  media_type?: "native" | "webview";
  patrocinada?: boolean;
  patrocinador?: string;
  es_patrocinada?: boolean;
  recompensa_puntos?: number;
  recompensa_dinero?: number;
  presupuesto_total?: number;
  visibilidad_resultados?: "publica" | "privada";
  tipo: "normal" | "simple";
}



const Tab = createMaterialTopTabNavigator();

export default function SurveysScreen() {
  const [disponibles, setDisponibles] = useState<Survey[]>([]);
  const [votadas, setVotadas] = useState<Survey[]>([]);
  const [finalizadas, setFinalizadas] = useState<Survey[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [globalMuted, setGlobalMuted] = useState<boolean>(true);

  const [userRole, setUserRole] = useState<string | null>(null);

  const toggleMute = () => setGlobalMuted((prev) => !prev);

  const toArray = (data: any) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.results && Array.isArray(data.results)) return data.results;
    return [];
  };




 // 🔑 Normalización de encuestas simples
const normalizeSimple = (s: any): Survey => ({
  id: s.id,
  title: s.titulo,
  description: s.description ?? "",
  fecha_expiracion: s.fecha_expiracion,
  fecha_creacion: s.fecha_creacion,   // 👈 añadido para poder ordenar por fecha
  segundos_restantes: s.segundos_restantes ?? 0,
  questions: Array.isArray(s.preguntas)
    ? s.preguntas.map((q: any) => ({
        id: q.id,
        text: q.texto,
        options: Array.isArray(q.opciones)
          ? q.opciones.map((o: any) => ({
              id: o.id,
              text: o.texto,
              count: o.votos,
            }))
          : [],
        total_votes: null,
      }))
    : [],
  // 👇 Ajuste clave: si no hay media_url explícito, tomamos la primera imagen
  media_url: s.media_url ?? (s.imagenes?.[0] ?? null),
  // 👇 Aseguramos que todas las imágenes y videos estén en media_urls
  media_urls: Array.isArray(s.media_urls)
    ? s.media_urls
    : [...(s.imagenes ?? []), ...(s.videos ?? [])],
  media_type: s.media_type ?? "native",
  visibilidad_resultados: s.visibilidad_resultados ?? "publica",
  patrocinada: s.patrocinada ?? false,
  es_patrocinada: s.es_patrocinada ?? false,
  patrocinador: s.patrocinador ?? null,
  recompensa_puntos: s.recompensa_puntos ?? 0,
  recompensa_dinero: s.recompensa_dinero ?? 0,
  presupuesto_total: s.presupuesto_total ?? 0,
  tipo: "simple",
});





const refreshSurveys = async () => {
  try {
    const token = await AsyncStorage.getItem("userToken");
    if (!token) return;

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    console.log("Token usado en fetch:", token);

    const responses = await Promise.allSettled([
      fetch(`${API_URL}/surveys/disponibles`, { method: "GET", headers }),
      fetch(`${API_URL}/surveys/votadas`, { method: "GET", headers }),
      fetch(`${API_URL}/surveys/finalizadas`, { method: "GET", headers }),
      fetch(`${API_URL}/surveys/simple/disponibles`, { method: "GET", headers }),   // 👈 sin /api extra
      fetch(`${API_URL}/surveys/simple/votadas`, { method: "GET", headers }),       // 👈 sin /api extra
      fetch(`${API_URL}/surveys/simple/finalizadas`, { method: "GET", headers }),   // 👈 sin /api extra
    ]);



    const getJson = async (res: any, name: string) => {
      if (res.status === "fulfilled") {
        if (!res.value.ok) {
          console.error(`${name} error:`, await res.value.text());
          return [];
        }
        try {
          const json = await res.value.json();
          console.log(`${name} status:`, res.value.status);
          console.log(`${name} count:`, json.length);
          return json;
        } catch (err) {
          console.error(`${name} parse error:`, err);
          return [];
        }
      } else {
        console.log(`${name} falló:`, res.reason);
        return [];
      }
    };

    const normalesDisponibles = await getJson(responses[0], "Disponibles normales");
    const normalesVotadas = await getJson(responses[1], "Votadas normales");
    const normalesFinalizadas = await getJson(responses[2], "Finalizadas normales");

    const simplesDisponibles = await getJson(responses[3], "Disponibles simples");
    console.log("Respuesta cruda simples disponibles:", simplesDisponibles);

    const simplesVotadas = await getJson(responses[4], "Votadas simples");
    console.log("Respuesta cruda simples votadas:", simplesVotadas);

    const simplesFinalizadas = await getJson(responses[5], "Finalizadas simples");
    console.log("Respuesta cruda simples finalizadas:", simplesFinalizadas);


    
    setDisponibles([
      ...toArray(normalesDisponibles).map((s: Survey) => ({ ...s, tipo: "normal" })),
      ...toArray(simplesDisponibles).map(normalizeSimple),   // 👈 ahora seguro
    ]);

    setVotadas([
      ...toArray(normalesVotadas).map((s: Survey) => ({ ...s, tipo: "normal" })),
      ...toArray(simplesVotadas).map(normalizeSimple),
    ]);

    setFinalizadas([
      ...toArray(normalesFinalizadas).map((s: Survey) => ({ ...s, tipo: "normal" })),
      ...toArray(simplesFinalizadas).map(normalizeSimple),
    ]);


  } catch (err) {
    console.log("Error en refreshSurveys:", err);
    setError("No se pudieron refrescar las encuestas");
  }
};



  const refreshProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;
      const res = await fetch(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || "Error al cargar perfil");

      setUserRole(data.user?.rol || null);
    } catch (err) {
      console.log("Error refrescando perfil:", err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        await refreshSurveys();
        await refreshProfile();
      } catch (err) {
        setError("No se pudieron cargar los datos");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Cargando encuestas...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

// 👇 Aquí logueamos los datos normalizados
  console.log(
  "Disponibles simples normalizados:",
  JSON.stringify(disponibles.filter((s) => s.tipo === "simple"), null, 2)
);



  
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#111827",
        tabBarInactiveTintColor: "#6B7280",
        tabBarLabelStyle: { fontSize: 14, fontWeight: "600" },
        tabBarIndicatorStyle: { backgroundColor: "#2563EB", height: 3 },
        tabBarStyle: {
          backgroundColor: "#F9FAFB",
          borderRadius: 8,
          marginHorizontal: 4,
          marginTop: 4,
        },
      }}
    >
      {userRole === "user" && (
        <Tab.Screen name="Disponibles">
          {() => (
            <DisponiblesScreen
              surveys={disponibles}
              globalMuted={globalMuted}
              toggleMute={toggleMute}
              refreshSurveys={refreshSurveys}
              refreshProfile={refreshProfile}
            />
          )}
        </Tab.Screen>
      )}

      {userRole === "user" && (
        <Tab.Screen name="Votadas">
          {() => (
            <VotadasScreen
              surveys={votadas}
              globalMuted={globalMuted}
              toggleMute={toggleMute}
              refreshSurveys={refreshSurveys}
              refreshProfile={refreshProfile}
            />
          )}
        </Tab.Screen>
      )}

      <Tab.Screen name="Finalizadas">
        {() => (
          <FinalizadasScreen
            surveys={finalizadas}
            globalMuted={globalMuted}
            toggleMute={toggleMute}
            refreshSurveys={refreshSurveys}
            refreshProfile={refreshProfile}
            userRole={userRole ?? "user"}
          />
        )}
      </Tab.Screen>



      {userRole === "admin" && (
        <Tab.Screen name="Historial">
          {() => <SurveyHistory />}
        </Tab.Screen>
      )}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, fontSize: 16, color: "#111827" },
  errorText: { color: "red", fontSize: 16, fontWeight: "bold" },
});