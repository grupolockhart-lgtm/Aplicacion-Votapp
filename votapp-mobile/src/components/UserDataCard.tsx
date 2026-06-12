// src/components/UserDataCard.tsx
import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";
import { useSurveyContext } from "../context/SurveyContext";
import { useUserData } from "../screens/Profile/hooks/useUserData";

interface Props {
  API_URL: string;
}

const UserDataCard: React.FC<Props> = ({ API_URL }) => {
  const { profile, refreshProfile } = useSurveyContext();
  const { saveUserData } = useUserData(API_URL, refreshProfile, () => {});

  // Estados locales inicializados con datos del perfil
  const [telefonoMovil, setTelefonoMovil] = useState(profile?.telefono_movil || "");
  const [ciudad, setCiudad] = useState(profile?.ciudad || "");
  const [estadoCivil, setEstadoCivil] = useState(profile?.estado_civil || "");
  const [nivelEducativo, setNivelEducativo] = useState(profile?.nivel_educativo || "");
  const [profesion, setProfesion] = useState(profile?.profesion || "");
  const [ocupacion, setOcupacion] = useState(profile?.ocupacion || "");
  const [religion, setReligion] = useState(profile?.religion || "");

  // Payload completo
  const payload = {
    telefono_movil: telefonoMovil,
    ciudad,
    estado_civil: estadoCivil,
    nivel_educativo: nivelEducativo,
    profesion,
    ocupacion,
    religion,
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Datos del Usuario</Text>

      <TextInput value={telefonoMovil} onChangeText={setTelefonoMovil} placeholder="Teléfono" />
      <TextInput value={ciudad} onChangeText={setCiudad} placeholder="Ciudad" />
      <TextInput value={estadoCivil} onChangeText={setEstadoCivil} placeholder="Estado Civil" />
      <TextInput value={nivelEducativo} onChangeText={setNivelEducativo} placeholder="Nivel Educativo" />
      <TextInput value={profesion} onChangeText={setProfesion} placeholder="Profesión" />
      <TextInput value={ocupacion} onChangeText={setOcupacion} placeholder="Ocupación" />
      <TextInput value={religion} onChangeText={setReligion} placeholder="Religión" />

      <Button title="Guardar" onPress={() => saveUserData(payload)} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: { padding: 16, backgroundColor: "#fff", borderRadius: 8, marginBottom: 16 },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
});

export default UserDataCard;
