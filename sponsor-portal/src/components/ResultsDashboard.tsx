import React, { useEffect, useState } from "react";
import {
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { VictoryPie, VictoryLine, VictoryAxis, VictoryChart } from "victory";

interface Option {
  text: string;
  votes: number;
}

interface TimelinePoint {
  date: string;
  votes: number;
}

interface ResultsData {
  id: number;
  title: string;
  active: boolean;
  closed_reason?: string;
  total_participants: number;
  total_votes: number;
  spent_budget: number;
  options: Option[];
  timeline: TimelinePoint[];
  // 👇 nuevos campos para metadatos
  fecha_creacion?: string;
  fecha_expiracion?: string;
  patrocinador?: string;
  visibilidad_resultados?: string;
}

export default function ResultsDashboard({ surveyId }: { surveyId: number }) {
  const [results, setResults] = useState<ResultsData | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await fetch(
          `http://localhost:8000/api/surveys/web/${surveyId}/results`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Error ${res.status}: ${text}`);
        }

        const data = await res.json();
        setResults(data);
      } catch (err) {
        console.error("❌ Error cargando resultados:", err);
      }
    };
    fetchResults();
  }, [surveyId]);

  if (!results) {
    return <Typography>Cargando resultados...</Typography>;
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
    }).format(value);

  const exportCSV = () => {
    const rows = [
      ["Opción", "Votos"],
      ...results.options.map((opt) => [opt.text, opt.votes.toString()]),
    ];
    const csvContent =
      "data:text/csv;charset=utf-8," +
      rows.map((r) => r.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `resultados_encuesta_${surveyId}.csv`;
    link.click();
  };

  const shareResults = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/surveys/${surveyId}/results`
      );
      alert("📋 Link copiado al portapapeles");
    } catch {
      alert("No se pudo copiar el link");
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {/* Header */}
      <Typography variant="h4" gutterBottom>
        {results.title} 📊
      </Typography>
      <Chip
        label={results.active ? "Activa" : results.closed_reason || "Cerrada"}
        color={results.active ? "success" : "error"}
        sx={{ mb: 2 }}
      />

      {/* -------------------
          Metadatos de la encuesta
      ------------------- */}
      <Typography>Creada: {results.fecha_creacion || "N/D"}</Typography>
      <Typography>Expira: {results.fecha_expiracion || "N/D"}</Typography>
      <Typography>Patrocinador: {results.patrocinador || "N/D"}</Typography>
      <Typography>
        Visibilidad: {results.visibilidad_resultados || "N/D"}
      </Typography>
      {!results.active && results.closed_reason && (
        <Typography color="error">
          Motivo de cierre: {results.closed_reason}
        </Typography>
      )}

      {/* KPIs */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Participantes</Typography>
              <Typography variant="h4">{results.total_participants}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Votos totales</Typography>
              <Typography variant="h4">{results.total_votes}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Presupuesto gastado</Typography>
              <Typography variant="h4">
                {formatCurrency(results.spent_budget)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Gráficas */}
      <Grid container spacing={3} sx={{ mt: 4 }}>
        <Grid item xs={6}>
          <Typography variant="h6">Distribución por opciones</Typography>
          <VictoryPie
            data={results.options.map((opt) => ({
              x: opt.text,
              y: opt.votes,
            }))}
            colorScale={["#2196F3", "#4CAF50", "#FF9800", "#F44336"]}
            style={{ data: { stroke: "#fff", strokeWidth: 2 } }}
          />
        </Grid>
        <Grid item xs={6}>
          <Typography variant="h6">Evolución temporal</Typography>
          <VictoryChart>
            <VictoryLine
              data={results.timeline.map((t) => ({
                x: new Date(t.date),
                y: t.votes,
              }))}
              style={{ data: { stroke: "#2196F3", strokeWidth: 2 } }}
            />
            <VictoryAxis
              tickFormat={(t) => new Date(t).toLocaleDateString("es-DO")}
            />
            <VictoryAxis dependentAxis />
          </VictoryChart>
        </Grid>
      </Grid>

      {/* Acciones */}
      <Button variant="contained" sx={{ mt: 3 }} onClick={exportCSV}>
        Exportar CSV
      </Button>
      <Button variant="outlined" sx={{ mt: 3, ml: 2 }} onClick={shareResults}>
        Compartir resultados
      </Button>
    </Container>
  );
}
