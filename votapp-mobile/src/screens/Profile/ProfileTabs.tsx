// src/screens/Profile/ProfileTabs.tsx

import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import SimpleSurveyGrid from "../../components/SimpleSurveyGrid";
import SurveyHistoryList from "../../components/SurveyHistoryList";
import WalletHistoryList from "../../components/WalletHistoryList";

const Tab = createMaterialTopTabNavigator();

export default function ProfileTabs({ profile }: any) {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#2563EB",
        tabBarInactiveTintColor: "#555",
        tabBarIndicatorStyle: { backgroundColor: "#2563EB", height: 3 },
        tabBarLabelStyle: { fontWeight: "600", fontSize: 12, marginTop: -4 }, // 👈 acerca texto al icono
        tabBarIconStyle: { marginBottom: -2 }, // 👈 acerca icono al texto
        tabBarStyle: { backgroundColor: "#F3F4F6", height: 60 },
        tabBarShowIcon: true,
      }}
    >
      <Tab.Screen
        name="MisEncuestas"
        options={{
          title: "Mis Encuestas",
          tabBarIcon: ({ color }: { color: string }) => (
            <MaterialCommunityIcons name="account-check-outline" color={color} size={20} />
          ),
        }}
      >
        {() => <SimpleSurveyGrid />}
      </Tab.Screen>

      <Tab.Screen
        name="Patrocinadas"
        options={{
          title: "Patrocinadas",
          tabBarIcon: ({ color }: { color: string }) => (
            <MaterialCommunityIcons name="hand-coin-outline" color={color} size={20} />
          ),
        }}
      >
        {() => <WalletHistoryList />}
      </Tab.Screen>

      <Tab.Screen
        name="Generales"
        options={{
          title: "Generales",
          tabBarIcon: ({ color }: { color: string }) => (
            <MaterialCommunityIcons name="clipboard-check-outline" color={color} size={20} />
          ),
        }}
      >
        {() => <SurveyHistoryList />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}