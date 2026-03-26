// src/screens/Profile/ProfileTabs.tsx

import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";

// Importa tus componentes de cada sección
import SimpleSurveyGrid from "../../components/SimpleSurveyGrid";
import BilleteraTab from "./BilleteraTab";
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
        options={{ title: "Mis Encuestas" }}   // 👈 título actualizado
      >
        {() => (
          <SimpleSurveyGrid />   // 👈 sin ScrollView alrededor
        )}
      </Tab.Screen>

      {/* Billetera */}
      <Tab.Screen name="Billetera" component={BilleteraTab} />

      {/* Historial de encuestas */}
      <Tab.Screen
        name="HistorialEncuestas"
        options={{ title: "Historial" }}
      >
        {() => (
          <SurveyHistoryList />   // 👈 sin ScrollView
        )}
      </Tab.Screen>

      {/* Movimientos de billetera */}
      <Tab.Screen
        name="HistorialBilletera"
        options={{ title: "Movimientos" }}
      >
        {() => (
          <WalletHistoryList />   // 👈 sin ScrollView
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}