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

import type { RootStackParamList } from "./src/Types/Navigation";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      id="MainTabs" // 👈 id único para el Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            SurveysScreen: "list",   // 📋
            ProfileScreen: "person", // 👤
          };

          return (
            <Ionicons
              name={icons[route.name] || "ellipse"}
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

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <NavigationContainer>
        <Stack.Navigator
          id="RootStack" // 👈 id único para el Stack.Navigator
          initialRouteName="LoginScreen"
        >
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
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});