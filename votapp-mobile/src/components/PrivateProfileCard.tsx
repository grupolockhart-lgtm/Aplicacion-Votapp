// src/components/PrivateProfileCard.tsx

import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import ModalSelector from "react-native-modal-selector";
import {
  religiones,
  nivelesEducativos,
  ciudades,
  ocupaciones,
  profesiones,
} from "../config/options";

interface PrivateProfileCardProps {
  onSave: (payload: {
    telefono_movil: string;
    ciudad: string;
    estado_civil: string;
    nivel_educativo: string;
    profesion: string;
    ocupacion: string;
    religion: string;
  }) => void;
  initialData: {
    telefono_movil?: string;
    ciudad?: string;
    estado_civil?: string;
    nivel_educativo?: string;
    profesion?: string;
    ocupacion?: string;
    religion?: string;
  };
}

export default function PrivateProfileCard({ onSave, initialData }: PrivateProfileCardProps) {
  const [form, setForm] = useState({
    telefono_movil: initialData?.telefono_movil || "",
    ciudad: initialData?.ciudad || ciudades[0],
    estado_civil: initialData?.estado_civil || "Soltero",
    nivel_educativo: initialData?.nivel_educativo || nivelesEducativos[0],
    profesion: initialData?.profesion || profesiones[0],
    ocupacion: initialData?.ocupacion || ocupaciones[0],
    religion: initialData?.religion || religiones[0],
  });

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm({ ...form, [field]: value });
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Datos privados</Text>

      {/* Teléfono */}
      <View style={styles.field}>
        <Text style={styles.label}>Teléfono</Text>
        <TextInput
          style={styles.input}
          value={form.telefono_movil}
          onChangeText={(val) => handleChange("telefono_movil", val)}
          placeholder="Teléfono móvil"
          keyboardType="phone-pad"
        />
      </View>

      {/* Ciudad */}
      <View style={styles.field}>
        <Text style={styles.label}>Ciudad</Text>
        <ModalSelector
          data={ciudades.map((c) => ({ key: c, label: c }))}
          initValue={form.ciudad}
          onChange={(option) => handleChange("ciudad", option.label)}
        >
          <TextInput style={styles.input} editable={false} value={form.ciudad} />
        </ModalSelector>
      </View>

      {/* Estado civil */}
      <View style={styles.field}>
        <Text style={styles.label}>Estado civil</Text>
        <ModalSelector
          data={[
            { key: "Soltero", label: "Soltero" },
            { key: "Casado", label: "Casado" },
            { key: "Divorciado", label: "Divorciado" },
            { key: "Viudo", label: "Viudo" },
          ]}
          initValue={form.estado_civil}
          onChange={(option) => handleChange("estado_civil", option.label)}
        >
          <TextInput style={styles.input} editable={false} value={form.estado_civil} />
        </ModalSelector>
      </View>

      {/* Nivel educativo */}
      <View style={styles.field}>
        <Text style={styles.label}>Educación</Text>
        <ModalSelector
          data={nivelesEducativos.map((n) => ({ key: n, label: n }))}
          initValue={form.nivel_educativo}
          onChange={(option) => handleChange("nivel_educativo", option.label)}
        >
          <TextInput style={styles.input} editable={false} value={form.nivel_educativo} />
        </ModalSelector>
      </View>

      {/* Profesión */}
      <View style={styles.field}>
        <Text style={styles.label}>Profesión</Text>
        <ModalSelector
          data={profesiones.map((p) => ({ key: p, label: p }))}
          initValue={form.profesion}
          onChange={(option) => handleChange("profesion", option.label)}
        >
          <TextInput style={styles.input} editable={false} value={form.profesion} />
        </ModalSelector>
      </View>

      {/* Ocupación */}
      <View style={styles.field}>
        <Text style={styles.label}>Ocupación</Text>
        <ModalSelector
          data={ocupaciones.map((o) => ({ key: o, label: o }))}
          initValue={form.ocupacion}
          onChange={(option) => handleChange("ocupacion", option.label)}
        >
          <TextInput style={styles.input} editable={false} value={form.ocupacion} />
        </ModalSelector>
      </View>

      {/* Religión */}
      <View style={styles.field}>
        <Text style={styles.label}>Religión</Text>
        <ModalSelector
          data={religiones.map((r) => ({ key: r, label: r }))}
          initValue={form.religion}
          onChange={(option) => handleChange("religion", option.label)}
        >
          <TextInput style={styles.input} editable={false} value={form.religion} />
        </ModalSelector>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={() => onSave(form)}>
        <Text style={styles.saveText}>Guardar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#fff", padding: 15, borderRadius: 10 },
  title: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  field: { marginBottom: 12 },
  label: { fontSize: 14, fontWeight: "bold", marginBottom: 4, color: "#111827" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    backgroundColor: "#F9FAFB",
  },
  saveButton: {
    backgroundColor: "#2563EB",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 10,
  },
  saveText: { color: "#fff", fontWeight: "bold" },
});