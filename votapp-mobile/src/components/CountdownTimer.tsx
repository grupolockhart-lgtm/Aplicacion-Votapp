

import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";

type Props = {
  segundosIniciales: number; // 👈 debe ser number
};

const CountdownTimer: React.FC<Props> = ({ segundosIniciales }) => {
  const [segundos, setSegundos] = useState(segundosIniciales);

  useEffect(() => {
    if (segundos <= 0) return;
    const interval = setInterval(() => {
      setSegundos((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [segundos]);

  const dias = Math.floor(segundos / 86400);
  const horas = Math.floor((segundos % 86400) / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const segundosRestantes = segundos % 60;

  return (
    <View>
      {segundos > 0 ? (
        <Text>
          Tiempo restante: {dias}d {horas}h {minutos}m {segundosRestantes}s
        </Text>
      ) : (
        <Text>Encuesta expirada</Text>
      )}
    </View>
  );
};

export default CountdownTimer;

