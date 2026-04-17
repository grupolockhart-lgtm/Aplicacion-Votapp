// src/components/PublicProfileCard.tsx

import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet } from "react-native";

export default function PublicProfileCard({ alias, bio, avatarUrl, onSave, onPickImage }: any) {
  const [editing, setEditing] = useState(false);
  const [localAlias, setLocalAlias] = useState(alias || "");
  const [localBio, setLocalBio] = useState(bio || "");
  const [localAvatar, setLocalAvatar] = useState(avatarUrl || "");

  // ✅ sincroniza estado interno cuando cambian las props
  useEffect(() => {
    setLocalAlias(alias || "");
    setLocalBio(bio || "");
    setLocalAvatar(avatarUrl || "");
  }, [alias, bio, avatarUrl]);

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        {/* Avatar con botón flotante */}
        <View style={styles.avatarContainer}>
          <Image
            source={{
              uri:
                localAvatar && localAvatar.trim() !== ""
                  ? localAvatar
                  : "https://cdn-icons-png.flaticon.com/512/149/149071.png",
            }}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.floatingButton} onPress={onPickImage}>
            <Text style={styles.icon}>📷</Text>
          </TouchableOpacity>
        </View>

        {/* Info: título, alias, bio */}
        <View style={styles.info}>
          <Text style={styles.title}>Perfil público</Text>

          {editing ? (
            <>
              <TextInput
                style={styles.input}
                value={localAlias}
                onChangeText={setLocalAlias}
                placeholder="Alias"
              />
              <TextInput
                style={styles.input}
                value={localBio}
                onChangeText={setLocalBio}
                placeholder="Biografía"
                multiline
              />
              <TextInput
                style={styles.input}
                value={localAvatar}
                onChangeText={setLocalAvatar}
                placeholder="URL del avatar"
              />

              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => {
                  onSave({ alias: localAlias, bio: localBio, avatar_url: localAvatar });
                  setEditing(false);
                }}
              >
                <Text style={styles.saveText}>Guardar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setEditing(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.aliasRow}>
                <Text style={styles.alias}>{alias || "Sin alias"}</Text>
                <TouchableOpacity style={styles.iconButton} onPress={() => setEditing(true)}>
                  <Text style={styles.icon}>✏️</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.bio}>{bio || "Sin descripción"}</Text>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  floatingButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#2563EB",
    borderRadius: 20,
    padding: 6,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2563EB",
    marginBottom: 6,
  },
  aliasRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  alias: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginRight: 8,
  },
  bio: {
    fontSize: 14,
    color: "#555",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: "#10B981",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 10,
  },
  saveText: { color: "#fff", fontWeight: "bold" },
  cancelButton: {
    backgroundColor: "#EF4444",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 10,
  },
  cancelText: { color: "#fff", fontWeight: "bold" },
  iconButton: {
    padding: 4,
  },
  icon: {
    fontSize: 18,
    color: "#fff",
  },
});
