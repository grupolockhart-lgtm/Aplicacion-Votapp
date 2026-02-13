



import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Alert,
  Animated,
  Easing,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  VictoryBar,
  VictoryChart,
  VictoryAxis,
  VictoryPie,
  VictoryLabel,
} from "victory-native";
import { API_URL } from "../config/api";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../Types/Navigation";

import SurveyCard from "@/components/SurveyCard";

type Props = NativeStackScreenProps<RootStackParamList, "ResultsScreen">;


interface OptionResult {
  id: number;
  text: string;
  votes: number;
  percentage?: number;
}

interface QuestionResult {
  question_id: number;
  question_text: string;
  options: OptionResult[];
}

export default function ResultsScreen({ route, navigation }: Props) {
  const {
    surveyId,
    media_url,
    media_urls,
    title,
    description,
    refreshSurveys,
    refreshProfile,
  } = route.params;





console.log("Params en ResultsScreen:", route.params);
console.log("typeof refreshProfile:", typeof refreshProfile);
console.log("typeof refreshSurveys:", typeof refreshSurveys);


  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);
  const [surveyTitle, setSurveyTitle] = useState(title || "Encuesta");
  const [loading, setLoading] = useState(true);
  const [globalMuted, setGlobalMuted] = useState(true);

  const rotateAnims = useMemo(
    () => questionResults.map(() => new Animated.Value(0)),
    [questionResults.length]
  );

  useEffect(() => {
    const loadResults = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        if (!token) {
          Alert.alert("Error", "Debes iniciar sesión para ver resultados.");
          (navigation as any).navigate("LoginScreen");
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_URL}/surveys/${surveyId}/results`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data?.detail || "Error al cargar resultados");

        if (Array.isArray(data?.results)) {
          setQuestionResults(
            data.results.map((q: any) => ({
              question_id: q.question_id,
              question_text: q.question_text,
              options: q.options.map((opt: any) => ({
                id: opt.id,
                text: opt.text,
                votes: Number(opt.votes),
              })),
            }))
          );
        }

        setSurveyTitle(data?.title || surveyTitle);

        // ✅ Refrescar perfil y encuestas al cargar resultados
        await refreshProfile();
        await refreshSurveys();
      } catch (err: any) {
        Alert.alert("Error", err.message || String(err));
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [surveyId, navigation]);

  useEffect(() => {
    rotateAnims.forEach((anim) => {
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
        easing: Easing.out(Easing.exp),
      }).start();
    });
  }, [rotateAnims]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  const colorScale = ["#2196F3", "#4CAF50", "#FF9800", "#9C27B0", "#F44336"];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SurveyCard
        survey={{
          id: surveyId,
          title: surveyTitle,
          description,
          media_url,
          media_urls,
        }}
        globalMuted={globalMuted}
        toggleMute={() => setGlobalMuted(!globalMuted)}
        badgeText="📊 Resultados"
        onPress={() => {}}
        isVisible={true}
      />

      {questionResults.map((q, index) => {
        const totalVotes = q.options.reduce((sum, opt) => sum + opt.votes, 0);
        const spin = rotateAnims[index].interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", "360deg"],
        });

        return (
          <View key={q.question_id} style={styles.card}>
            <Text style={styles.questionText}>{q.question_text}</Text>
            <Text style={styles.totalVotes}>Total votos: {totalVotes}</Text>

            {/* 📊 Gráfica de barras */}
            <VictoryChart
              width={Dimensions.get("window").width - 80}
              height={320}
              domainPadding={{ x: 25, y: 20 }}
              padding={{ top: 20, bottom: 80, left: 50, right: 20 }}
            >
              <VictoryAxis dependentAxis />
              <VictoryBar
                data={q.options.map((opt, i) => ({
                  x: opt.text,
                  y: opt.votes,
                  fill: colorScale[i % colorScale.length],
                  percentage:
                    totalVotes > 0
                      ? ((opt.votes / totalVotes) * 100).toFixed(1)
                      : "0",
                }))}
                style={{ data: { fill: (args) => args.datum?.fill } }}
                labels={(args) => `${args.datum?.percentage ?? 0}%`}
                labelComponent={
                  <VictoryLabel dy={-10} style={{ fontSize: 12, fill: "#333" }} />
                }
                animate={{ duration: 1000, easing: "bounce" }}
              />
              <VictoryAxis
                tickFormat={(t) =>
                  t.length > 12 ? t.match(/.{1,12}/g)?.join("\n") : t
                }
                style={{
                  tickLabels: {
                    angle: -45,
                    fontSize: 10,
                    textAnchor: "end",
                    fill: "#333",
                  },
                }}
              />
            </VictoryChart>

            {/* 🥧 Gráfica de pastel */}
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <VictoryPie
                data={q.options.map((opt) => ({ x: opt.text, y: opt.votes }))}
                colorScale={colorScale}
                style={{ data: { stroke: "#fff", strokeWidth: 2 } }}
                labels={(args) =>
                  `${((args.datum?.y ?? 0) / totalVotes * 100).toFixed(1)}%`
                }
                labelComponent={
                  <VictoryLabel style={{ fontSize: 14, fill: "#000" }} />
                }
                labelRadius={100}
                width={Dimensions.get("window").width - 40}
                height={280}
                innerRadius={70}
                padAngle={3}
                animate={{
                  duration: 1500,
                  easing: "elastic",
                  onLoad: { duration: 1500 },
                }}
              />
              <View style={styles.centerLabel}>
                <Text
                  style={[
                    styles.centerLabelText,
                    {
                      color:
                        totalVotes > 100
                          ? "#10B981"
                          : totalVotes >= 50
                          ? "#F59E0B"
                          : "#EF4444",
                    },
                  ]}
                >
                  {totalVotes} votos
                </Text>
              </View>
            </Animated.View>

            {/* 📌 Leyenda */}
            <View style={styles.legend}>
              {q.options.map((opt, i) => {
                const percentage =
                  totalVotes > 0
                    ? ((opt.votes / totalVotes) * 100).toFixed(1)
                    : "0";
                return (
                  <View key={opt.id} style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendColor,
                        { backgroundColor: colorScale[i % colorScale.length] },
                      ]}
                    />
                    <Text style={styles.legendText}>
                      {opt.text} ({percentage}%)
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  centered: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  container: { 
    padding: 20 
  },
  card: {
    marginBottom: 40,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  questionText: { 
    fontSize: 18, 
    fontWeight: "600", 
    marginBottom: 10,   // 👈 aquí estaba incompleto
    color: "#111827"
  },
  totalVotes: { 
    marginBottom: 10, 
    fontSize: 14, 
    color: "#6B7280" 
  },
  centerLabel: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  centerLabelText: { 
    fontSize: 16, 
    fontWeight: "700" 
  },
  legend: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    marginTop: 10 
  },
  legendItem: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginRight: 15, 
    marginBottom: 5 
  },
  legendColor: { 
    width: 14, 
    height: 14, 
    marginRight: 6, 
    borderRadius: 3 
  },
  legendText: { 
    fontSize: 12, 
    color: "#333" 
  },
});


   


 