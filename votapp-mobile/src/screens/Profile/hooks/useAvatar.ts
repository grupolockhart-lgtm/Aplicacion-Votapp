

import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../../../config/api";

export function useAvatar(setAvatarUrl: (url: string) => void, setProfile: any, refreshProfile: () => void) {
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
      formData.append("file", { uri: localUri, name: filename, type } as any);

      const token = await AsyncStorage.getItem("userToken");
      const res = await fetch(`${API_URL}/users/upload/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      setAvatarUrl(data.avatar_url);

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

  return { pickImage };
}
