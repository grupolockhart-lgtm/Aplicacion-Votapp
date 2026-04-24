// src/screens/SurveysScreen.tsx
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config/api";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";

import DisponiblesScreen from "@/screens/DisponiblesScreen";
import PersonalesScreen from "@/screens/PersonalesScreen";
import VotadasScreen from "@/screens/VotadasScreen";
import FinalizadasScreen from "@/screens/FinalizadasScreen";
import SurveyHistory from "@/screens/SurveyHistory";
import { FontAwesome } from "@expo/vector-icons"; // 👈 importamos íconos


const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, fontSize: 16, color: "#111827" },
  errorText: { color: "red", fontSize: 16, fontWeight: "bold" },
});



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
  fecha_creacion?: string;
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

  usuario_id?: number;
  current_user_id?: number;
  asignado_a?: number[];
  asignado_por?: number;

  // 👇 nuevos campos del backend
  usuario_alias?: string;
  usuario_avatar_url?: string;
  asignador_alias?: string;
  asignador_avatar_url?: string;
}


const Tab = createMaterialTopTabNavigator();

export default function SurveysScreen() {
  const [disponibles, setDisponibles] = useState<Survey[]>([]);
  const [personales, setPersonales] = useState<Survey[]>([]); 
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
    title: s.title ?? s.titulo,
    description: s.description ?? "",
    fecha_expiracion: s.fecha_expiracion,
    fecha_creacion: s.fecha_creacion,
    segundos_restantes: s.segundos_restantes ?? 0,
    usuario_id: s.usuario_id,
    current_user_id: s.current_user_id,
    asignado_a: Array.isArray(s.asignado_a) ? s.asignado_a : [],
    asignado_por: s.asignado_por ?? null,

    // 👇 nuevos campos
    usuario_alias: s.usuario_alias ?? null,
    usuario_avatar_url: s.usuario_avatar_url ?? null,
    asignador_alias: s.asignador_alias ?? null,
    asignador_avatar_url: s.asignador_avatar_url ?? null,

    questions: Array.isArray(s.questions ?? s.preguntas)
      ? (s.questions ?? s.preguntas).map((q: any) => ({
          id: q.id,
          text: q.text ?? q.texto,
          options: Array.isArray(q.options ?? q.opciones)
            ? (q.options ?? q.opciones).map((o: any) => ({
                id: o.id,
                text: o.text ?? o.texto,
                count: o.count ?? o.votos,
              }))
            : [],
          total_votes: q.total_votes ?? null,
        }))
      : [],
    media_url: s.media_url ?? (s.imagenes?.[0] ?? null),
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

      const responses = await Promise.allSettled([
        fetch(`${API_URL}/surveys/disponibles`, { method: "GET", headers }),
        fetch(`${API_URL}/surveys/personales`, { method: "GET", headers }),
        fetch(`${API_URL}/surveys/votadas`, { method: "GET", headers }),
        fetch(`${API_URL}/surveys/finalizadas`, { method: "GET", headers }),
        fetch(`${API_URL}/surveys/simple/disponibles`, { method: "GET", headers }),
        fetch(`${API_URL}/surveys/simple/votadas`, { method: "GET", headers }),
        fetch(`${API_URL}/surveys/simple/finalizadas`, { method: "GET", headers }),
        fetch(`${API_URL}/surveys/simple/personales`, { method: "GET", headers }),
      ]);

      const getJson = async (res: any) => {
        if (res.status === "fulfilled") {
          if (!res.value.ok) return [];
          try {
            return await res.value.json();
          } catch {
            return [];
          }
        }
        return [];
      };

      const normalesDisponibles = await getJson(responses[0]);
      const normalesPersonales = await getJson(responses[1]);
      const normalesVotadas = await getJson(responses[2]);
      const normalesFinalizadas = await getJson(responses[3]);
      const simplesDisponibles = await getJson(responses[4]);
      const simplesVotadas = await getJson(responses[5]);
      const simplesFinalizadas = await getJson(responses[6]);
      const simplesPersonales = await getJson(responses[7]);
      console.log("simplesPersonales raw:", simplesPersonales); // 👈 log de depuración

      const simplesPersonalesNormalized = toArray(simplesPersonales).map(normalizeSimple);
      console.log("simplesPersonales normalized:", simplesPersonalesNormalized); // 👈 log normalizado
      
      setDisponibles([
        ...toArray(normalesDisponibles).map((s: Survey) => ({ ...s, tipo: "normal" })),
      ]);

      setVotadas([
        ...toArray(normalesVotadas).map((s: Survey) => ({ ...s, tipo: "normal" })),
        ...toArray(simplesVotadas).map(normalizeSimple),   // 👈 simples votadas
      ]);

      setFinalizadas([
        ...toArray(normalesFinalizadas).map((s: Survey) => ({ ...s, tipo: "normal" })),
        ...toArray(simplesFinalizadas).map(normalizeSimple), // 👈 simples expiradas
      ]);

      setPersonales(
        toArray(simplesPersonales)
          .map(normalizeSimple)
      );


    } catch (err) {
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
    } catch {
      console.log("Error refrescando perfil");
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        await refreshSurveys();
        await refreshProfile();
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

  return (
  <Tab.Navigator
    screenOptions={{
      tabBarActiveTintColor: "#111827",
      tabBarInactiveTintColor: "#6B7280",
      tabBarLabelStyle: { fontSize: 10, fontWeight: "500" },
      tabBarIndicatorStyle: { backgroundColor: "#2563EB", height: 3 },
      tabBarStyle: {
        backgroundColor: "#F9FAFB",
        borderRadius: 8,
        marginHorizontal: 4,
        marginTop: 4,
      },
    }}
  >
    <Tab.Screen
      name="Globales"
      options={{
        tabBarLabel: "Globales",
        tabBarIcon: ({ color }: { color: string }) => (
          <FontAwesome name="globe" size={22} color={color} />
        ),
      }}
    >
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

    <Tab.Screen
      name="Personales"
      options={{
        tabBarLabel: "Personales",
        tabBarIcon: ({ color }: { color: string }) => (
          <FontAwesome name="users" size={22} color={color} />
        ),
      }}
    >
      {() => (
        <PersonalesScreen
          surveys={personales}
          globalMuted={globalMuted}
          toggleMute={toggleMute}
          refreshSurveys={refreshSurveys} // 👈 añadido para evitar el error
        />
      )}
    </Tab.Screen>

    <Tab.Screen
      name="Completadas"
      options={{
        tabBarLabel: "Completadas",
        tabBarIcon: ({ color }: { color: string }) => (
          <FontAwesome name="check-circle" size={22} color={color} />
        ),
      }}
    >
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

    <Tab.Screen
      name="Finalizadas"
      options={{
        tabBarLabel: "Finalizadas",
        tabBarIcon: ({ color }: { color: string }) => (
          <FontAwesome name="flag-checkered" size={22} color={color} />
        ),
      }}
    >
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
      <Tab.Screen
        name="Historial"
        options={{
          tabBarLabel: "Historial",
          tabBarIcon: ({ color }: { color: string }) => (
            <FontAwesome name="book" size={22} color={color} />
          ),
        }}
      >
        {() => <SurveyHistory />}
      </Tab.Screen>
    )}
  </Tab.Navigator>
  );
}
