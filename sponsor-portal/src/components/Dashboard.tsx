// sponsor-portal/src/components/Dashboard.tsx

import { useState, useEffect } from "react";
import { getMe } from "../services/api";
import CreateSurvey from "./CreateSurvey";
import MyPublishedSurveys from "./MyPublishedSurveys";

// Material UI
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";

// Interfaces
interface Survey {
  id: number;
  usuario_id: number;   // 👈 agrega este campo 
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

interface Movimiento {
  id: number;
  monto: number;
  fecha: string;
  patrocinado: boolean;
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

interface DashboardProps {
  onLogout: () => void;
}

// 👉 Helper para formatear fecha
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

export default function Dashboard({ onLogout }: DashboardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);

  const refreshUser = () => {
    const token = localStorage.getItem("token");
    if (token) {
      getMe(token)
        .then(setUser)
        .catch(() => {
          localStorage.removeItem("token");
          setUser(null);
          alert("Tu sesión expiró, inicia sesión de nuevo.");
        });
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  if (!user) return <p>Cargando...</p>;

  const confirmLogout = () => {
    setOpenDialog(false);
    onLogout();
  };

return (
  <div>
    {/* Header */}
    <AppBar position="static" color="default" sx={{ mb: 3 }}>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <img
            src="/assets/logo.png"
            alt="Logo Votapp"
            style={{ height: 90 }}
          />
        </Box>

        {user.rol === "sponsor" && user.wallet && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="body1">
              Bienvenido, {user.nombre} ({user.rol})
            </Typography>
            <Typography
              variant="body1"
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <AccountBalanceWalletIcon fontSize="small" />
              Balance: {user.wallet.balance}
            </Typography>
            <Button
              color="inherit"
              startIcon={<LogoutIcon />}
              onClick={() => setOpenDialog(true)}
            >
              Cerrar sesión
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>

    {/* Diálogo de confirmación */}
    <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
      <DialogTitle>Confirmar cierre de sesión</DialogTitle>
      <DialogContent>
        <Typography>¿Seguro que quieres cerrar sesión?</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
        <Button color="error" onClick={confirmLogout}>
          Cerrar sesión
        </Button>
      </DialogActions>
    </Dialog>

    {/* Tabs */}
    {user.rol === "sponsor" && user.wallet ? (
      <>
      <Tabs
        value={tab}
        onChange={(e, newVal) => setTab(newVal)}
        sx={{ mb: 3 }}
      >
        <Tab label="Crear encuesta" />
        <Tab label="Mis encuestas publicadas (viejo)" />
        <Tab label="Mis encuestas publicadas (nuevo)" /> {/* 👈 nueva pestaña */}
      </Tabs>


        {tab === 0 && <CreateSurvey onCreated={refreshUser} />}

        {tab === 1 && (
          <>
            <Typography variant="h5" sx={{ mb: 2 }}>
              Encuestas patrocinadas
            </Typography>

            {user.wallet.movimientos.length === 0 ? (
              <Typography>No tienes encuestas publicadas aún.</Typography>
            ) : (
              [...user.wallet.movimientos]
                .sort((a, b) => {
                  const fechaA = new Date(a.survey.fecha_creacion ?? "").getTime();
                  const fechaB = new Date(b.survey.fecha_creacion ?? "").getTime();
                  return fechaB - fechaA; // más nuevas primero
                })
                .filter((m) => m.survey?.usuario_id === user.id)
                .map((m) => (
                  <Card key={m.id} sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6">{m.survey.title}</Typography>
                      <Typography variant="body2">
                        Monto invertido: {m.monto} tokens
                      </Typography>
                      <Typography variant="body2">
                        Presupuesto total: {m.survey.presupuesto_total}
                      </Typography>
                      <Typography variant="body2">
                        Creada:{" "}
                        {m.survey.fecha_creacion
                          ? formatFecha(m.survey.fecha_creacion)
                          : "No registrada"}
                      </Typography>
                      <Typography variant="body2">
                        Expira:{" "}
                        {m.survey.fecha_expiracion
                          ? formatFecha(m.survey.fecha_expiracion)
                          : "No definida"}
                      </Typography>
                      <Typography variant="body2">
                        Visibilidad: {m.survey.visibilidad_resultados}
                      </Typography>
                      <Typography variant="body2">
                        Recompensa: {m.survey.recompensa_puntos ?? 0} puntos /{" "}
                        {m.survey.recompensa_dinero ?? 0} tokens
                      </Typography>
                      <Typography variant="body2">
                        Patrocinada: {m.survey.patrocinada ? "Sí" : "No"}
                      </Typography>
                      {m.survey.patrocinador && (
                        <Typography variant="body2">
                          Patrocinador: {m.survey.patrocinador}
                        </Typography>
                      )}
                      <Typography variant="body2">
                        Estado: {m.survey.active ? "Activa" : "Cerrada"}
                      </Typography>

                      {/* Segmentación */}
                      {m.survey.sexo && (
                        <Typography variant="body2">
                          Sexo:{" "}
                          {Array.isArray(m.survey.sexo)
                            ? m.survey.sexo.join(", ")
                            : m.survey.sexo}
                        </Typography>
                      )}
                      {m.survey.ciudad && (
                        <Typography variant="body2">
                          Ciudad:{" "}
                          {Array.isArray(m.survey.ciudad)
                            ? m.survey.ciudad.join(", ")
                            : m.survey.ciudad}
                        </Typography>
                      )}
                      {m.survey.ocupacion && (
                        <Typography variant="body2">
                          Ocupación:{" "}
                          {Array.isArray(m.survey.ocupacion)
                            ? m.survey.ocupacion.join(", ")
                            : m.survey.ocupacion}
                        </Typography>
                      )}
                      {m.survey.profesion && (
                        <Typography variant="body2">
                          Profesión:{" "}
                          {Array.isArray(m.survey.profesion)
                            ? m.survey.profesion.join(", ")
                            : m.survey.profesion}
                        </Typography>
                      )}
                      {m.survey.nivel_educativo && (
                        <Typography variant="body2">
                          Nivel educativo:{" "}
                          {Array.isArray(m.survey.nivel_educativo)
                            ? m.survey.nivel_educativo.join(", ")
                            : m.survey.nivel_educativo}
                        </Typography>
                      )}
                      {m.survey.religion && (
                        <Typography variant="body2">
                          Religión:{" "}
                          {Array.isArray(m.survey.religion)
                            ? m.survey.religion.join(", ")
                            : m.survey.religion}
                        </Typography>
                      )}
                      {m.survey.nacionalidad && (
                        <Typography variant="body2">
                          Nacionalidad:{" "}
                          {Array.isArray(m.survey.nacionalidad)
                            ? m.survey.nacionalidad.join(", ")
                            : m.survey.nacionalidad}
                        </Typography>
                      )}
                      {m.survey.estado_civil && (
                        <Typography variant="body2">
                          Estado civil:{" "}
                          {Array.isArray(m.survey.estado_civil)
                            ? m.survey.estado_civil.join(", ")
                            : m.survey.estado_civil}
                        </Typography>
                      )}

                      {/* Fuente externa */}
                      {m.survey.source_url && (
                        <Typography variant="body2">
                          Fuente:{" "}
                          <a href={m.survey.source_url}>
                            {m.survey.source_url}
                          </a>
                        </Typography>
                      )}

                      {/* Media */}
                      {m.survey.media_url &&
                        (m.survey.media_url.endsWith(".mp4") ? (
                          <video
                            src={m.survey.media_url}
                            controls
                            style={{ maxWidth: "300px", marginTop: "0.5rem" }}
                          />
                        ) : (
                          <img
                            src={m.survey.media_url}
                            alt="Media de encuesta"
                            style={{ maxWidth: "300px", marginTop: "0.5rem" }}
                          />
                        ))}
                      {m.survey.media_urls &&
                        m.survey.media_urls.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            {m.survey.media_urls.map((url, idx) =>
                              url.endsWith(".mp4") ? (
                                <video
                                  key={idx}
                                  src={url}
                                  controls
                                  style={{
                                    maxWidth: "300px",
                                    marginRight: "0.5rem",
                                  }}
                                />
                              ) : (
                                <img
                                  key={idx}
                                  src={url}
                                  alt={`Media ${idx + 1}`}
                                  style={{
                                    maxWidth: "300px",
                                    marginRight: "0.5rem",
                                  }}
                                />
                              )
                            )}
                          </Box>
                        )}
                    </CardContent>
                  </Card>
                ))
            )}
          </>
        )}

        {tab === 2 && (
          <>
            <Typography variant="h5" sx={{ mb: 2 }}>
              Encuestas patrocinadas (versión nueva)
            </Typography>
            <MyPublishedSurveys user={user} /> {/* 👈 nueva implementación */}
          </>
        )}
      </>
    ) : (
      <p>
        Este es tu panel de usuario. No tienes wallet ni encuestas patrocinadas.
      </p>
    )}
  </div>
);
}
