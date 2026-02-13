import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";

export default function ExploreScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Explorar</Text>
      <Text style={styles.text}>
        Aquí puedes descubrir nuevas encuestas y participar en la comunidad 🚀
      </Text>

      <Image
        source={require("../../assets/images/react-logo.png")}
        style={styles.logo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 16 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 12 },
  text: { fontSize: 16, textAlign: "center", marginBottom: 20 },
  logo: { width: 100, height: 100, resizeMode: "contain" },
});