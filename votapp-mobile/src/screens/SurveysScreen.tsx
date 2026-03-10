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

// Normal
interface Survey {
  id: number;
  title: string;
  description?: string;
  fecha_expiracion?: string;
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
  tipo?: "normal"; // separador
}

// Simple
interface SurveySimple {
  id: number;
  titulo: string;
  opciones: { id: number; texto: string; votos: number }[];
  imagenes?: string[];
  videos?: string[];
  fecha_expiracion?: string;
  estado?: string;
  tipo?: "simple"; // separador
}

// Unión
export type UnifiedSurvey = Survey | SurveySimple;

const Tab = createMaterialTopTabNavigator();

export default function SurveysScreen() {
  const [disponibles, setDisponibles] = useState<UnifiedSurvey[]>([]);
  const [votadas, setVotadas] = useState<UnifiedSurvey[]>([]);
  const [finalizadas, setFinalizadas] = useState<UnifiedSurvey[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [globalMuted, setGlobalMuted] = useState<boolean>(true);

  const [userRole, setUserRole] = useState<string | null>(null);

  const toggleMute = () => setGlobalMuted((prev) => !prev);

  // -------------------
  // Refrescar encuestas normales + simples
  // -------------------
  const refreshSurveys = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };

      const [
        resDisponibles,
        resVotadas,
        resFinalizadas,
        resDisponiblesSimples,
        resVotadasSimples,
        resFinalizadasSimples,
      ] = await Promise.all([
        fetch(`${API_URL}/surveys/disponibles`, { headers }),
        fetch(`${API_URL}/surveys/votadas`, { headers }),
        fetch(`${API_URL}/surveys/finalizadas`, { headers }),
        fetch(`${API_URL}/surveys/simple/disponibles`, { headers }),
        fetch(`${API_URL}/surveys/simple/votadas`, { headers }),
        fetch(`${API_URL}/surveys/simple/finalizadas`, { headers }),
      ]);

      const normalesDisponibles = await resDisponibles.json();
      const normalesVotadas = await resVotadas.json();
      const normalesFinalizadas = await resFinalizadas.json();

      const simplesDisponibles = await resDisponiblesSimples.json();
      const simplesVotadas = await resVotadasSimples.json();
      const simplesFinalizadas = await resFinalizadasSimples.json();

      // Fusionar normales + simples
      setDisponibles([
        ...(normalesDisponibles.results || normalesDisponibles || []).map((s: Survey) => ({ ...s, tipo: "normal" })),
        ...(simplesDisponibles || []).map((s: SurveySimple) => ({ ...s, tipo: "simple" })),
      ]);

      setVotadas([
        ...(normalesVotadas.results || normalesVotadas || []).map((s: Survey) => ({ ...s, tipo: "normal" })),
        ...(simplesVotadas || []).map((s: SurveySimple) => ({ ...s, tipo: "simple" })),
      ]);

      setFinalizadas([
        ...(normalesFinalizadas.results || normalesFinalizadas || []).map((s: Survey) => ({ ...s, tipo: "normal" })),
        ...(simplesFinalizadas || []).map((s: SurveySimple) => ({ ...s, tipo: "simple" })),
      ]);
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
            userRole={userRole!}
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