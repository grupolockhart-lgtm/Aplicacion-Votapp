

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import ModalSelector from "react-native-modal-selector";
import {
  nacionalidades,
  religiones,
  nivelesEducativos,
  sexos,
  ciudades,
  ocupaciones,
  profesiones,
} from "../config/options";
import { useNavigation } from "@react-navigation/native";

interface FormData {
  nombre: string;
  apellido: string;
  correo: string;
  contraseña: string;
  confirmarContraseña: string;   // 👈 nuevo
  cedula: string;             // 👈 nuevo
  telefono_movil: string;     // 👈 nuevo
  sexo: string;
  fecha_nacimiento: Date;
  nacionalidad: string;
  nivel_educativo: string;
  profesion: string;
  ocupacion: string;
  religion: string;
  ciudad: string;
  estado_civil: string;       // 👈 nuevo
}


import { API_URL } from "../config/api";


export default function RegisterScreen() {
  const navigation = useNavigation();

  const [form, setForm] = useState<FormData>({
  nombre: "",
  apellido: "",
  correo: "",
  contraseña: "",
  confirmarContraseña: "",   // 👈 nuevo
  cedula: "",                // 👈 nuevo
  telefono_movil: "",        // 👈 nuevo
  sexo: sexos[0],
  fecha_nacimiento: new Date(),
  nacionalidad: nacionalidades[0],
  nivel_educativo: nivelesEducativos[0],
  profesion: "",
  ocupacion: ocupaciones[0],
  religion: religiones[0],
  ciudad: ciudades[0],
  estado_civil: "Soltero",   // 👈 nuevo (puedes usar un selector)
});



  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof FormData, value: any) => {
    setForm({ ...form, [field]: value });
  };

  const validarFormulario = (): string | null => {
    if (!form.nombre.trim()) return "El nombre es obligatorio";
    if (!form.apellido.trim()) return "El apellido es obligatorio";
    if (!form.correo.trim()) return "El correo es obligatorio";
    if (!/\S+@\S+\.\S+/.test(form.correo))
      return "El correo no tiene un formato válido";
    if (!form.contraseña.trim()) return "La contraseña es obligatoria";
    if (form.contraseña !== form.confirmarContraseña)
      return "Las contraseñas no coinciden";   // 👈 validación nueva
    return null;
  };

  const handleRegister = async () => {
    const errorMsg = validarFormulario();
    if (errorMsg) {
      Alert.alert("❌ Error de validación", errorMsg);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          fecha_nacimiento: form.fecha_nacimiento.toISOString().split("T")[0],
        }),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert("✅ Registro exitoso", data.mensaje || "Usuario registrado");
        navigation.navigate("LoginScreen");
      } else {
        Alert.alert("❌ Error", data.detail || "No se pudo registrar");
      }
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : String(error);
      Alert.alert("⚠️ Error de conexión", mensaje);
    } finally {
      setLoading(false);
    }
  };





return (
  <KeyboardAvoidingView
    behavior={Platform.OS === "ios" ? "padding" : undefined}
    style={{ flex: 1 }}
  >
    <ScrollView
      contentContainerStyle={styles.formContainer}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={true}
    >



      {/* Sección: Datos personales */}
      <Text style={styles.sectionTitle}>Datos personales</Text>
      <Text style={styles.label}>Nombre</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre"
        value={form.nombre}
        onChangeText={(v) => handleChange("nombre", v)}
      />

      <Text style={styles.label}>Apellido</Text>
      <TextInput
        style={styles.input}
        placeholder="Apellido"
        value={form.apellido}
        onChangeText={(v) => handleChange("apellido", v)}
      />

      <Text style={styles.label}>Correo electrónico</Text>
      <TextInput
        style={styles.input}
        placeholder="Correo"
        value={form.correo}
        onChangeText={(v) => handleChange("correo", v.toLowerCase())} // 👈 convierte todo a minúsculas
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Text style={styles.label}>Contraseña</Text>
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        secureTextEntry
        value={form.contraseña}
        onChangeText={(v) => handleChange("contraseña", v)}
      />

      // -------------------
      // Confirmación de contraseña
      // -------------------

      <Text style={styles.label}>Confirmar contraseña</Text>
      <TextInput
        style={styles.input}
        placeholder="Confirmar contraseña"
        secureTextEntry
        value={form.confirmarContraseña}
        onChangeText={(v) => handleChange("confirmarContraseña", v)}
      />


      <Text style={styles.label}>Cédula</Text>
      <TextInput
        style={styles.input}
        placeholder="Cédula"
        value={form.cedula}
        onChangeText={(v) => handleChange("cedula", v)}
      />

      <Text style={styles.label}>Teléfono móvil</Text>
      <TextInput
        style={styles.input}
        placeholder="Teléfono móvil"
        keyboardType="phone-pad"
        value={form.telefono_movil}
        onChangeText={(v) => handleChange("telefono_movil", v)}
      />

      

      {/* Sección: Información demográfica */}
      <Text style={styles.sectionTitle}>Información demográfica</Text>
      <Text style={styles.label}>Sexo</Text>
      <ModalSelector
        data={sexos.map((s, i) => ({ key: i, label: s }))}
        initValue="Selecciona tu sexo"
        onChange={(option) => handleChange("sexo", option.label)}
      >
        <TextInput style={styles.input} editable={false} value={form.sexo} />
      </ModalSelector>

      <Text style={styles.label}>Estado civil</Text>
      <ModalSelector
        data={["Soltero", "Casado", "Divorciado", "Viudo"].map((e, i) => ({ key: i, label: e }))}
        initValue="Selecciona tu estado civil"
        onChange={(option) => handleChange("estado_civil", option.label)}
      >
        <TextInput style={styles.input} editable={false} value={form.estado_civil} />
      </ModalSelector>


      // -------------------
      // Fecha de nacimiento
      // -------------------

      <Text style={styles.label}>Fecha de nacimiento</Text>
      <Button title="Seleccionar fecha" onPress={() => setShowDatePicker(true)} />

      {showDatePicker && (
        <View style={{ marginVertical: 10 }}>
          <DateTimePicker
            value={form.fecha_nacimiento}
            mode="date"
            display={Platform.OS === "ios" ? "inline" : "spinner"}
            onChange={(event, date) => {
              if (Platform.OS === "ios") {
                if (date) handleChange("fecha_nacimiento", date);
              } else {
                if (event.type === "set" && date) {
                  handleChange("fecha_nacimiento", date);
                  setShowDatePicker(false);
                } else if (event.type === "dismissed") {
                  setShowDatePicker(false);
                }
              }
            }}
          />

          {Platform.OS === "ios" && (
            <TouchableOpacity
              style={{
                backgroundColor: "#2563EB",
                padding: 8,
                borderRadius: 6,
                marginTop: 6,
                alignItems: "center",
              }}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>Cerrar selector</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <Text style={styles.dateText}>
        {form.fecha_nacimiento.toLocaleDateString()}
      </Text>



      <Text style={styles.label}>Nacionalidad</Text>
      <ModalSelector
        data={nacionalidades.map((n, i) => ({ key: i, label: n }))}
        initValue="Selecciona tu nacionalidad"
        onChange={(option) => handleChange("nacionalidad", option.label)}
      >
        <TextInput style={styles.input} editable={false} value={form.nacionalidad} />
      </ModalSelector>

      <Text style={styles.label}>Ciudad</Text>
      <ModalSelector
        data={ciudades.map((c, i) => ({ key: i, label: c }))}
        initValue="Selecciona tu ciudad"
        onChange={(option) => handleChange("ciudad", option.label)}
      >
        <TextInput style={styles.input} editable={false} value={form.ciudad} />
      </ModalSelector>



      {/* Sección: Formación y ocupación */}
      <Text style={styles.sectionTitle}>Formación y ocupación</Text>
      <Text style={styles.label}>Nivel educativo</Text>
      <ModalSelector
        data={nivelesEducativos.map((n, i) => ({ key: i, label: n }))}
        initValue="Selecciona tu nivel educativo"
        onChange={(option) => handleChange("nivel_educativo", option.label)}
      >
        <TextInput style={styles.input} editable={false} value={form.nivel_educativo} />
      </ModalSelector>

      <Text style={styles.label}>Profesión</Text>
      <ModalSelector
        data={profesiones.map((p, i) => ({ key: i, label: p }))}
        initValue="Selecciona tu profesión"
        onChange={(option) => handleChange("profesion", option.label)}
      >
        <TextInput style={styles.input} editable={false} value={form.profesion} />
      </ModalSelector>

      <Text style={styles.label}>Ocupación</Text>
      <ModalSelector
        data={ocupaciones.map((o, i) => ({ key: i, label: o }))}
        initValue="Selecciona tu ocupación"
        onChange={(option) => handleChange("ocupacion", option.label)}
      >
        <TextInput style={styles.input} editable={false} value={form.ocupacion} />
      </ModalSelector>



      {/* Sección: Preferencias */}
      <Text style={styles.sectionTitle}>Preferencias</Text>
      <Text style={styles.label}>Religión</Text>
      <ModalSelector
        data={religiones.map((r, i) => ({ key: i, label: r }))}
        initValue="Selecciona tu religión"
        onChange={(option) => handleChange("religion", option.label)}
      >
        <TextInput style={styles.input} editable={false} value={form.religion} />
      </ModalSelector>

      {/* Botón */}
      {loading ? (
        <ActivityIndicator size="large" color="#0066cc" />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Registrarse</Text>
        </TouchableOpacity>
      )}

    </ScrollView>
  </KeyboardAvoidingView>

);
}

const styles = StyleSheet.create({
  formContainer: {
    padding: 20,
    paddingBottom: 60,
    backgroundColor: "#f9f9f9",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 10,
    color: "#3B82F6",
  },
  label: {
    fontWeight: "600",
    marginTop: 6,
    marginBottom: 2,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  dateText: {
    marginBottom: 8,
    color: "#555",
  },
  button: {
    backgroundColor: "#3B82F6",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

