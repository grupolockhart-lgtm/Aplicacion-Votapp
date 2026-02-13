import React from "react";
import { View, Button } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "./Types/Navigation"; // 👈 ruta corregida

type Props = NativeStackScreenProps<RootStackParamList, "ProfileScreen">;

export default function NavigationScreen({ navigation }: Props) {
  return (
    <View>
      <Button
        title="Ir al Perfil"
        onPress={() => navigation.navigate("ProfileScreen")}
      />
      <Button
        title="Cerrar sesión"
        onPress={() => navigation.navigate("LogoutScreen")}
      />
    </View>
  );
}



