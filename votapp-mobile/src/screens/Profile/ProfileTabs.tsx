// src/screens/Profile/ProfileTabs.tsx

import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import SimpleSurveyGrid from "../../components/SimpleSurveyGrid";
import SurveyHistoryList from "../../components/SurveyHistoryList";
import WalletHistoryList from "../../components/WalletHistoryList";

const Tab = createMaterialTopTabNavigator();

type ProfileTabsProps = {
  profile: any;
  friendMode?: boolean;
  friendId?: number;
  refreshGamificacion?: boolean; // ✅ ahora es boolean
};

export default function ProfileTabs({ profile, friendMode = false, friendId, refreshGamificacion, }: ProfileTabsProps) {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#2563EB",
        tabBarInactiveTintColor: "#555",
        tabBarIndicatorStyle: { backgroundColor: "#2563EB", height: 3 },
        tabBarLabelStyle: { fontWeight: "600", fontSize: 12, marginTop: -4 },
        tabBarIconStyle: { marginBottom: -2 },
        tabBarStyle: { backgroundColor: "#F3F4F6", height: 60 },
        tabBarShowIcon: true,
      }}
    >
      {/* Siempre mostrar Mis Encuestas */}
      <Tab.Screen
        name="MisEncuestas"
        options={{
          title: "Mis Encuestas",
          tabBarIcon: ({ color }: { color: string }) => (
            <MaterialCommunityIcons name="account-check-outline" color={color} size={20} />
          ),
        }}
      >
        {() => <SimpleSurveyGrid userId={friendMode ? friendId : profile?.user?.id} />}
      </Tab.Screen>

      {/* Solo mostrar Patrocinadas y Generales si NO es modo amigo */}
      {!friendMode && (
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
      )}

      {!friendMode && (
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
      )}
    </Tab.Navigator>
  );
}
