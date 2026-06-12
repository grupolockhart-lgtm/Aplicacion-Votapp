// sponsor-portal/src/components/SurveyEditDialog.tsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Snackbar,
  Alert,
} from "@mui/material";

interface Survey {
  id: number;
  title: string;
  description: string;
  fecha_expiracion: string;
  fecha_creacion?: string;
  presupuesto_total?: number;
  recompensa_puntos?: number;
  recompensa_dinero?: number;
  media_url?: string;
  media_urls?: string[];
  media_files?: File[];
}

interface SurveyEditDialogProps {
  open: boolean;
  survey: Survey | null;
  onClose: () => void;
  onSave: (updatedSurvey: Survey) => void;
  walletBalance: number;
}

export default function SurveyEditDialog({
  open,
  survey,
  onClose,
  onSave,
  walletBalance,
}: SurveyEditDialogProps) {
  const [formData, setFormData] = useState<Survey | null>(survey);
  const [errorPresupuesto, setErrorPresupuesto] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

  // -------------------
  // Estado: tiempo restante
  // -------------------
  const [tiempoRestante, setTiempoRestante] = useState<{dias:number,horas:number,minutos:number,segundos:number}|null>(null);

  useEffect(() => {
    setFormData(survey);
    setErrorPresupuesto(null);
    setSnackbarOpen(false);

    if (survey?.fecha_expiracion) {
      const calcularTiempoRestante = (fechaExp: string) => {
        const diffMs = new Date(fechaExp).getTime() - new Date().getTime();
        if (diffMs <= 0) return null;
        const segundos = Math.floor(diffMs / 1000) % 60;
        const minutos = Math.floor(diffMs / (1000 * 60)) % 60;
        const horas = Math.floor(diffMs / (1000 * 60 * 60)) % 24;
        const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        return { dias, horas, minutos, segundos };
      };

      const interval = setInterval(() => {
        setTiempoRestante(calcularTiempoRestante(survey.fecha_expiracion));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [survey]);

  if (!formData) return null;

  // -------------------
  // handleChange
  // -------------------
  const handleChange = (field: keyof Survey, value: any) => {
    const updated = { ...formData, [field]: value };

    if (field === "presupuesto_total") {
      if (value > walletBalance) {
        setErrorPresupuesto(
          `El presupuesto no puede exceder tu balance disponible (${walletBalance} tokens)`
        );
        setSnackbarMessage(
          `El presupuesto no puede exceder tu balance disponible (${walletBalance} tokens)`
        );
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      } else {
        setErrorPresupuesto(null);
      }
    }

    setFormData(updated);
  };

  // -------------------
  // handleFileChange
  // -------------------
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const portada = files[0];           // primer archivo = portada
    const galeria = files.slice(1);     // resto = galería

    setFormData({
      ...formData!,
      media_url: URL.createObjectURL(portada), // preview portada
      media_files: [portada, ...galeria],      // archivos reales para enviar
      media_urls: [
        ...(formData?.media_urls || []),
        ...galeria.map(f => URL.createObjectURL(f)) // previews galería
      ],
    });
  };

  // -------------------
  // handleSave
  // -------------------
  const handleSave = () => {
    if (formData) {
      if (formData.presupuesto_total && formData.presupuesto_total > walletBalance) {
        setErrorPresupuesto(
          `El presupuesto no puede exceder tu balance disponible (${walletBalance} tokens)`
        );
        setSnackbarMessage(
          `El presupuesto no puede exceder tu balance disponible (${walletBalance} tokens)`
        );
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        return;
      }

      onSave({
        id: formData.id,
        title: formData.title,
        description: formData.description,
        fecha_expiracion: formData.fecha_expiracion,
        fecha_creacion: formData.fecha_creacion,
        presupuesto_total: formData.presupuesto_total,
        recompensa_puntos: formData.recompensa_puntos,
        recompensa_dinero: formData.recompensa_dinero,
        media_url: formData.media_url,
        media_urls: formData.media_urls.filter(url => !url.startsWith("blob:")), 
        media_files: formData.media_files,
      });

      setSnackbarMessage("Encuesta guardada correctamente ✅");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      onClose();
    }
  };

  // -------------------
  // return JSX
  // -------------------




return (
  <>

    {/* -------------------
        Diálogo principal
        ------------------- */}

    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Editar encuesta</DialogTitle>


      {/* -------------------
          Contenido del diálogo
          ------------------- */}      
            
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
        <TextField
          label="Título"
          value={formData.title}
          onChange={(e) => handleChange("title", e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Descripción"
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          fullWidth
          multiline
          rows={3}
          margin="normal"
        />


        {/* -------------------
            Fechas y contador
            ------------------- */}

        {/* Fecha de creación */}
        <Typography variant="body2" color="text.secondary">
          Fecha de creación:{" "}
          {formData.fecha_creacion
            ? new Date(formData.fecha_creacion).toLocaleString("es-ES", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "No registrada"}
        </Typography>

        {/* Fecha de expiración actual */}
        <Typography variant="body2" color="text.secondary">
          Fecha de expiración actual:{" "}
          {formData.fecha_expiracion
            ? new Date(formData.fecha_expiracion).toLocaleString("es-ES", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "No definida"}
        </Typography>

        {/* Contador en vivo */}
        {tiempoRestante ? (
          <Typography
            variant="body2"
            sx={{ mt: 1, color: tiempoRestante.dias === 0 ? "error.main" : "text.secondary" }}
          >
            Tiempo restante: {tiempoRestante.dias}d {tiempoRestante.horas}h {tiempoRestante.minutos}m {tiempoRestante.segundos}s
          </Typography>
        ) : (
          <Typography variant="body2" sx={{ mt: 1 }} color="error">
            Expirada o sin fecha
          </Typography>
        )}

        <TextField
          label="Fecha de expiración"
          type="datetime-local"
          value={formData.fecha_expiracion}
          onChange={(e) => handleChange("fecha_expiracion", e.target.value)}
          slotProps={{
            inputLabel: { shrink: true },
          }}
          fullWidth
          margin="normal"
        />


        {/* -------------------
            Presupuesto y recompensas
            ------------------- */}

        {/* Balance disponible */}
        <Typography variant="body2" color="text.secondary">
          Balance disponible: {walletBalance} tokens
        </Typography>

        <TextField
          label="Presupuesto total"
          type="number"
          value={formData.presupuesto_total ?? 0}
          onChange={(e) => handleChange("presupuesto_total", Number(e.target.value))}
          error={!!errorPresupuesto}
          helperText={errorPresupuesto ?? ""}
          fullWidth
          margin="normal"
        />

        <TextField
          label="Recompensa en puntos"
          type="number"
          value={formData.recompensa_puntos ?? 0}
          onChange={(e) => handleChange("recompensa_puntos", Number(e.target.value))}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Recompensa en tokens"
          type="number"
          value={formData.recompensa_dinero ?? 0}
          onChange={(e) => handleChange("recompensa_dinero", Number(e.target.value))}
          fullWidth
          margin="normal"
        />


        {/* -------------------
            Input de archivos
            ------------------- */}      

        {/* Input para subir archivos */}
        <Button variant="outlined" component="label">
          Cargar nuevas imágenes/videos
          <input
            type="file"
            hidden
            multiple
            accept="image/*,video/*"
            onChange={handleFileChange}
          />
        </Button>



        {/* -------------------
            Vista previa de medios
            ------------------- */}

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1">Vista previa de medios:</Typography>

          {/* Media principal */}
          {formData.media_url && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {formData.media_url.endsWith(".mp4") ? (
                <video src={formData.media_url} controls style={{ maxWidth: "100%" }} />
              ) : (
                <img src={formData.media_url} alt="Media principal" style={{ maxWidth: "100%" }} />
              )}
              <Button
                size="small"
                color="error"
                onClick={() => setFormData({ ...formData, media_url: undefined })}
              >
                Eliminar
              </Button>
            </Box>
          )}

            {/* Medias adicionales */}
            {formData.media_urls && formData.media_urls.length > 0 && (
            <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 2 }}>
                {formData.media_urls.map((url, idx) => (
                <Box
                    key={idx}
                    sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}
                >
                    {url.endsWith(".mp4") ? (
                    <video src={url} controls style={{ maxWidth: "150px" }} />
                    ) : (
                    <img src={url} alt={`Media ${idx + 1}`} style={{ maxWidth: "150px" }} />
                    )}

                    {/* Botón eliminar */}
                    <Button
                    size="small"
                    color="error"
                    onClick={() => {
                        const updated = [...formData.media_urls!];
                        updated.splice(idx, 1);
                        setFormData({ ...formData, media_urls: updated });
                    }}
                    >
                    Eliminar
                    </Button>

                    {/* Botón portada */}
                    <Button
                    size="small"
                    variant={formData.media_url === url ? "contained" : "outlined"}
                    color="primary"
                    onClick={() => {
                        const seleccionada = formData.media_urls![idx];
                        const restantes = formData.media_urls!.filter((_, i) => i !== idx);

                        // si ya había una portada, la devolvemos a la lista
                        const nuevasUrls = formData.media_url
                        ? [...restantes, formData.media_url]
                        : restantes;

                        setFormData({
                        ...formData,
                        media_url: seleccionada,
                        media_urls: nuevasUrls,
                        });
                    }}
                    >
                    {formData.media_url === url ? "Portada seleccionada" : "Usar como portada"}
                    </Button>
                </Box>
                ))}
            </Box>
            )}
        </Box>
        </DialogContent>


        {/* -------------------
            Acciones del diálogo
            ------------------- */}
        <DialogActions>
          <Button onClick={onClose} variant="outlined">Cancelar</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

    {/* -------------------
        Snackbar
        ------------------- */}
        
    {/* Snackbar */}
    <Snackbar
      open={snackbarOpen}
      autoHideDuration={4000}
      onClose={() => setSnackbarOpen(false)}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert severity={snackbarSeverity} onClose={() => setSnackbarOpen(false)}>
        {snackbarMessage}
      </Alert>
    </Snackbar>
  </>
);

}