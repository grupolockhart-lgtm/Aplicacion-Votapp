import React, { useEffect, useState } from "react";
import {
  createBottomTabNavigator,
  BottomTabNavigationOptions,
} from "@react-navigation/bottom-tabs";
import Ionicons from "@expo/vector-icons/Ionicons";

import SurveysScreen from "./SurveysScreen";
import ProfileScreen from "./ProfileScreen";
import SurveySimpleCrearScreen from "./SurveySimpleCrearScreen";
import FriendsScreen from "../screens/FriendsScreen";
import NotificationsScreen from "../screens/NotificationsScreen";

type TabParamList = {
  SurveysScreen: undefined;
  CrearEncuesta: undefined;
  ProfileScreen: undefined;
  FriendsScreen: undefined;
  NotificationsScreen: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export default function MainTabs() {
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // 🔔 Función para cargar el número de notificaciones no leídas
  const fetchUnreadCount = async () => {
    try {
      const res = await fetch(
        "https://aplicacion-votapp-test.onrender.com/api/notifications/unread_count?user_id=1"
      );
      const data = await res.json();
      setUnreadCount(data.unread_count);
    } catch (err) {
      console.error("Error al cargar notificaciones:", err);
    }
  };

  // 🚀 useEffect con intervalo de refresco cada 30 segundos
  useEffect(() => {
    fetchUnreadCount(); // primera carga inmediata
    const interval = setInterval(fetchUnreadCount, 30000); // refresca cada 30s
    return () => clearInterval(interval); // limpia el intervalo al desmontar
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({
        route,
      }: {
        route: { name: keyof TabParamList };
      }): BottomTabNavigationOptions => ({
        tabBarIcon: ({
          color,
          size,
        }: {
          color: string;
          size: number;
        }) => {
          const icons: Record<
            keyof TabParamList,
            keyof typeof Ionicons.glyphMap
          > = {
            SurveysScreen: "list",
            CrearEncuesta: "add-circle",
            ProfileScreen: "person",
            FriendsScreen: "people",
            NotificationsScreen: "notifications",
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
        tabBarShowLabel: true,
      })}
    >
      <Tab.Screen
        name="SurveysScreen"
        component={SurveysScreen}
        options={{ title: "Encuestas" }}
      />
      <Tab.Screen
        name="CrearEncuesta"
        component={SurveySimpleCrearScreen}
        options={{ title: "Crear" }}
      />
      <Tab.Screen
        name="FriendsScreen"
        component={FriendsScreen}
        options={{ title: "Amigos" }}
      />
      <Tab.Screen
        name="NotificationsScreen"
        component={NotificationsScreen}
        options={{
          title: "Notificaciones",
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined, // 👈 badge dinámico
        }}
      />
      <Tab.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{ title: "Perfil" }}
      />
    </Tab.Navigator>
  );
}