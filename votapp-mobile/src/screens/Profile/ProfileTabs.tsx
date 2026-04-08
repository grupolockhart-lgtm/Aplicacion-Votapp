// src/screens/Profile/ProfileTabs.tsx

import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";

// Importa tus componentes de cada sección
import SimpleSurveyGrid from "../../components/SimpleSurveyGrid";
import SurveyHistoryList from "../../components/SurveyHistoryList";
import WalletHistoryList from "../../components/WalletHistoryList";

const Tab = createMaterialTopTabNavigator();

export default function ProfileTabs({ profile }: any) {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#2563EB", // azul activo
        tabBarInactiveTintColor: "#555",  // gris inactivo
        tabBarIndicatorStyle: { backgroundColor: "#2563EB", height: 3 },
        tabBarLabelStyle: { fontWeight: "600", fontSize: 14 },
        tabBarStyle: { backgroundColor: "#F3F4F6", height: 50 },
      }}
    >
      {/* Encuestas */}
      <Tab.Screen
        name="Encuestas"
        options={{ title: "Mis Encuestas" }}
      >
        {() => (
          <SimpleSurveyGrid />   // 👈 listado de encuestas propias/participadas
        )}
      </Tab.Screen>

      {/* Historial de encuestas */}
      <Tab.Screen
        name="HistorialEncuestas"
        options={{ title: "Historial" }}
      >
        {() => (
          <SurveyHistoryList />   // 👈 historial general de encuestas
        )}
      </Tab.Screen>

      {/* Historial de encuestas patrocinadas */}
      <Tab.Screen
        name="HistorialPatrocinadas"
        options={{ title: "Patrocinadas" }}   // 👈 nuevo título más claro
      >
        {() => (
          <WalletHistoryList />   // 👈 listado de encuestas patrocinadas realizadas
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}