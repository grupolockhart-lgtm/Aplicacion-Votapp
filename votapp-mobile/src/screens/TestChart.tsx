import React from "react";
import { View, Dimensions } from "react-native";
import { VictoryBar, VictoryChart, VictoryAxis, VictoryLabel } from "victory-native";

const sampleResults = [
  { option: "Rock", votes: 1 },
  { option: "Pop", votes: 4 },
  { option: "Reggaetón", votes: 0 },
  { option: "Clásica", votes: 0 },
];

const colorMap: Record<string, string> = {
  Rock: "#f44336",
  Pop: "#2196F3",
  Reggaetón: "#4CAF50",
  Clásica: "#FF9800",
};

export default function TestChart() {
  const screenWidth = Dimensions.get("window").width;
  const chartWidth = screenWidth - 40;

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
      <VictoryChart width={chartWidth} height={280} domainPadding={{ x: 30, y: 20 }}>
        <VictoryAxis dependentAxis />

        <VictoryBar
          data={sampleResults.map((r, i) => ({
            x: i + 1,
            y: r.votes,
            label: `${r.votes}`,
          }))}
          style={{
            data: {
              fill: ({ datum }) => colorMap[sampleResults[datum.x - 1].option] || "#2196F3",
            },
          }}
          labels={({ datum }) => datum.label}
          labelComponent={
            <VictoryLabel
              dy={-10}
              textAnchor="middle"
              style={{ fontSize: 12 }}
            />
          }
          animate={{ duration: 800, easing: "bounce" }}
        />

        <VictoryAxis
          tickValues={sampleResults.map((_, i) => i + 1)}
          tickFormat={sampleResults.map((r) => r.option)}
          style={{
            tickLabels: { fontSize: 12, angle: -20, textAnchor: "end", padding: 4 },
          }}
        />
      </VictoryChart>
    </View>
  );
}












