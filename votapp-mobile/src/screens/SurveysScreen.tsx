// src/screens/SurveysScreen.tsx
import React, { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, Text, View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config/api";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";

import DisponiblesScreen from "@/screens/DisponiblesScreen";
import VotadasScreen from "@/screens/VotadasScreen";
import FinalizadasScreen from "@/screens/FinalizadasScreen";
import ResultsScreen from "@/screens/ResultsScreen";
import SurveyHistory from "@/screens/SurveyHistory";





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

interface Survey {
  id: number;
  title: string;
  description?: string;
  fecha_expiracion?: string;
  segundos_restantes?: number;
  questions: Question[];
  media_url?: string;
  media_urls?: string[];
  media_type?: "native" | "webview";   // ✅ añadido aquí
  patrocinada?: boolean;
  patrocinador?: string;
  es_patrocinada?: boolean;
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

  const refreshSurveys = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };

      const [resDisponibles, resVotadas, resFinalizadas] = await Promise.all([
        fetch(`${API_URL}/surveys/disponibles`, { method: "GET", headers }),
        fetch(`${API_URL}/surveys/votadas`, { method: "GET", headers }),
        fetch(`${API_URL}/surveys/finalizadas`, { method: "GET", headers }),
      ]);

      const dataDisponibles = await resDisponibles.json();
      const dataVotadas = await resVotadas.json();
      const dataFinalizadas = await resFinalizadas.json();

      setDisponibles(dataDisponibles.results || dataDisponibles || []);
      setVotadas(dataVotadas.results || dataVotadas || []);
      setFinalizadas(dataFinalizadas.results || dataFinalizadas || []);
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

