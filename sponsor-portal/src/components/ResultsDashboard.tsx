
// -------------------
// Imports
// -------------------

import React, { useEffect, useState, useCallback } from "react";
import {
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { VictoryPie, VictoryLine, VictoryAxis, VictoryChart, VictoryScatter } from "victory";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import { ENDPOINTS } from "../config/api";

// -------------------
// Interfaces
// -------------------

interface Option {
  text: string;
  votes: number;
}

interface Question {
  id: number;
  text: string;
  options: Option[];
}

interface TimelinePoint {
  date: string;
  votes: number;
}

interface TimelineParticipantsPoint {
  date: string;
  participants: number;
}

interface SegmentacionItem {
  segment: string;
  votes: number;
}

interface SegmentacionVotos {
  sexo: SegmentacionItem[];
  ciudad: SegmentacionItem[];
  ocupacion: SegmentacionItem[];
  profesion: SegmentacionItem[];
  nivel_educativo: SegmentacionItem[];
  religion: SegmentacionItem[];
  nacionalidad: SegmentacionItem[];
  estado_civil: SegmentacionItem[];
}

interface ResultsData {
  id: number;
  title: string;
  active: boolean;
  closed_reason?: string;
  total_participants: number;
  total_votes: number;
  spent_budget: number;
  balance_restante: number;
  questions: Question[];
  timeline: TimelinePoint[];
  fecha_creacion?: string;
  fecha_expiracion?: string;
  patrocinador?: string;
  visibilidad_resultados?: string;
  presupuesto_total?: number;
  recompensa_dinero?: number;
  recompensa_puntos?: number;
  sexo?: string[];
  ciudad?: string[];
  ocupacion?: string[];
  profesion?: string[];
  nivel_educativo?: string[];
  religion?: string[];
  nacionalidad?: string[];
  estado_civil?: string[];
  segmentacion_votos?: SegmentacionVotos;


  timeline_participants?: TimelineParticipantsPoint[];
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
  const [filters, setFilters] = useState<{ [key: string]: string[] }>({});
  const navigate = useNavigate();

  // Construir query string desde filtros
  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, values]) => {
      values.forEach((v) => params.append(key, v));
    });
    return params.toString();
  }, [filters]);

  // -------------------
  // Fetch resultados
  // -------------------

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const queryString = buildQueryString();
        const res = await fetch(
          `${ENDPOINTS.surveys.resultsWeb(surveyId)}?${queryString}`,
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
  }, [surveyId, filters, buildQueryString]);

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
    if (!results?.questions) {
      alert("No hay preguntas para exportar");
      return;
    }
    const rows = [["Pregunta", "Opción", "Votos"]];
    results.questions.forEach((q) => {
      q.options.forEach((opt) => {
        rows.push([q.text, opt.text, opt.votes.toString()]);
      });
    });
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
  // Funciones para filtros
  // -------------------
  const handleAddFilter = (type: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [type]: prev[type] ? [...prev[type], value] : [value],
    }));
  };

  const handleRemoveFilter = (type: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [type]: prev[type].filter((v) => v !== value),
    }));
  };

// -------------------
// Render
// -------------------

return (
  <Container maxWidth="lg" sx={{ mt: 4 }}>
    {/* Header compacto */}
    <Card variant="outlined" sx={{ borderRadius: 2, p: 2, mb: 3 }}>
      <Grid container alignItems="center" spacing={2}>
        {/* Icono simplificado */}
        <Grid item>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              backgroundColor: "#eee",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
            }}
          >
            📊
          </div>
        </Grid>

        {/* Título dinámico */}
        <Grid item xs>
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            {results.title}
          </Typography>
        </Grid>

        {/* Estado integrado */}
        <Grid item>
          <Chip
            label={
              !results.active
                ? results.closed_reason || "Cerrada"
                : new Date(results.fecha_expiracion) < new Date()
                ? "⏰ Expirada"
                : "✅ Activa"
            }
            color={
              !results.active
                ? "error"
                : new Date(results.fecha_expiracion) < new Date()
                ? "warning"
                : "success"
            }
          />
        </Grid>
      </Grid>
    </Card>

    {/* -------------------
        Metadatos de la encuesta
    ------------------- */}
    <Card variant="outlined" sx={{ borderRadius: 2, mb: 3 }}>
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" color="text.secondary">
              Creada
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: "bold" }}>
              {formatFecha(results.fecha_creacion)}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" color="text.secondary">
              Expira
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: "bold" }}>
              {formatFecha(results.fecha_expiracion)}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" color="text.secondary">
              Patrocinador
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: "bold" }}>
              {results.patrocinador || "N/D"}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" color="text.secondary">
              Visibilidad
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: "bold" }}>
              {results.visibilidad_resultados || "N/D"}
            </Typography>
          </Grid>
        </Grid>

        {!results.active && results.closed_reason && (
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            Motivo de cierre: {results.closed_reason}
          </Typography>
        )}
      </CardContent>
    </Card>
    
    {/* -------------------
        KPIs extendidos en un solo recuadro (formato metadatos)
    ------------------- */}
    <Card variant="outlined" sx={{ borderRadius: 2, mb: 3 }}>
      <CardContent>
        <Grid container spacing={2}>
          {/* Participantes */}
          <Grid item xs={12} sm={6} md={12/7}>
            <Typography variant="caption" color="text.secondary">
              Participantes
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: "bold" }}>
              {results.total_participants}
            </Typography>
          </Grid>

          {/* Votos totales */}
          <Grid item xs={12} sm={6} md={12/7}>
            <Typography variant="caption" color="text.secondary">
              Votos totales
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: "bold" }}>
              {results.total_votes}
            </Typography>
          </Grid>

          {/* Presupuesto gastado */}
          <Grid item xs={12} sm={6} md={12/7}>
            <Typography variant="caption" color="text.secondary">
              Presupuesto gastado
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: "bold" }}>
              {formatCurrency(results.spent_budget)}
            </Typography>
          </Grid>

          {/* Presupuesto total */}
          <Grid item xs={12} sm={6} md={12/7}>
            <Typography variant="caption" color="text.secondary">
              Presupuesto total
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: "bold" }}>
              {formatCurrency(results.presupuesto_total || 0)}
            </Typography>
          </Grid>

          {/* Balance restante */}
          <Grid item xs={12} sm={6} md={12/7}>
            <Typography variant="caption" color="text.secondary">
              Balance restante
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: "bold" }}>
              {formatCurrency(results.balance_restante)}
            </Typography>
          </Grid>

          {/* Recompensa */}
          <Grid item xs={12} sm={6} md={12/7}>
            <Typography variant="caption" color="text.secondary">
              Recompensa
            </Typography>
            <Typography variant="body2">
              💵 {results.recompensa_dinero || 0} DOP
            </Typography>
            <Typography variant="body2">
              ⭐ {results.recompensa_puntos || 0} pts
            </Typography>
          </Grid>

          {/* Costo promedio */}
          <Grid item xs={12} sm={6} md={12/7}>
            <Typography variant="caption" color="text.secondary">
              Costo promedio
            </Typography>
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
          </Grid>
        </Grid>
      </CardContent>
    </Card>





    {/* Segmentación aplicada (informativa) */}
    <Grid container spacing={1} sx={{ mt: 4 }}>
      <Grid item xs={12}>
        <Typography variant="h6">Segmentación aplicada</Typography>
      </Grid>
      {[
        { field: "sexo", label: "Sexo" },
        { field: "ciudad", label: "Ciudad" },
        { field: "ocupacion", label: "Ocupación" },
        { field: "profesion", label: "Profesión" },
        { field: "nivel_educativo", label: "Nivel educativo" },
        { field: "religion", label: "Religión" },
        { field: "nacionalidad", label: "Nacionalidad" },
        { field: "estado_civil", label: "Estado civil" },
      ].map((seg, idx) => {
        const values = results[seg.field];
        return (
          <Grid item key={idx}>
            <Chip
              label={
                values && values.length > 0
                  ? `${seg.label}: ${values.join(", ")}`
                  : `${seg.label}: Todos`
              }
              color="primary"
              variant="outlined"
              sx={{ mr: 1, mb: 1 }}
            />
          </Grid>
        );
      })}
    </Grid>

    {/* -------------------
        Segmentación real de votos (interactiva)
    ------------------- */}
    <Grid container spacing={1} sx={{ mt: 4 }}>
      <Grid item xs={12}>
        <Typography variant="h6">Segmentación de votos</Typography>
      </Grid>

      {Object.entries(results.segmentacion_votos || {}).map(([type, arr]) =>
        arr.map((seg) => (
          <Grid item key={`${type}-${seg.segment}`}>
            <Chip
              label={`${seg.segment} (${seg.votes})`}
              color={
                filters[type]?.includes(seg.segment) ? "primary" : "default"
              }
              onClick={() => handleAddFilter(type, seg.segment)}
            />
          </Grid>
        ))
      )}
    </Grid>

    {/* Filtros activos */}
    {Object.entries(filters).map(([type, values]) =>
      values.map((v) => (
        <Chip
          key={`${type}-${v}`}
          label={`${type}: ${v}`}
          onDelete={() => handleRemoveFilter(type, v)}
          sx={{ m: 0.5 }}
          color="secondary"
        />
      ))
    )}
{/* -------------------
    Gráficas
------------------- */}
<Grid container spacing={2} sx={{ mt: 3 }}>

  {/* Distribución por pregunta */}
  {results.questions?.map((q) => (
    <Grid item xs={12} md={4} key={q.id}>
      <Card sx={{ boxShadow: 1, borderRadius: 2 }}>
        <CardContent
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            p: 1, // 👈 menos padding
          }}
        >
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: "bold" }}>
            {q.text}
          </Typography>
          <VictoryPie
            data={q.options.map((opt) => ({
              x: opt.text,
              y: opt.votes,
            }))}
            height={200}   // 👈 más pequeño
            width={200}    // 👈 más pequeño
            innerRadius={10}
            labelRadius={65}
            colorScale={[
              "#2196F3",
              "#4CAF50",
              "#FF9800",
              "#F44336",
              "#9C27B0",
              "#00BCD4",
            ]}
            style={{
              data: { stroke: "#fff", strokeWidth: 1.5 },
              labels: { fontSize: 10 } // 👈 aquí reduces el tamaño de las letras
            }}
            labels={({ datum }) => `${datum.x}: ${datum.y}`}
          />

        </CardContent>
      </Card>
    </Grid>
  ))}

  {/* Evolución temporal */}
  <Grid container spacing={2} sx={{ mt: 3 }}>
    {/* Votos */}
    <Grid item xs={12} md={6}>
      <Card sx={{ boxShadow: 2, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
            Evolución temporal de votos
          </Typography>
          <VictoryChart height={140} padding={{ top: 5, bottom: 30, left: 45, right: 10 }}>
            <VictoryLine
              interpolation="monotoneX"
              data={results.timeline.map((t) => ({
                x: new Date(t.date + "T00:00:00"),
                y: t.votes,
              }))}
              style={{ data: { stroke: "#1976D2", strokeWidth: 1 } }}
            />
            <VictoryScatter
              data={results.timeline.map((t) => ({
                x: new Date(t.date + "T00:00:00"),
                y: t.votes,
              }))}
              size={1.5}
              style={{ data: { fill: "#1976D2" } }}
            />
            <VictoryAxis
              tickFormat={(t) =>
                new Date(t).toLocaleDateString("es-DO", { day: "2-digit", month: "short" })
              }
              style={{
                tickLabels: { fontSize: 7, angle: -30, textAnchor: "end" },
                axis: { stroke: "#ccc" },
              }}
            />
            <VictoryAxis
              dependentAxis
              label="Votos"
              style={{
                tickLabels: { fontSize: 6 },
                grid: { stroke: "#eee" },
                axisLabel: { fontSize: 8, padding: 25 },
              }}
            />
          </VictoryChart>
        </CardContent>
      </Card>
    </Grid>

    {/* Participantes */}
    <Grid item xs={12} md={6}>
      <Card sx={{ boxShadow: 2, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
            Evolución temporal de participantes
          </Typography>
          <VictoryChart height={140} padding={{ top: 5, bottom: 30, left: 45, right: 10 }}>
            <VictoryLine
              interpolation="monotoneX"
              data={(results.timeline_participants ?? []).map((t) => ({
                x: new Date(t.date + "T00:00:00"),
                y: t.participants,
              }))}
              style={{ data: { stroke: "#388E3C", strokeWidth: 1 } }}
            />
            <VictoryScatter
              data={(results.timeline_participants ?? []).map((t) => ({
                x: new Date(t.date + "T00:00:00"),
                y: t.participants,
              }))}
              size={1.5}
              style={{ data: { fill: "#388E3C" } }}
            />
            <VictoryAxis
              tickFormat={(t) =>
                new Date(t).toLocaleDateString("es-DO", { day: "2-digit", month: "short" })
              }
              style={{
                tickLabels: { fontSize: 7, angle: -30, textAnchor: "end" },
                axis: { stroke: "#ccc" },
              }}
            />
            <VictoryAxis
              dependentAxis
              label="Participantes"
              style={{
                tickLabels: { fontSize: 6 },
                grid: { stroke: "#eee" },
                axisLabel: { fontSize: 8, padding: 25 },
              }}
            />
          </VictoryChart>
        </CardContent>
      </Card>
    </Grid>
  </Grid>


</Grid>


{/* -------------------
    Acciones
------------------- */}
<Box sx={{ mt: 3, display: "flex", gap: 2 }}>
  <Button
    variant="outlined"
    color="primary"
    onClick={() => navigate("/dashboard", { state: { tab: 1 } })}
  >
    ← Volver a mis encuestas publicadas
  </Button>

  <Button variant="contained" onClick={exportCSV}>
    Exportar CSV
  </Button>

  <Button variant="outlined" onClick={shareResults}>
    Compartir resultados
  </Button>
</Box>


</Container>
);
}
