import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "@expo/vector-icons/Ionicons";

import SurveysScreen from "./SurveysScreen";
import ProfileScreen from "./ProfileScreen";

// 👇 define los nombres de tus tabs
type TabParamList = {
  SurveysScreen: undefined;
  ProfileScreen: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({
        route,
      }: {
        route: { name: keyof TabParamList };
      }) => ({
        tabBarIcon: ({
          color,
          size,
        }: {
          color: string;
          size: number;
        }) => {
          const icons: Record<keyof TabParamList, keyof typeof Ionicons.glyphMap> = {
            SurveysScreen: "list",
            ProfileScreen: "person",
          };

          return (
            <Ionicons
              name={icons[route.name]} // 👈 ahora route.name está tipado
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="SurveysScreen"
        component={SurveysScreen}
        options={{ title: "Encuestas" }}
      />
      <Tab.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{ title: "Perfil" }}
      />
    </Tab.Navigator>
  );
}