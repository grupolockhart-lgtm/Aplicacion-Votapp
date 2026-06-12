import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,   // 👈 Importamos Dimensions
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config/api";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../Types/Navigation";

const { width } = Dimensions.get("window"); // 👈 obtenemos ancho de pantalla

type LoginScreenNavProp = NativeStackNavigationProp<
  RootStackParamList,
  "LoginScreen"
>;

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<LoginScreenNavProp>();

  const validarFormulario = (): string | null => {
    if (!email.trim() || !password.trim())
      return "Por favor ingresa email y contraseña";
    if (!/\S+@\S+\.\S+/.test(email)) return "El correo no tiene un formato válido";
    if (password.length < 6) return "La contraseña debe tener al menos 6 caracteres";
    return null;
  };

const handleLogin = async () => {
  const errorMsg = validarFormulario();
  if (errorMsg) {
    Alert.alert("❌ Error de validación", errorMsg);
    return;
  }

  if (loading) return;
  setLoading(true);

  try {
    const body = new URLSearchParams();
    body.append("username", email);
    body.append("password", password);

    const res = await fetch(`${API_URL}/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!res.ok) {
      let errMsg = "Error al iniciar sesión";
      try {
        const err = await res.json();
        errMsg = err.detail || errMsg;
      } catch {
        errMsg = `Error ${res.status}`;
      }
      throw new Error(errMsg);
    }

    const data = await res.json();
    await AsyncStorage.setItem("userToken", data.access_token);

    Alert.alert("✅ Bienvenido", "Inicio de sesión exitoso");
    // 👇 cambio aquí
    navigation.replace("MainTabs", { screen: "SurveysScreen" });
  } catch (err: any) {
    console.error("❌ Error en login:", err);
    const msg = err?.message || "No se pudo iniciar sesión";
    Alert.alert("Error", msg);
  } finally {
    setLoading(false);
  }
};



  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        {/* 👇 Logo arriba del formulario */}
        <Image
          source={require("../../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>Iniciar sesión</Text>

        <Text style={styles.label}>Correo electrónico</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {loading ? (
          <ActivityIndicator size="large" color="#3B82F6" />
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Entrar</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate("RegisterScreen")}
        >
          <Text style={styles.linkText}>¿No tienes cuenta? Regístrate</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f9f9f9",
  },
  logo: {
    width: width * 0.6,   // 👈 ocupa el 60% del ancho de pantalla
    height: width * 0.6,  // 👈 mantiene proporción cuadrada
    alignSelf: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#3B82F6",
  },
  label: {
    fontWeight: "600",
    marginBottom: 4,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#3B82F6",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  linkButton: {
    marginTop: 15,
    alignItems: "center",
  },
  linkText: {
    color: "#3B82F6",
    fontSize: 14,
    fontWeight: "600",
  },
});