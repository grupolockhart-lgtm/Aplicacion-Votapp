// sponsor-portal/src/components/ResultsDashboard.tsx

import React, { useEffect, useState } from "react";
import {
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Box,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { VictoryPie, VictoryLine, VictoryAxis, VictoryChart } from "victory";

// Alias tipado para evitar errores de overload en MUI v9
const TypedGrid = Grid as React.ComponentType<any>;

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
  title: string;
  description?: string;
  active: boolean;
  closed_reason?: string;
  fecha_creacion?: string;
  fecha_expiracion?: string;
  patrocinador?: string;
  visibilidad_resultados?: string;
  total_participants: number;
  total_votes: number;
  presupuesto_total: number;
  spent_budget: number;
  recompensa_puntos?: number;
  recompensa_dinero?: number;
  options: Option[];
  timeline: TimelinePoint[];
  sexo?: string[];
  ciudad?: string[];
  ocupacion?: string[];
  profesion?: string[];
  nivel_educativo?: string[];
  religion?: string[];
  nacionalidad?: string[];
  estado_civil?: string[];
  source_url?: string;
  media_url?: string;
  media_urls?: string[];
}

// -------------------
// Componente principal
// -------------------

export default function ResultsDashboard({ surveyId }: { surveyId: number }) {
  const [results, setResults] = useState<ResultsData | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/surveys/web/${surveyId}/results`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

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

  // -------------------
  // Encabezado
  // -------------------

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4">{results.title} 📊</Typography>
      {results.description && (
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          {results.description}
        </Typography>
      )}
      <Chip
        label={results.active ? "Activa" : results.closed_reason || "Cerrada"}
        color={results.active ? "success" : "error"}
        sx={{ mb: 2 }}
      />
      <Typography>Creada: {results.fecha_creacion || "N/D"}</Typography>
      <Typography>Expira: {results.fecha_expiracion || "N/D"}</Typography>
      <Typography>Patrocinador: {results.patrocinador || "N/D"}</Typography>
      <Typography>Visibilidad: {results.visibilidad_resultados || "N/D"}</Typography>

      {/* -------------------
          KPIs
      ------------------- */}
      <TypedGrid container spacing={3} sx={{ mt: 2 }}>
        <TypedGrid item xs={4}>
          <Card>
            <CardContent>
              <Typography>Participantes</Typography>
              <Typography variant="h4">{results.total_participants}</Typography>
            </CardContent>
          </Card>
        </TypedGrid>
        <TypedGrid item xs={4}>
          <Card>
            <CardContent>
              <Typography>Votos totales</Typography>
              <Typography variant="h4">{results.total_votes}</Typography>
            </CardContent>
          </Card>
        </TypedGrid>
        <TypedGrid item xs={4}>
          <Card>
            <CardContent>
              <Typography>Presupuesto total</Typography>
              <Typography variant="h4">{formatCurrency(results.presupuesto_total)}</Typography>
            </CardContent>
          </Card>
        </TypedGrid>
      </TypedGrid>

      {/* -------------------
          Gráficas
      ------------------- */}
      <TypedGrid container spacing={3} sx={{ mt: 4 }}>
        <TypedGrid item xs={6}>
          <Typography variant="h6">Distribución por opciones</Typography>
          <VictoryPie
            data={(results.options ?? []).map((opt) => ({ x: opt.text, y: opt.votes }))}
            colorScale={["#2196F3", "#4CAF50", "#FF9800", "#F44336"]}
            style={{ data: { stroke: "#fff", strokeWidth: 2 } }}
          />
        </TypedGrid>
        <TypedGrid item xs={6}>
          <Typography variant="h6">Evolución temporal</Typography>
          <VictoryChart>
            <VictoryLine
              data={(results.timeline ?? []).map((t) => ({ x: new Date(t.date), y: t.votes }))}
              style={{ data: { stroke: "#2196F3", strokeWidth: 2 } }}
            />
            <VictoryAxis tickFormat={(t) => new Date(t).toLocaleDateString("es-DO")} />
            <VictoryAxis dependentAxis />
          </VictoryChart>
        </TypedGrid>
      </TypedGrid>

      {/* -------------------
          Segmentación aplicada
      ------------------- */}
      <Typography variant="h6" sx={{ mt: 4 }}>Segmentación aplicada</Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {results.sexo?.map((s) => <Chip key={s} label={s} />)}
        {results.ciudad?.map((c) => <Chip key={c} label={c} />)}
        {results.ocupacion?.map((o) => <Chip key={o} label={o} />)}
        {results.profesion?.map((p) => <Chip key={p} label={p} />)}
        {results.nivel_educativo?.map((n) => <Chip key={n} label={n} />)}
        {results.religion?.map((r) => <Chip key={r} label={r} />)}
        {results.nacionalidad?.map((nac) => <Chip key={nac} label={nac} />)}
        {results.estado_civil?.map((e) => <Chip key={e} label={e} />)}
      </Box>

      {/* -------------------
          Multimedia y fuente externa
      ------------------- */}
      {results.media_url && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6">Portada</Typography>
          <img src={results.media_url} alt="Portada" style={{ maxWidth: "100%" }} />
        </Box>
      )}
      {results.media_urls && results.media_urls.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6">Galería</Typography>
          {results.media_urls.map((url, i) => (
            <img key={i} src={url} alt={`media-${i}`} style={{ maxWidth: "200px", marginRight: "8px" }} />
          ))}
        </Box>
      )}
      {results.source_url && (
        <Typography sx={{ mt: 2 }}>
          Fuente externa: <a href={results.source_url} target="_blank" rel="noopener noreferrer">{results.source_url}</a>
        </Typography>
      )}

      {/* -------------------
          Acciones
      ------------------- */}
      <Button variant="contained" sx={{ mt: 3 }} onClick={() => {
        const rows = [["Opción", "Votos"], ...results.options.map((opt) => [opt.text, opt.votes.toString()])];
        const csvContent = "data:text/csv;charset=utf-8," + rows.map((r) => r.join(",")).join("\n");
        const link = document.createElement("a");
        link.href = encodeURI(csvContent);
        link.download = `resultados_encuesta_${surveyId}.csv`;
        link.click();
      }}>
        Exportar CSV
      </Button>
      <Button variant="outlined" sx={{ mt: 3, ml: 2 }} onClick={async () => {
        try {
          await navigator.clipboard.writeText(`${window.location.origin}/surveys/web/${surveyId}/results`);
          alert("📋 Link copiado al portapapeles");
        } catch {
          alert("No se pudo copiar el link");
        }
      }}>
        Compartir resultados
      </Button>
    </Container>
  );
}
