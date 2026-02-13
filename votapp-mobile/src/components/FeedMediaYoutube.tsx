// src/components/FeedMediaYoutube.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import YoutubePlayer from "react-native-youtube-iframe";

export default function FeedMediaYoutube({ source_url }: { source_url: string }) {
  // Regex que captura el ID en distintos formatos de YouTube
  const match = source_url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/]+)/i
  );
  const videoId = match ? match[1] : "";

  if (!videoId) {
    console.log("No se pudo extraer videoId de:", source_url);
    return null;
  }

  return (
    <View style={styles.container}>
      <YoutubePlayer
        height={220}
        play={false}
        videoId={videoId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: "#000",
  },
});

