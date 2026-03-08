import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "@expo/vector-icons/Ionicons";
import { TouchableOpacity } from "react-native";

import SurveysScreen from "./SurveysScreen";
import ProfileScreen from "./ProfileScreen";
import SurveySimpleCrearScreen from "./SurveySimpleCrearScreen";

type TabParamList = {
  SurveysScreen: undefined;
  CrearEncuesta: undefined;
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
            CrearEncuesta: "add-circle",
            ProfileScreen: "person",
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="SurveysScreen"
        component={SurveysScreen}
        options={{ title: "Encuestas" }}
      />

      {/* -------------------
          Botón central "+"
          ------------------- */}
      <Tab.Screen
        name="CrearEncuesta"
        component={SurveySimpleCrearScreen}
        options={{
          title: "",
          tabBarButton: (props: any) => (
            <TouchableOpacity {...props} style={{ top: -10 }}>
              <Ionicons name="add-circle" size={60} color="#007AFF" />
            </TouchableOpacity>
          ),
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

