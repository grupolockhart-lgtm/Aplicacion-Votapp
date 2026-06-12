import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Ionicons from "@expo/vector-icons/Ionicons";

import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import SurveysScreen from "./src/screens/SurveysScreen";
import VoteScreen from "./src/screens/VoteScreen";
import ResultsScreen from "./src/screens/ResultsScreen";
import SurveyCommentsScreen from "./src/screens/SurveyCommentsScreen";
import TestChart from "./src/screens/TestChart";
import ProfileScreen from "./src/screens/ProfileScreen";
import LogoutScreen from "./src/screens/LogoutScreen";
import WalletHistoryScreen from "./src/screens/WalletHistoryScreen";
import SurveyHistory from "./src/screens/SurveyHistory";
import SurveyHistoryScreen from "./src/screens/SurveyHistoryScreen";
import SurveySimpleCrearScreen from "./src/screens/SurveySimpleCrearScreen";
import SurveySimplePreviewScreen from "./src/screens/SurveySimplePreviewScreen";
import FriendsScreen from "./src/screens/FriendsScreen";
import NotificationsScreen from "./src/screens/NotificationsScreen";
import FriendProfileScreen from "./src/screens/FriendProfileScreen"; // 👈 importado
import { FriendsProvider } from "./src/context/FriendsContext"; // 👈 importa el provider


import type { RootStackParamList } from "./src/Types/Navigation";

// 👇 importa el provider
import SurveyProvider from "./src/context/SurveyProvider";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      id="MainTabs"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            SurveysScreen: "list",
            CrearEncuesta: "add-circle",
            ProfileScreen: "person",
            FriendsScreen: "people",
            NotificationsScreen: "notifications",
          };

          return (
            <Ionicons
              name={icons[route.name] || "ellipse"}
              size={size}
              color={color}
            />
          );
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
        options={{ title: "Notificaciones" }}
      />
      <Tab.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{ title: "Perfil" }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      {/* 👇 envuelve todo con SurveyProvider y FriendsProvider */}
      <SurveyProvider>
        <FriendsProvider>
          <NavigationContainer>
            <Stack.Navigator id="RootStack" initialRouteName="LoginScreen">
              <Stack.Screen
                name="LoginScreen"
                component={LoginScreen}
                options={{ title: "Iniciar sesión" }}
              />
              <Stack.Screen
                name="RegisterScreen"
                component={RegisterScreen}
                options={{ title: "Registrarse" }}
              />
              <Stack.Screen
                name="MainTabs"
                component={MainTabs}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="VoteScreen"
                component={VoteScreen}
                options={{ title: "Votar" }}
              />
              <Stack.Screen
                name="ResultsScreen"
                component={ResultsScreen}
                options={{ title: "Resultados" }}
              />
              <Stack.Screen
                name="SurveyCommentsScreen"
                component={SurveyCommentsScreen}
                options={{ title: "Comentarios" }}
              />
              <Stack.Screen
                name="SurveyHistory"
                component={SurveyHistory}
                options={{ title: "Historial de encuesta" }}
              />
              <Stack.Screen
                name="SurveyHistoryScreen"
                component={SurveyHistoryScreen}
                options={{ title: "Historial completo de encuestas" }}
              />
              <Stack.Screen
                name="TestChart"
                component={TestChart}
                options={{ title: "Gráfico de prueba" }}
              />
              <Stack.Screen
                name="LogoutScreen"
                component={LogoutScreen}
                options={{ title: "Cerrar sesión" }}
              />
              <Stack.Screen
                name="WalletHistoryScreen"
                component={WalletHistoryScreen}
                options={{ title: "Historial de billetera" }}
              />
              <Stack.Screen
                name="SurveySimplePreviewScreen"
                component={SurveySimplePreviewScreen}
                options={{ title: "Previsualización" }}
              />
              <Stack.Screen
                name="FriendProfileScreen"
                component={FriendProfileScreen}
                options={{ title: "Perfil de amigo" }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </FriendsProvider>
      </SurveyProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});