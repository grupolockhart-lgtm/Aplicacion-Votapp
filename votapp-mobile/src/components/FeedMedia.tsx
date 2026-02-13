import React, { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, Text, View, Image, Dimensions } from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import { useIsFocused } from "@react-navigation/native";

const { width } = Dimensions.get("window");

interface Props {
  media_url?: string;
  isActive: boolean;
  globalMuted: boolean;
  toggleMute: () => void;
}

export default function FeedMedia({
  media_url,
  isActive,
  globalMuted,
  toggleMute,
}: Props) {
  const isFocused = useIsFocused();
  const [height, setHeight] = useState(width * 0.56); // valor inicial 16:9

  if (!media_url) return null;

  const isVideo = /\.(mp4|mov)$/i.test(media_url);
  const player = isVideo ? useVideoPlayer(media_url) : undefined;

  // 👇 calcular altura real de la imagen con límite máximo
  useEffect(() => {
    if (!isVideo && media_url) {
      Image.getSize(
        media_url,
        (imgWidth, imgHeight) => {
          if (imgWidth > 0 && imgHeight > 0) {
            const ratio = imgHeight / imgWidth;
            const calculatedHeight = width * ratio;
            setHeight(Math.min(calculatedHeight, 400)); // 👈 límite máximo
          }
        },
        (error) => console.log("Error obteniendo tamaño de imagen:", error)
      );
    }
  }, [media_url, isVideo]);

  useEffect(() => {
    if (isVideo && player) {
      if (isActive && isFocused) {
        try {
          player.currentTime = 0;
          player.play();
          player.loop = true;
        } catch (e) {
          console.log("Error al reproducir:", e);
        }
      } else {
        try {
          player.pause();
        } catch (e) {
          console.log("Error al pausar:", e);
        }
      }
    }
  }, [isVideo, isActive, player, isFocused]);

  useEffect(() => {
    if (isVideo && player) {
      try {
        player.muted = globalMuted;
      } catch (e) {
        console.log("Error al mutear:", e);
      }
    }
  }, [isVideo, player, globalMuted]);

  if (isVideo && player) {
    return (
      <View style={[styles.container, { height }]}>
        {isActive && isFocused ? (
          <>
            <VideoView
              style={styles.media}
              player={player}
              fullscreenOptions={{ enable: true, orientation: "landscape" }}
              allowsPictureInPicture
            />
            <TouchableOpacity style={styles.muteButton} onPress={toggleMute}>
              <Text style={styles.muteText}>{globalMuted ? "🔇" : "🔊"}</Text>
            </TouchableOpacity>
          </>
        ) : (
          // 👇 placeholder en vez de Image con mp4
          <View style={[styles.media, { justifyContent: "center", alignItems: "center" }]}>
            <Text style={{ color: "#fff" }}>▶️ Video</Text>
          </View>
        )}
      </View>
    );
  }

  // Si es imagen
  return (
    <View style={[styles.container, { height }]}>
      <Image source={{ uri: media_url }} style={styles.media} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: "relative", width: "100%" },
  media: { width: "100%", height: "100%", backgroundColor: "#000" },
  muteButton: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 8,
    borderRadius: 20,
  },
  muteText: { color: "#fff", fontSize: 16 },
});