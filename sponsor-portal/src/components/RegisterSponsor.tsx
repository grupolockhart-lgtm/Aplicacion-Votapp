// sponsor-portal/src/components/RegisterSponsor.tsx

import { useState } from "react";
import { registerSponsor } from "../services/api"; // 👈 función definida en api.js
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  CircularProgress
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";

interface RegisterSponsorProps {
  onRegister: () => void;
}

export default function RegisterSponsor({ onRegister }: RegisterSponsorProps) {
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [rnc, setRnc] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await registerSponsor({
        companyName,
        email,
        password,
        phone,
        rnc
      });

      if (data.access_token) {
        localStorage.setItem("token", data.access_token);
        onRegister(); // 👈 activa el estado en App.js y redirige al dashboard
      } else {
        setError("Error en el registro o respuesta inesperada.");
      }
    } catch (err) {
      setError("Error al registrarse. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        bgcolor: "#f5f5f5"
      }}
    >
      <Paper elevation={4} sx={{ p: 4, width: 450, textAlign: "center" }}>
        {/* 👇 Logo desde public/assets */}
        <Box sx={{ mb: 2 }}>
          <img
            src="/assets/logo.png"
            alt="Logo compañía"
            style={{ width: 120 }}
          />
        </Box>

        <Typography variant="h5" gutterBottom>
          Registro de Sponsor
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            label="Nombre / Razón social"
            fullWidth
            margin="normal"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
          <TextField
            label="Correo electrónico"
            type="email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Contraseña"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <TextField
            label="Teléfono (opcional)"
            fullWidth
            margin="normal"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <TextField
            label="RNC / Identificación fiscal (opcional)"
            fullWidth
            margin="normal"
            value={rnc}
            onChange={(e) => setRnc(e.target.value)}
          />

          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}

          <Box sx={{ mt: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              fullWidth
              startIcon={loading ? null : <PersonAddIcon />}
            >
              {loading ? <CircularProgress size={24} /> : "Registrarse"}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}
