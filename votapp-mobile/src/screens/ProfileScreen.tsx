// src/screens/ProfileScreen.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, ScrollView, Image,
  TouchableOpacity, TextInput, ActivityIndicator, Alert
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config/api";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { Picker } from '@react-native-picker/picker';
import ModalSelector from "react-native-modal-selector";
import SurveyHistoryList from "../components/SurveyHistoryList";
import GamificacionCard from "../components/GamificacionCard";

import {
  nacionalidades,
  religiones,
  nivelesEducativos,
  sexos,
  ciudades,
  ocupaciones,
  profesiones,
} from "../config/options";

export default function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [refreshGamificacion, setRefreshGamificacion] = useState(false);

  // Perfil público
  const [alias, setAlias] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Datos internos privados
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [correo, setCorreo] = useState("");
  const [cedula, setCedula] = useState("");
  const [sexo, setSexo] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [nacionalidad, setNacionalidad] = useState("");

  // Editables
  const [telefonoMovil, setTelefonoMovil] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [estadoCivil, setEstadoCivil] = useState("");
  const [nivelEducativo, setNivelEducativo] = useState("");
  const [profesion, setProfesion] = useState("");
  const [ocupacion, setOcupacion] = useState("");
  const [religion, setReligion] = useState("");

  // Control de edición
  const [editingUserData, setEditingUserData] = useState(false);
  const [editingPublicProfile, setEditingPublicProfile] = useState(false);

  const navigation = useNavigation();

  // ✅ Refrescar perfil desde backend
  const refreshProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;

      const res = await fetch(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || "Error al cargar perfil");

      setProfile(data);

      // Perfil público
      if (data.public_profile) {
        setAlias(data.public_profile.alias || "");
        setBio(data.public_profile.bio || "");
        setAvatarUrl(data.public_profile.avatar_url || "");
      }

      // Datos internos privados
      if (data.user) {
        setNombre(data.user.nombre || "");
        setApellido(data.user.apellido || "");
        setCorreo(data.user.correo || "");
        setCedula(data.user.cedula || "");
        setTelefonoMovil(data.user.telefono_movil || "");
        setSexo(data.user.sexo || "");
        setFechaNacimiento(data.user.fecha_nacimiento || "");
        setNacionalidad(data.user.nacionalidad || "");
        setCiudad(data.user.ciudad || "");
        setEstadoCivil(data.user.estado_civil || "");
        setNivelEducativo(data.user.nivel_educativo || "");
        setProfesion(data.user.profesion || "");
        setOcupacion(data.user.ocupacion || "");
        setReligion(data.user.religion || "");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "No se pudo cargar el perfil");
    }
  };

  // ✅ Cargar perfil al montar
  useEffect(() => {
    refreshProfile();
  }, []);

  // ✅ Refrescar perfil cada vez que la pantalla se enfoca
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      refreshProfile();
    });
    return unsubscribe;
  }, [navigation]);

  // ✅ Nueva función para refrescar gamificación
  const fetchGamificacion = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;
      const res = await fetch(`${API_URL}/gamificacion/estado`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      console.log("Gamificación actualizada:", data);
      setRefreshGamificacion(prev => !prev);
    } catch (err) {
      console.error("Error cargando gamificación:", err);
    }
  };

  // ✅ Refrescar gamificación cada vez que ProfileScreen recibe foco
  useFocusEffect(
    useCallback(() => {
      fetchGamificacion();
    }, [])
  );


// -----------------------------
// GUARDAR DATOS DEL USUARIO
// -----------------------------

const saveUserData = async () => {
  try {
    const token = await AsyncStorage.getItem("userToken");
    if (!token) return;

    const payload = {
      telefono_movil: telefonoMovil,
      ciudad,
      estado_civil: estadoCivil,
      nivel_educativo: nivelEducativo,
      profesion,
      ocupacion,
      religion,
    };

    console.log("Payload enviado a /users/me:", payload);

    const res = await fetch(`${API_URL}/users/me`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    // Consumimos la respuesta una sola vez
    const raw = await res.text();
    let data;
    try {
      data = JSON.parse(raw); // si es JSON válido
    } catch {
      data = { detail: raw }; // si es texto plano
    }

    if (!res.ok) {
      throw new Error(data?.detail || "Error al guardar datos");
    }

    console.log("Respuesta backend:", data);

    await refreshProfile();
    setEditingUserData(false); // cerrar edición

    Alert.alert("Éxito", "Datos del usuario actualizados correctamente");
  } catch (err: any) {
    Alert.alert("Error", err.message || "No se pudo guardar los datos");
  }
};







// -----------------------------
// GUARDAR PERFIL PÚBLICO (ahora también usa /users/me)
// -----------------------------
const savePublicProfile = async () => {
  try {
    const token = await AsyncStorage.getItem("userToken");
    if (!token) return;

    const payload = {
      alias,
      bio,
      avatar_url: avatarUrl && avatarUrl.trim() !== "" ? avatarUrl : undefined,
    };

    console.log("Payload enviado a /users/me (perfil público):", payload);

    const res = await fetch(`${API_URL}/users/me/public`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const updated = await res.json();
    if (!res.ok) throw new Error(updated?.detail || "Error al guardar perfil público");

    // Como /me devuelve el usuario completo, refrescamos todo el perfil
    await refreshProfile();
    setEditingPublicProfile(false); // 👈 cerrar edición de Perfil público

    Alert.alert("Éxito", "Perfil público actualizado correctamente");
  } catch (err: any) {
    Alert.alert("Error", err.message || "No se pudo guardar el perfil público");
  }
};


  // ✅ Función para elegir y subir foto desde galería
 const pickImage = async () => {
  const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permissionResult.granted) {
    alert("Se necesita permiso para acceder a la galería.");
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });

  if (!result.canceled) {
    const localUri = result.assets[0].uri;
    const filename = localUri.split("/").pop();
    const match = /\.(\w+)$/.exec(filename || "");
    const type = match ? `image/${match[1]}` : `image`;

    const formData = new FormData();
    formData.append("file", {
      uri: localUri,
      name: filename,
      type,
    } as any);

    const token = await AsyncStorage.getItem("userToken");
    const res = await fetch(`${API_URL}/users/upload/avatar`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await res.json();
    console.log("Respuesta backend avatar:", data);

    // Usa la propiedad correcta
    setAvatarUrl(data.avatar_url);

    // Actualiza el estado local
    setProfile((prev: any) => ({
      ...prev,
      public_profile: {
        ...prev.public_profile,
        avatar_url: data.avatar_url.startsWith("http")
          ? data.avatar_url
          : `${API_URL.replace("/api", "")}${data.avatar_url}`,
      },
    }));

    await refreshProfile();
  }
};

// -----------------------------
// VOTAR ENCUESTA
// -----------------------------
const votarEncuesta = async (id: number) => {
  try {
    const token = await AsyncStorage.getItem("userToken");
    console.log("Token recuperado:", token);
    if (!token) return;

    console.log("Enviando voto a encuesta con id:", id);

    const res = await fetch(`${API_URL}/surveys/${id}/vote`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        answers: [{ question_id: 1, option_id: 2 }], // ejemplo
      }),
    });

    console.log("Status de respuesta:", res.status);

    const data = await res.json();
    console.log("Respuesta voto (backend):", data);

    // 👇 refresca gamificación con los valores que devuelve el backend
    setProfile((prev: any) => {
      const nuevoPerfil = {
        ...prev,
        public_profile: {
          ...prev?.public_profile,
          puntos: data.usuario_puntos,
          nivel: data.usuario_nivel,
          racha_dias: data.usuario_racha,
        },
      };
      console.log("Perfil actualizado:", nuevoPerfil.public_profile);
      return nuevoPerfil;
    });

    // alterna el trigger para forzar re-render en GamificacionCard
    setRefreshGamificacion(prev => {
      const nuevoTrigger = !prev;
      console.log("Nuevo refreshTrigger:", nuevoTrigger);
      return nuevoTrigger;
    });

  } catch (err) {
    console.error("Error al votar:", err);
  }
};








  {/* ----------------------------- */}
  {/* LOADER / PERFIL */}
  {/* ----------------------------- */}


  if (!profile) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loading}>Cargando perfil...</Text>
      </View>
    );
  }

  const { user, public_profile, wallet } = profile;





  {/* ----------------------------- */}
  {/* RETURN PRINCIPAL */}
  {/* ----------------------------- */}

  return (
    <ScrollView style={styles.container}>
      
      {/* ----------------------------- */}
      {/* AVATAR */}
      {/* ----------------------------- */}

      <View style={styles.avatarContainer}>
        <Image
          source={{
            uri:
              public_profile?.avatar_url && public_profile.avatar_url.trim() !== ""
                ? public_profile.avatar_url
                : "https://cdn-icons-png.flaticon.com/512/149/149071.png",
          }}
          style={styles.avatar}
        />
        <TouchableOpacity style={styles.changePhotoButton} onPress={pickImage}>
          <Text style={styles.changePhotoText}>Cambiar foto</Text>
        </TouchableOpacity>
      </View>







{/* ----------------------------- */}
{/* DATOS DEL USUARIO */}
{/* ----------------------------- */}

<View style={styles.card}>
  <Text style={styles.title}>Datos del usuario</Text>

  {/* Campos no editables */}
  <Text style={styles.text}>Nombre: {nombre} {apellido}</Text>
  <Text style={styles.text}>Correo: {correo}</Text>
  <Text style={styles.text}>Cédula: {cedula}</Text>
  <Text style={styles.text}>
    Fecha de nacimiento: {fechaNacimiento 
      ? new Date(fechaNacimiento).toLocaleDateString() 
      : "No registrada"}
  </Text>
  <Text style={styles.text}>Sexo: {sexo || "No especificado"}</Text>
  <Text style={styles.text}>Nacionalidad: {nacionalidad || "No registrada"}</Text>

  {/* Campos editables */}
  {editingUserData && (

    <>
      <Text style={styles.label}>Teléfono móvil</Text>
      <TextInput
        style={styles.input}
        value={telefonoMovil}
        onChangeText={setTelefonoMovil}
        placeholder="Teléfono móvil"
        keyboardType="phone-pad"
      />



      <Text style={styles.label}>Ciudad</Text>
      <ModalSelector
        data={ciudades.map((c, i) => ({ key: i, label: c }))}
        initValue="Selecciona tu ciudad"
        onChange={(option) => setCiudad(option.label)}
      >
        <TextInput style={styles.input} editable={false} value={ciudad} />
      </ModalSelector>

      <Text style={styles.label}>Estado civil</Text>
      <ModalSelector
        data={["Soltero", "Casado", "Divorciado", "Viudo"].map((e, i) => ({ key: i, label: e }))}
        initValue="Selecciona tu estado civil"
        onChange={(option) => setEstadoCivil(option.label)}
      >
        <TextInput style={styles.input} editable={false} value={estadoCivil} />
      </ModalSelector>

      <Text style={styles.label}>Nivel educativo</Text>
      <ModalSelector
        data={nivelesEducativos.map((n, i) => ({ key: i, label: n }))}
        initValue="Selecciona tu nivel educativo"
        onChange={(option) => setNivelEducativo(option.label)}
      >
        <TextInput style={styles.input} editable={false} value={nivelEducativo} />
      </ModalSelector>

      <Text style={styles.label}>Profesión</Text>
      <ModalSelector
        data={profesiones.map((p, i) => ({ key: i, label: p }))}
        initValue="Selecciona tu profesión"
        onChange={(option) => setProfesion(option.label)}
      >
        <TextInput style={styles.input} editable={false} value={profesion} />
      </ModalSelector>

      <Text style={styles.label}>Ocupación</Text>
      <ModalSelector
        data={ocupaciones.map((o, i) => ({ key: i, label: o }))}
        initValue="Selecciona tu ocupación"
        onChange={(option) => setOcupacion(option.label)}
      >
        <TextInput style={styles.input} editable={false} value={ocupacion} />
      </ModalSelector>

      <Text style={styles.label}>Religión</Text>
      <ModalSelector
        data={religiones.map((r, i) => ({ key: i, label: r }))}
        initValue="Selecciona tu religión"
        onChange={(option) => setReligion(option.label)}
      >
        <TextInput style={styles.input} editable={false} value={religion} />
      </ModalSelector>

       {/* Botones */}
      <TouchableOpacity style={styles.saveButton} onPress={saveUserData}>
        <Text style={styles.saveText}>Guardar</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.editButton} onPress={() => setEditingUserData(false)}>
        <Text style={styles.editText}>Cancelar</Text>
      </TouchableOpacity>
    </>
  )}

  {!editingUserData && (
  <TouchableOpacity style={styles.editButton} onPress={() => setEditingUserData(true)}>
    <Text style={styles.editText}>Editar datos</Text>
  </TouchableOpacity>
)}




</View>



      {/* ----------------------------- */}
      {/* PERFIL PÚBLICO */}
      {/* ----------------------------- */}

      <View style={styles.card}>
        <Text style={styles.title}>Perfil público</Text>

        {editingPublicProfile ? (
          <>
            <Text style={styles.label}>Alias</Text>
            <TextInput
              style={styles.input}
              value={alias}
              onChangeText={setAlias}
              placeholder="Alias"
            />

            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={styles.input}
              value={bio}
              onChangeText={setBio}
              placeholder="Biografía"
              multiline
            />

            <Text style={styles.label}>Avatar URL</Text>
            <TextInput
              style={styles.input}
              value={avatarUrl}
              onChangeText={setAvatarUrl}
              placeholder="URL del avatar"
            />

            {/* Botones */}
            <TouchableOpacity style={styles.saveButton} onPress={savePublicProfile}>
              <Text style={styles.saveText}>Guardar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => {
                // Restaurar valores originales al cancelar
                setAlias(profile?.public_profile?.alias || "");
                setBio(profile?.public_profile?.bio || "");
                setAvatarUrl(profile?.public_profile?.avatar_url || "");
                setEditingPublicProfile(false);

              }}
            >
              <Text style={styles.editText}>Cancelar</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.text}>Alias: {profile?.public_profile?.alias || "Sin alias"}</Text>
            <Text style={styles.text}>Bio: {profile?.public_profile?.bio || "Sin descripción"}</Text>
            <TouchableOpacity style={styles.editButton} onPress={() => setEditingPublicProfile(true)}>
              <Text style={styles.editText}>Editar perfil</Text>
            </TouchableOpacity>


          </>
        )}
      </View>

      {/* HISTORIAL DE ENCUESTAS */}
      <SurveyHistoryList />

      {/* Billetera */}
      <View style={styles.card}>
        <Text style={styles.title}>Billetera</Text>
        {wallet ? (
          <>
            <Text style={styles.text}>Balance: {wallet.balance}</Text>
            <Text style={styles.text}>
              Última actualización: {new Date(wallet.actualizado_en).toLocaleString()}
            </Text>

            {wallet.movimientos && wallet.movimientos.length > 0 ? (
              <View style={{ marginTop: 10 }}>
                <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 6 }}>
                  Últimos movimientos
                </Text>

                {wallet.movimientos.slice(0, 3).map((m: any) => (
                  <Text key={m.id} style={styles.text}>
                    {m.tipo === "ingreso" ? "➕ Ingreso" : "➖ Retiro"} de {m.monto} el{" "}
                    {new Date(m.fecha).toLocaleDateString()}
                  </Text>
                ))}

                <TouchableOpacity
                  style={{ marginTop: 8 }}
                  onPress={() =>
                    navigation.navigate("WalletHistoryScreen", {
                      movimientos: wallet.movimientos,
                    })
                  }
                >
                  <Text style={{ color: "#2563EB", fontWeight: "600" }}>
                    Ver historial completo →
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.text}>No hay movimientos registrados</Text>
            )}
          </>
        ) : (
          <Text style={styles.text}>Sin billetera registrada</Text>
        )}
      </View>

      {/* Gamificación */}
      <View style={styles.card}>
        <Text style={styles.title}>Gamificación</Text>
        <GamificacionCard refreshTrigger={refreshGamificacion} />
      </View>



      {/* Botón de cerrar sesión */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={async () => {
          await AsyncStorage.removeItem("userToken");
          navigation.navigate("LogoutScreen");
        }}
      >
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// -----------------------------
// Estilos ProfileScreen
// -----------------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6", padding: 15 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  loading: { marginTop: 10, fontSize: 16, color: "#111827" },
  avatarContainer: { alignItems: "center", marginBottom: 10 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  changePhotoButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  changePhotoText: { color: "#fff", fontSize: 14, fontWeight: "bold" },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#2563EB",
  },
  text: { fontSize: 14, marginBottom: 4, color: "#111827" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: "#10B981",
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontSize: 14, fontWeight: "bold" },
  editButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 10,
  },
  editText: { color: "#fff", fontSize: 14, fontWeight: "bold" },
  logoutButton: {
    backgroundColor: "#EF4444",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  logoutText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 4, color: "#374151" },
  bigHeader: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 12,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 12,
    color: "#222",
  },
});










 

