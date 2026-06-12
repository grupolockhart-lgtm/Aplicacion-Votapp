// sponsor-portal/src/components/Login.tsx

import { useState } from "react";
import { login } from "../services/api";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  CircularProgress
} from "@mui/material";
import LoginIcon from "@mui/icons-material/Login";

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await login(email, password);

      if (data.access_token) {
        localStorage.setItem("token", data.access_token);
        onLogin();   // 👈 activa el estado en App.js
      } else {
        setError("Credenciales inválidas o respuesta inesperada.");
      }
    } catch (err) {
      setError("Error al iniciar sesión. Intenta de nuevo.");
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
      <Paper elevation={4} sx={{ p: 4, width: 400, textAlign: "center" }}>
        {/* 👇 Logo desde public/assets */}
        <Box sx={{ mb: 2 }}>
          <img
            src="/assets/logo.png"
            alt="Logo compañía"
            style={{ width: 120 }}
          />
        </Box>

        <Typography variant="h5" gutterBottom>
          Portal de Sponsors
        </Typography>

        <form onSubmit={handleSubmit}>
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
              startIcon={loading ? null : <LoginIcon />}
            >
              {loading ? <CircularProgress size={24} /> : "Entrar"}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}
