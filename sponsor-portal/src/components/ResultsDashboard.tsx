
// -------------------
// Imports
// -------------------

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
import { useNavigate } from "react-router-dom";


// -------------------
// Interfaces
// -------------------

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
  balance_restante: number;   // 👈 nuevo campo
  options: Option[];
  timeline: TimelinePoint[];
  // 👇 nuevos campos para metadatos
  fecha_creacion?: string;
  fecha_expiracion?: string;
  patrocinador?: string;
  visibilidad_resultados?: string;
   // 👇 nuevos campos para KPIs extendidos
  presupuesto_total?: number;
  recompensa_dinero?: number;
  recompensa_puntos?: number; 
}

// -------------------
// Helper para formatear fecha
// -------------------
const formatFecha = (fecha?: string) => {
  if (!fecha) return "Sin fecha";
  try {
    let fechaNormalizada = fecha;
    if (!fecha.endsWith("Z") && !fecha.includes("+")) {
      fechaNormalizada = fecha + "Z";
    }
    const parsed = new Date(fechaNormalizada);
    return isNaN(parsed.getTime())
      ? "Fecha inválida"
      : parsed.toLocaleString("es-DO", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
  } catch {
    return "Fecha inválida";
  }
};

// -------------------
// Componente principal
// -------------------
export default function ResultsDashboard({ surveyId }: { surveyId: number }) {
  const [results, setResults] = useState<ResultsData | null>(null);
  const navigate = useNavigate();

  // -------------------
  // Fetch resultados
  // ------------------- 

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


  // -------------------
  // Helpers
  // -------------------

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



  // -------------------
  // Render
  // -------------------

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
      <Typography>Creada: {formatFecha(results.fecha_creacion)}</Typography>
      <Typography>Expira: {formatFecha(results.fecha_expiracion)}</Typography>
      <Typography>Patrocinador: {results.patrocinador || "N/D"}</Typography>
      <Typography>
        Visibilidad: {results.visibilidad_resultados || "N/D"}
      </Typography>
      {!results.active && results.closed_reason && (
        <Typography color="error">
          Motivo de cierre: {results.closed_reason}
        </Typography>
      )}


      {/* -------------------
          KPIs extendidos
      ------------------- */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Participantes */}
        <Grid item xs={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Participantes</Typography>
              <Typography variant="h4">{results.total_participants}</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Votos totales */}
        <Grid item xs={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Votos totales</Typography>
              <Typography variant="h4">{results.total_votes}</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Presupuesto gastado */}
        <Grid item xs={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Presupuesto gastado</Typography>
              <Typography variant="h4">
                {formatCurrency(results.spent_budget)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Presupuesto total */}
        <Grid item xs={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Presupuesto total</Typography>
              <Typography variant="h4">
                {formatCurrency(results.presupuesto_total || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Balance restante */}
        <Grid item xs={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Balance restante</Typography>
              <Typography variant="h4">
                {formatCurrency(results.balance_restante)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>


        {/* Recompensa */}
        <Grid item xs={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Recompensa</Typography>
              <Typography variant="body1">
                💵 {results.recompensa_dinero || 0} DOP
              </Typography>
              <Typography variant="body1">
                ⭐ {results.recompensa_puntos || 0} pts
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Costo promedio */}
        <Grid item xs={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Costo promedio</Typography>
              <Typography variant="body2">
                Por voto:{" "}
                {results.total_votes > 0
                  ? formatCurrency(results.spent_budget / results.total_votes)
                  : "N/D"}
              </Typography>
              <Typography variant="body2">
                Por participante:{" "}
                {results.total_participants > 0
                  ? formatCurrency(results.spent_budget / results.total_participants)
                  : "N/D"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>


      {/* -------------------
          Gráficas
      ------------------- */}

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


      {/* -------------------
          Acciones
      ------------------- */}

      {/* Acciones */}
      <Button variant="contained" sx={{ mt: 3 }} onClick={exportCSV}>
        Exportar CSV
      </Button>
      <Button variant="outlined" sx={{ mt: 3, ml: 2 }} onClick={shareResults}>
        Compartir resultados
      </Button>

      {/* -------------------
          Botón volver
      ------------------- */}
      <Button
        variant="outlined"
        color="primary"
        sx={{ mt: 3 }}
        onClick={() => navigate("/dashboard", { state: { tab: 1 } })}
      >
        ← Volver a mis encuestas publicadas
      </Button>


    </Container>
  );
}
