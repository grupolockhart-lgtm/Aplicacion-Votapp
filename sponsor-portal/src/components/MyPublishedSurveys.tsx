
// sponsor-portal/src/components/MyPublishedSurveys.tsx

import React, { useState, useEffect } from "react";
import SurveyEditDialog from "./SurveyEditDialog";
import { useNavigate } from "react-router-dom";
import { ENDPOINTS } from "../config/api"; // 👈 importa tus endpoints centralizados
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  CardMedia,
  Chip,
  Grid,
  CardActions
} from "@mui/material";

import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";


// -------------------
// Interfaces
// -------------------


interface Survey {
  id: number;
  survey_id?: number;         // 👈 id público para resultados
  usuario_id: number;
  title: string;
  description: string;
  fecha_expiracion: string;
  fecha_creacion?: string;
  visibilidad_resultados: string;
  presupuesto_total: number;
  recompensa_puntos?: number;
  recompensa_dinero?: number;
  patrocinada?: boolean;
  patrocinador?: string;
  active?: boolean;

  // 👇 nuevos campos que ya devuelve el backend
  closed_reason?: "expired" | "funds" | "paused" | null;
  closed_at?: string | null;

  // Segmentación
  sexo?: string[] | string;
  ciudad?: string[] | string;
  ocupacion?: string[] | string;
  profesion?: string[] | string;
  nivel_educativo?: string[] | string;
  religion?: string[] | string;
  nacionalidad?: string[] | string;
  estado_civil?: string[] | string;

  // Media
  source_url?: string;
  media_url?: string;
  media_urls?: string[];
  media_files?: File[];
}

interface Movimiento {
  id: number;
  monto: number;
  fecha: string;
  survey: Survey;
}

interface Wallet {
  id: number;
  balance: number;
  movimientos: Movimiento[];
}

interface User {
  id: number;
  nombre: string;
  rol: string;
  wallet: Wallet | null;
}


// -------------------
// Utilidades
// -------------------

const formatFecha = (fecha?: string) => {
  if (!fecha) return "Sin fecha";
  try {
    let fechaNormalizada = fecha;
    if (!fecha.endsWith("Z") && !fecha.includes("+")) {
      fechaNormalizada = fecha + "Z";
    }
    const parsed = new Date(fechaNormalizada);
    return isNaN(parsed.getTime()) ? "Fecha inválida" : parsed.toLocaleString();
  } catch {
    return "Fecha inválida";
  }
};


// -------------------
// Componente principal
// -------------------

export default function MyPublishedSurveys({ user }: { user: User }) {
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const navigate = useNavigate();


// -------------------
// fetchSurveys (GET encuestas publicadas)
// ------------------- 

// 👉 Función para refrescar encuestas desde backend
const fetchSurveys = async () => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      console.warn("No hay token, redirigiendo al login...");
      navigate("/login");
      return;
    }

    const res = await fetch(ENDPOINTS.surveys.publishedMine, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    // 👇 Manejo específico de token inválido
    if (res.status === 401) {
      console.error("Token inválido o expirado, redirigiendo al login...");
      localStorage.removeItem("token"); // limpia token viejo
      navigate("/login");
      return;
    }

    const contentType = res.headers.get("content-type");
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Error ${res.status}: ${text}`);
    }

    if (contentType && contentType.includes("application/json")) {
      const surveys: Survey[] = await res.json();
      console.log("Encuestas recibidas:", surveys);

      const movimientosActualizados: Movimiento[] = surveys.map((s: Survey) => ({
        id: s.id,
        monto: s.presupuesto_total ?? 0,
        fecha: s.fecha_creacion ?? "",
        survey: s,
      }));

      // 🔎 Depuración: imprime cada encuesta para revisar usuario_id y otros campos
      movimientosActualizados.forEach((m, i) => {
        console.log(`Movimiento ${i}:`, m.survey);
      });

      // 👉 Mantener estado si la respuesta llega vacía
      if (movimientosActualizados.length > 0) {
        console.log("Actualizando movimientos con:", movimientosActualizados);
        setMovimientos(movimientosActualizados);
      } else {
        console.warn("Respuesta vacía, manteniendo estado actual");
      }
    } else {
      const text = await res.text();
      throw new Error(`Respuesta no JSON: ${text}`);
    }
  } catch (error) {
    console.error("Error al cargar encuestas:", error);
  }
};

  useEffect(() => {
    fetchSurveys();
  }, []);

  if (movimientos.length === 0) {
    return <Typography>No tienes encuestas publicadas aún.</Typography>;
  }



  // -------------------
  // handleEdit (abrir diálogo edición)
  // -------------------


  const handleEdit = (survey: Survey) => {
    setSelectedSurvey(survey);
    setOpenEditDialog(true);
  };


  // -------------------
  // handleSaveSurvey (PUT encuesta)
  // -------------------

const handleSaveSurvey = async (updatedSurvey: Survey) => {
  if (!selectedSurvey) return;

  const mergedSurvey = { ...selectedSurvey, ...updatedSurvey };
  const token = localStorage.getItem("token");

  try {
    const formData = new FormData();
    formData.append("title", mergedSurvey.title);
    formData.append("description", mergedSurvey.description);
    if (mergedSurvey.fecha_expiracion) {
      formData.append("fecha_expiracion", new Date(mergedSurvey.fecha_expiracion).toISOString());
    }
    formData.append("presupuesto_total", mergedSurvey.presupuesto_total.toString());
    formData.append("recompensa_puntos", (mergedSurvey.recompensa_puntos ?? 0).toString());
    formData.append("recompensa_dinero", (mergedSurvey.recompensa_dinero ?? 0).toString());
    formData.append("visibilidad_resultados", mergedSurvey.visibilidad_resultados);

    // Segmentación
    formData.append("sexo", JSON.stringify(mergedSurvey.sexo ?? []));
    formData.append("ciudad", JSON.stringify(mergedSurvey.ciudad ?? []));
    formData.append("ocupacion", JSON.stringify(mergedSurvey.ocupacion ?? []));
    formData.append("profesion", JSON.stringify(mergedSurvey.profesion ?? []));
    formData.append("nivel_educativo", JSON.stringify(mergedSurvey.nivel_educativo ?? []));
    formData.append("religion", JSON.stringify(mergedSurvey.religion ?? []));
    formData.append("nacionalidad", JSON.stringify(mergedSurvey.nacionalidad ?? []));
    formData.append("estado_civil", JSON.stringify(mergedSurvey.estado_civil ?? []));

    // 👇 Portada como archivo
    if (mergedSurvey.media_files && mergedSurvey.media_files.length > 0) {
    formData.append("media_url", mergedSurvey.media_files[0]);
    }

    // 👇 Portada como URL existente
    if (mergedSurvey.media_url && !mergedSurvey.media_url.startsWith("blob:")) {
    formData.append("portada_url", mergedSurvey.media_url);
    }


    // 👇 Galería 
    if (mergedSurvey.media_urls) {
      const urlsValidas = [...new Set(mergedSurvey.media_urls.filter(u => !u.startsWith("blob:")))];
      if (urlsValidas.length > 0) {
        formData.append("media_urls", JSON.stringify(urlsValidas));
      }
    }

    // 👇 Archivos nuevos
    if (mergedSurvey.media_files) {
      mergedSurvey.media_files.forEach((file) => {
        formData.append("media_files", file);
      });
    }


    // Depuración: imprime FormData
    for (const [key, value] of formData.entries()) {
      console.log("➡️", key, value);
    }

    const res = await fetch(`http://localhost:8000/api/surveys/${mergedSurvey.id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) {
    const text = await res.text();
    console.error("❌ Error backend:", text);
    throw new Error(`Error ${res.status}: ${text}`);
    }

    const result = await res.json();
    console.log("Respuesta backend:", result);

    setMovimientos((prev) =>
      prev.map((m) =>
        m.survey.id === mergedSurvey.id ? { ...m, survey: result } : m
      )
    );

    fetchSurveys();
    setOpenEditDialog(false);
  } catch (error) {
    console.error("Error al guardar encuesta:", error);
  }
};

// -------------------
// handlePauseSurvey (PATCH pausar encuesta)
// -------------------

const handlePauseSurvey = async (surveyId: number) => {
  if (!window.confirm("¿Seguro que quieres pausar esta encuesta?")) return;

  try {
    const token = localStorage.getItem("token");
    await fetch(`http://localhost:8000/api/surveys/${surveyId}/pause`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setMovimientos((prev) =>
      prev.map((m) =>
        m.survey.id === surveyId
          ? { ...m, survey: { ...m.survey, active: false, closed_reason: "paused" } }
          : m
      )
    );

    fetchSurveys();
    alert("✅ Encuesta pausada correctamente");
  } catch (error) {
    console.error("Error al pausar encuesta:", error);
    alert("❌ No se pudo pausar la encuesta");
  }
};


// -------------------
// handleResumeSurvey (PATCH reanudar encuesta)
// -------------------

const handleResumeSurvey = async (surveyId: number) => {
  if (!window.confirm("¿Seguro que quieres reanudar esta encuesta?")) return;

  try {
    const token = localStorage.getItem("token");
    await fetch(`http://localhost:8000/api/surveys/${surveyId}/resume`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setMovimientos((prev) =>
      prev.map((m) =>
        m.survey.id === surveyId
          ? { ...m, survey: { ...m.survey, active: true, closed_reason: null } }
          : m
      )
    );

    fetchSurveys();
    alert("✅ Encuesta reanudada correctamente");
  } catch (error) {
    console.error("Error al reanudar encuesta:", error);
    alert("❌ No se pudo reanudar la encuesta");
  }
};





  // -------------------
  // handleResults (navegar a resultados)
  // -------------------

  const handleResults = (surveyId: number) => {
    navigate(`/surveys/web/${surveyId}/results`);
  };




// -------------------
// return JSX
// -------------------
return (
  <>
    {/* -------------------
        Grid de encuestas publicadas
        ------------------- */}
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",          // 1 columna en móviles
          sm: "1fr 1fr",      // 2 columnas en pantallas pequeñas/medianas
          lg: "1fr 1fr 1fr"   // 3 columnas en pantallas grandes
        },
        gap: 3
      }}
    >
      {[...movimientos]
        .sort((a, b) => {
          const fechaA = new Date(a.survey.fecha_creacion ?? "").getTime();
          const fechaB = new Date(b.survey.fecha_creacion ?? "").getTime();
          return fechaB - fechaA;
        })
        .filter((m) => !!m.survey)
        .map((m) => {
          console.log("Encuesta:", m.survey); // 👈 aquí ves el objeto completo en consola

          return (
            <Card key={m.id} sx={{ borderRadius: 2, boxShadow: 3 }}>
              {/* -------------------
                  Imagen principal resumida
                  ------------------- */}
              {m.survey.media_url && (
                m.survey.media_url.endsWith(".mp4") ? (
                  <CardMedia
                    component="video"
                    src={m.survey.media_url}
                    controls
                    height="140"
                    sx={{ objectFit: "cover" }}
                  />
                ) : (
                  <CardMedia
                    component="img"
                    image={m.survey.media_url}
                    height="140"
                    sx={{ objectFit: "cover" }}
                  />
                )
              )}

              <CardContent>
                {/* -------------------
                    Título y estado
                    ------------------- */}
                <Typography variant="h6" sx={{ fontWeight: "bold" }} gutterBottom>
                  {m.survey.title}
                </Typography>

                <Chip
                  label={
                    !m.survey.active
                      ? m.survey.closed_reason === "funds"
                        ? "💸 Fondos agotados"
                        : m.survey.closed_reason === "paused"
                        ? "⏸️ Pausada"
                        : "🔒 Cerrada"
                      : new Date(m.survey.fecha_expiracion) < new Date()
                      ? "⏰ Expirada"
                      : "✅ Activa"
                  }
                  color={
                    !m.survey.active
                      ? m.survey.closed_reason === "paused"
                        ? "warning"
                        : "error"
                      : new Date(m.survey.fecha_expiracion) < new Date()
                      ? "warning"
                      : "success"
                  }
                  size="small"
                  sx={{ mb: 1 }}
                />

                <Typography variant="body2" color="text.secondary">
                  Creada: {m.survey.fecha_creacion ? formatFecha(m.survey.fecha_creacion) : "No registrada"} | Expira:{" "}
                  {m.survey.fecha_expiracion ? formatFecha(m.survey.fecha_expiracion) : "No definida"}
                </Typography>
              </CardContent>

              {/* -------------------
                  Accordion para detalles
                  ------------------- */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="body2">Ver más detalles</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {/* Detalles en Grid */}
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2">Descripción: {m.survey.description || "Sin descripción"}</Typography>
                      <Typography variant="body2">Monto invertido: {m.monto} tokens</Typography>
                      <Typography variant="body2">Presupuesto total: {m.survey.presupuesto_total}</Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Typography variant="body2">Visibilidad: {m.survey.visibilidad_resultados}</Typography>
                      <Typography variant="body2">
                        Recompensa: {m.survey.recompensa_puntos ?? 0} puntos / {m.survey.recompensa_dinero ?? 0} tokens
                      </Typography>
                      <Typography variant="body2">Patrocinada: {m.survey.patrocinada ? "Sí" : "No"}</Typography>
                      {m.survey.patrocinador && <Typography variant="body2">Patrocinador: {m.survey.patrocinador}</Typography>}
                    </Grid>
                  </Grid>

                  {/* Fuente externa */}
                  {m.survey.source_url && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Fuente:{" "}
                      <a href={m.survey.source_url} target="_blank" rel="noopener noreferrer">
                        {m.survey.source_url}
                      </a>
                    </Typography>
                  )}

                  {/* Segmentación */}
                  <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: "bold" }}>
                    Segmentación:
                  </Typography>
                  <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
                    <li>Sexo: {Array.isArray(m.survey.sexo) ? m.survey.sexo.join(", ") : m.survey.sexo || "Todos"}</li>
                    <li>Ciudades: {Array.isArray(m.survey.ciudad) ? m.survey.ciudad.join(", ") : m.survey.ciudad || "Todas"}</li>
                    <li>Ocupaciones: {Array.isArray(m.survey.ocupacion) ? m.survey.ocupacion.join(", ") : m.survey.ocupacion || "Todas"}</li>
                    <li>Profesiones: {Array.isArray(m.survey.profesion) ? m.survey.profesion.join(", ") : m.survey.profesion || "Todas"}</li>
                    <li>Nivel educativo: {Array.isArray(m.survey.nivel_educativo) ? m.survey.nivel_educativo.join(", ") : m.survey.nivel_educativo || "Todos"}</li>
                    <li>Religión: {Array.isArray(m.survey.religion) ? m.survey.religion.join(", ") : m.survey.religion || "Todas"}</li>
                    <li>Nacionalidad: {Array.isArray(m.survey.nacionalidad) ? m.survey.nacionalidad.join(", ") : m.survey.nacionalidad || "Todas"}</li>
                    <li>Estado civil: {Array.isArray(m.survey.estado_civil) ? m.survey.estado_civil.join(", ") : m.survey.estado_civil || "Todos"}</li>
                  </ul>

                  {/* Galería de media */}
                  {m.survey.media_urls && m.survey.media_urls.length > 0 && (
                    <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {m.survey.media_urls.map((url, idx) =>
                        url.endsWith(".mp4") ? (
                          <video key={idx} src={url} controls style={{ maxWidth: "200px", borderRadius: "4px" }} />
                        ) : (
                          <img key={idx} src={url} alt={`Media ${idx + 1}`} style={{ maxWidth: "200px", borderRadius: "4px" }} />
                        )
                      )}
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>

              {/* -------------------
                  Botones en CardActions
                  ------------------- */}
              <CardActions sx={{ justifyContent: "flex-end", px: 2, pb: 2 }}>
                <Button size="small" variant="outlined" onClick={() => handleEdit(m.survey)}>
                  Editar
                </Button>
                {m.survey.active && new Date(m.survey.fecha_expiracion) >= new Date() && (
                  <Button size="small" variant="outlined" color="warning" onClick={() => handlePauseSurvey(m.survey.id)}>
                    Pausar
                  </Button>
                )}
                {!m.survey.active && m.survey.closed_reason === "paused" && (
                  <Button size="small" variant="outlined" color="success" onClick={() => handleResumeSurvey(m.survey.id)}>
                    Reanudar
                  </Button>
                )}
                <Button size="small" variant="contained" onClick={() => handleResults(m.survey.id)}>
                  Ver resultados
                </Button>
              </CardActions>
            </Card>
          );
        })}
    </Box>

    {/* -------------------
        Diálogo de edición
        ------------------- */}
    <SurveyEditDialog
      open={openEditDialog}
      survey={selectedSurvey}
      onClose={() => setOpenEditDialog(false)}
      onSave={handleSaveSurvey}
      walletBalance={user.wallet?.balance ?? 0}
    />
  </>
); // 👈 cierre del return
} // 👈 cierre de la función
