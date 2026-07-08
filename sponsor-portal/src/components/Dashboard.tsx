// sponsor-portal/src/components/Dashboard.tsx

// -------------------
// Imports
// -------------------

import { useState, useEffect } from "react";
import { getMe } from "../services/api";
import CreateSurvey from "./CreateSurvey";
import MyPublishedSurveys from "./MyPublishedSurveys";
import Layout from "./Layout";

// -------------------
// Material UI
// -------------------

import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { useLocation } from "react-router-dom";

// -------------------
// Interfaces
// -------------------

interface Survey {
  id: number;
  usuario_id: number;   // 👈 agregado
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
  company_name?: string;   // 👈 nuevo campo
  rol: string;
  wallet: Wallet | null;
}

interface DashboardProps {
  onLogout: () => void;
}

// -------------------
// Componente principal
// -------------------

export default function Dashboard({ onLogout }: DashboardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);

  const location = useLocation(); // 👈 para leer el state

  // -------------------
  // Refresh user
  // -------------------

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

  // 👇 nuevo efecto para abrir la pestaña correcta
  useEffect(() => {
    if (location.state?.tab !== undefined) {
      setTab(location.state.tab);
    }
  }, [location.state]); 

  if (!user) return <p>Cargando...</p>;

  // -------------------
  // Confirm logout
  // -------------------

  const confirmLogout = () => {
    setOpenDialog(false);
    onLogout();
  };

  // -------------------
  // Render principal
  // -------------------
  return (
    <Layout user={user} onLogout={() => setOpenDialog(true)}>
      {/* -------------------
          Diálogo de confirmación
      ------------------- */}
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

      {/* -------------------
          Tabs
      ------------------- */}
      {user.rol === "sponsor" && user.wallet ? (
        <>
          {/* 👇 Mostrar nombre de sponsor */}
          <Typography variant="h6" sx={{ mb: 2 }}>
            Bienvenido {user.company_name ?? user.nombre}
          </Typography>

          <Tabs
            value={tab}
            onChange={(e, newVal) => setTab(newVal)}
            sx={{ mb: 3 }}
          >
            <Tab label="Crear encuesta" />
            <Tab label="Mis encuestas publicadas" />
          </Tabs>

          {/* -------------------
              Contenido de pestañas
          ------------------- */}

          {/* Tab 0 - Crear Encuestas */}
          {tab === 0 && <CreateSurvey onCreated={refreshUser} />}

          {/* Tab 1 - Mis encuestas publicadas */}
          {tab === 1 && (
            <>
              <Typography variant="h5" sx={{ mb: 2 }}>
                Encuestas patrocinadas
              </Typography>
              <MyPublishedSurveys user={user} />
            </>
          )}
        </>
      ) : (
        <p>
          Este es tu panel de usuario. No tienes wallet ni encuestas patrocinadas.
        </p>
      )}
    </Layout>
  );
}

