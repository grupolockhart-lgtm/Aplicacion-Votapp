// src/screens/ProfileScreen.tsx

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { Easing } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useProfile } from "./Profile/hooks/useProfile";
import { useUserData } from "./Profile/hooks/useUserData";
import { useGamificacion } from "./Profile/hooks/useGamificacion";
import { usePublicProfile } from "./Profile/hooks/usePublicProfile";
import { useAvatar } from "./Profile/hooks/useAvatar";

import PublicProfileCard from "../components/PublicProfileCard";
import GamificacionCard from "../components/GamificacionCard";
import ProfileTabs from "./Profile/ProfileTabs";
import PrivateProfileCard from "../components/PrivateProfileCard";
import { API_URL } from "../config/api";
import BilleteraCard from "../components/BilleteraCard";
import { Profile } from "../Types/Profile";

export default function ProfileScreen() {
  const navigation = useNavigation();

  const { profile, refreshProfile, setProfile } = useProfile(navigation);
  const { saveUserData } = useUserData(API_URL, refreshProfile, () => {});
  const { refreshGamificacion, fetchGamificacion } = useGamificacion();
  const { savePublicProfile } = usePublicProfile(refreshProfile);

  // ✅ corregido: useFocusEffect con callback
  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      async function loadGamificacion() {
        try {
          await fetchGamificacion();
        } catch (err) {
          console.error("Error cargando gamificación:", err);
        }
      }

      loadGamificacion();

      return () => {
        isActive = false;
      };
    }, [fetchGamificacion])
  );

  const { pickImage } = useAvatar(
    (newAvatarUrl: string) => {
      setProfile((prev: Profile | null) => ({
        ...prev!,
        public_profile: {
          ...prev?.public_profile,
          avatar_url: newAvatarUrl,
        },
      }));
    },
    setProfile,
    refreshProfile
  );

  const [showSettings, setShowSettings] = useState(false);
  const [showPrivateData, setShowPrivateData] = useState(false);

  const screenWidth = Dimensions.get("window").width;
  const panelWidth = screenWidth * 0.75;
  const slideAnim = useRef(new Animated.Value(panelWidth)).current;

  useEffect(() => {
    if (showSettings) {
      slideAnim.setValue(panelWidth);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: panelWidth,
        duration: 400,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start();
      setShowPrivateData(false);
    }
  }, [showSettings]);

  if (!profile) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loading}>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileContainer}>
        <PublicProfileCard
          alias={profile?.public_profile?.alias}
          bio={profile?.public_profile?.bio}
          avatarUrl={profile?.public_profile?.avatar_url}
          editable={true}
          onSave={savePublicProfile}
          onPickImage={pickImage}
        />

        <TouchableOpacity
          style={styles.settingsFloating}
          onPress={() => setShowSettings(true)}
        >
          <MaterialIcons name="menu" size={28} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* Menú lateral derecho */}
      <Modal
        visible={showSettings}
        transparent
        animationType="none"
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.sideMenuRight,
              { transform: [{ translateX: slideAnim }] },
            ]}
          >
            <SafeAreaView style={styles.safeAreaContent}>
              <Text style={styles.modalTitle}>Ajustes</Text>

              <TouchableOpacity
                onPress={() => setShowPrivateData(!showPrivateData)}
              >
                <Text style={styles.sectionTitle}>Datos privados</Text>
              </TouchableOpacity>

              {showPrivateData && (
                <View style={styles.sectionBlock}>
                  <PrivateProfileCard
                    onSave={saveUserData}
                    initialData={profile?.user || {}}
                  />
                </View>
              )}

              <TouchableOpacity
                onPress={() => {
                  setShowSettings(false);
                  navigation.navigate("LogoutScreen");
                }}
              >
                <Text style={styles.sectionTitle}>Cerrar sesión</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <Text style={styles.closeButton}>Cerrar</Text>
              </TouchableOpacity>
            </SafeAreaView>
          </Animated.View>
        </View>
      </Modal>

      {/* Gamificación */}
      <View style={styles.gamificacionRow}>
        <GamificacionCard refreshTrigger={refreshGamificacion} />
      </View>

      {/* Billetera */}
      <View style={styles.walletRow}>
        <BilleteraCard wallet={profile.wallet} />
      </View>

      {/* Tabs de encuestas */}
      <ProfileTabs profile={profile} refreshGamificacion={refreshGamificacion} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  loading: { marginTop: 10, fontSize: 16, color: "#111827" },
  profileContainer: {
    position: "relative",
    marginBottom: 0,
  },
  settingsFloating: {
    position: "absolute",
    top: 25,
    right: 25,
  },
  gamificacionRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 4,
    backgroundColor: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  sideMenuRight: {
    backgroundColor: "#fff",
    width: "75%",
    height: "100%",
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  safeAreaContent: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#111827",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: 16,
    color: "#111827",
  },
  sectionBlock: {
    backgroundColor: "#F9FAFB",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  closeButton: {
    fontSize: 16,
    color: "#2563EB",
    fontWeight: "600",
    marginTop: 12,
  },
  walletRow: {
    paddingHorizontal: 0,
    paddingVertical: 2,
    backgroundColor: "#F3F4F6",
  },
});
