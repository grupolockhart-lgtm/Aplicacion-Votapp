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

interface FieldErrors {
  email?: string;
  companyName?: string;
  password?: string;
  phone?: string;
  rnc?: string;
  general?: string;
}

export default function RegisterSponsor({ onRegister }: RegisterSponsorProps) {
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [rnc, setRnc] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

  // Validación frontend antes de enviar
  if (!email || !email.includes("@")) {
    setErrors({ email: "Debes ingresar un correo válido con @" });
    return;
  }
  if (!companyName.trim()) {
    setErrors({ companyName: "El nombre de la empresa es obligatorio" });
    return;
  }
  if (password.length < 6) {
    setErrors({ password: "La contraseña debe tener al menos 6 caracteres" });
    return;
  }

    setLoading(true);

    try {
      const data = await registerSponsor({
        companyName,
        email,
        password,
        phone,
        rnc
      });

      console.log("Respuesta backend:", data);

      if (data.access_token) {
        localStorage.setItem("token", data.access_token);
        setErrors({}); // limpia cualquier error previo
        onRegister();   // redirige al dashboard
        return;         // evita que siga evaluando y setee error
      }

      if (data.error) {
        const field = data.field;
        if (field) {
          setErrors({ [field]: data.error });
        } else {
          setErrors({ general: data.error });
        }
      } else {
        setErrors({ general: "Error en el registro o respuesta inesperada." });
      }
    } catch (err: any) {
      console.error("Error en frontend:", err);
      if (err.response && err.response.data) {
        const backendError = err.response.data.error || err.response.data.detail;
        const field = err.response.data.field;

        if (field) {
          setErrors({ [field]: backendError });
        } else {
          setErrors({ general: backendError || "Error al registrarse. Intenta de nuevo." });
        }
      } else {
        setErrors({ general: "Error al registrarse. Intenta de nuevo." });
      }
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
            InputLabelProps={{ shrink: true }}
            autoComplete="organization"
            error={Boolean(errors.companyName)}
            helperText={errors.companyName}
          />
          <TextField
            label="Correo electrónico"
            type="email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            InputLabelProps={{ shrink: true }}
            autoComplete="email"
            error={Boolean(errors.email)}
            helperText={errors.email}
          />
          <TextField
            label="Contraseña"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputLabelProps={{ shrink: true }}
            autoComplete="new-password"
            error={Boolean(errors.password)}
            helperText={errors.password}
          />
          <TextField
            label="Teléfono (opcional)"
            fullWidth
            margin="normal"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            InputLabelProps={{ shrink: true }}
            autoComplete="tel"
            error={Boolean(errors.phone)}
            helperText={errors.phone}
          />
          <TextField
            label="RNC / Identificación fiscal (opcional)"
            fullWidth
            margin="normal"
            value={rnc}
            onChange={(e) => setRnc(e.target.value)}
            InputLabelProps={{ shrink: true }}
            autoComplete="off"
            error={Boolean(errors.rnc)}
            helperText={errors.rnc}
          />

          {errors.general && (
            <>
              {console.log("Renderizando error general:", errors.general)}
              <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                {errors.general}
              </Typography>
            </>
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
