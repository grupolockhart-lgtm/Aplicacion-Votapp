// sponsor-portal/src/components/CreateSurvey.tsx

import { useState } from "react";
import { ENDPOINTS } from "../config/api";
import { useAuth } from "../context/AuthContext";
import {
  nacionalidades,
  religiones,
  nivelesEducativos,
  sexos,
  ciudades,
  ocupaciones,
  profesiones,
} from "../config/options";

// Material UI
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Grid,
  Select,
  MenuItem,
} from "@mui/material";


import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Box from "@mui/material/Box";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";


interface CreateSurveyProps {
  onCreated: () => void;
}

export default function CreateSurvey({ onCreated }: CreateSurveyProps) {
  const { user } = useAuth();

// ------------------- 
// ESTADOS PRINCIPALES 
// ------------------- 

  // Campos básicos
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fechaExpiracion, setFechaExpiracion] = useState("");
  const [presupuesto, setPresupuesto] = useState(0);
  const [recompensaDinero, setRecompensaDinero] = useState(0);   // 👈 nuevo
  const [recompensaPuntos, setRecompensaPuntos] = useState(0);   // 👈 nuevo
  const [visibilidad, setVisibilidad] = useState("publica");
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [previewImages, setPreviewImages] = useState<{url: string, type: string}[]>([]);

  // Modo preview
  const [previewMode, setPreviewMode] = useState(false);

  // Portada

  const [portadaIndex, setPortadaIndex] = useState<number>(0);

// -------------------
// MANEJO DE ARCHIVOS
// -------------------
const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const fileList = e.target.files;
  if (fileList) {
    const filesArray = Array.from(fileList);
    setFiles(filesArray);

    const previews = filesArray.map(file => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith("video") ? "video" : "image"
    }));

    setPreviewImages(previews);
    setPortadaIndex(0); // por defecto la primera imagen es portada
  }
};

const removePreview = (index: number) => {
  setPreviewImages(prev => prev.filter((_, i) => i !== index));
  setFiles(prev => prev.filter((_, i) => i !== index));

  // si borras la portada, reasigna
  if (index === portadaIndex) {
    setPortadaIndex(0);
  }
};



// -------------------
// SEGMENTACIÓN
// -------------------

  // Segmentación (arrays para selección múltiple)
  const [sexoSeleccionado, setSexoSeleccionado] = useState<string[]>([]);
  const [ciudadesSeleccionadas, setCiudadesSeleccionadas] = useState<string[]>([]);
  const [ocupacionesSeleccionadas, setOcupacionesSeleccionadas] = useState<string[]>([]);
  const [profesionesSeleccionadas, setProfesionesSeleccionadas] = useState<string[]>([]);
  const [nivelesSeleccionados, setNivelesSeleccionados] = useState<string[]>([]);
  const [religionesSeleccionadas, setReligionesSeleccionadas] = useState<string[]>([]);
  const [nacionalidadesSeleccionadas, setNacionalidadesSeleccionadas] = useState<string[]>([]);
  const [estadoCivilSeleccionado, setEstadoCivilSeleccionado] = useState<string[]>([]);

  // Función para activar modo preview
  const handlePreview = () => {
    setPreviewMode(true);
  };



// -------------------
// PREGUNTAS DINÁMICAS
// -------------------

  // Preguntas dinámicas
  const [questions, setQuestions] = useState([{ text: "", options: [{ text: "" }] }]);
  const addQuestion = () => setQuestions([...questions, { text: "", options: [{ text: "" }] }]);
  const addOption = (qIndex: number) => {
    const newQs = [...questions];
    newQs[qIndex].options.push({ text: "" });
    setQuestions(newQs);
  };
  const updateQuestion = (qIndex: number, value: string) => {
    const newQs = [...questions];
    newQs[qIndex].text = value;
    setQuestions(newQs);
  };
  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const newQs = [...questions];
    newQs[qIndex].options[oIndex].text = value;
    setQuestions(newQs);
  };
  const removeQuestion = (qIndex: number) => {
    const newQs = [...questions];
    newQs.splice(qIndex, 1); // elimina la pregunta seleccionada
    setQuestions(newQs);
  };
    // 👇 Añade aquí la función para eliminar opción
  const removeOption = (qIndex: number, oIndex: number) => {
    const newQs = [...questions];
    newQs[qIndex].options.splice(oIndex, 1); // elimina la opción seleccionada
    setQuestions(newQs);
  };




// -------------------
// HELPERS DE CHECKBOXES
//  -------------------

  // Helpers para checkboxes
  const toggleSeleccion = (
    lista: string[],
    setLista: (val: string[]) => void,
    valor: string,
    checked: boolean
  ) => {
    if (checked) {
      setLista([...lista, valor]);
    } else {
      setLista(lista.filter(v => v !== valor));
    }
  };

  const seleccionarTodos = (
    opciones: string[],
    setLista: (val: string[]) => void,
    checked: boolean
  ) => {
    if (checked) {
      setLista([...opciones]);
    } else {
      setLista([]);
    }
  };



// -------------------
// SNACKBAR
// -------------------

  // Snackbar
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");


// -------------------
// HANDLE SUBMIT (ENVÍO)
// -------------------
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();

  const token = localStorage.getItem("token");
  console.log("🔑 Token obtenido:", token);

  // Normalizar fecha con formato ISO
  const fechaISO = fechaExpiracion 
    ? new Date(fechaExpiracion).toISOString() 
    : null;

  // Construir FormData con TODOS los campos
  const formData = new FormData();
  formData.append("title", title);
  formData.append("description", description);
  formData.append("fecha_expiracion", fechaISO || "");
  formData.append("patrocinada", "true");
  formData.append("patrocinador", user?.nombre || "Sponsor");
  formData.append("recompensa_puntos", recompensaPuntos.toString());
  formData.append("recompensa_dinero", recompensaDinero.toString());
  formData.append("presupuesto_total", presupuesto.toString());
  formData.append("visibilidad_resultados", visibilidad);

  // Segmentación
  formData.append("sexo", JSON.stringify(sexoSeleccionado));
  formData.append("ciudad", JSON.stringify(ciudadesSeleccionadas));
  formData.append("ocupacion", JSON.stringify(ocupacionesSeleccionadas));
  formData.append("profesion", JSON.stringify(profesionesSeleccionadas));
  formData.append("nivel_educativo", JSON.stringify(nivelesSeleccionados));
  formData.append("religion", JSON.stringify(religionesSeleccionadas));
  formData.append("nacionalidad", JSON.stringify(nacionalidadesSeleccionadas));
  formData.append("estado_civil", JSON.stringify(estadoCivilSeleccionado));

  // Preguntas válidas
  const preguntasValidas = questions
    .filter(q => q.text.trim() !== "")
    .map(q => ({
      text: q.text.trim(),
      options: q.options
        .filter(o => o.text.trim() !== "")
        .map(o => ({ text: o.text.trim() }))
    }))
    .filter(q => q.options.length > 0);

  formData.append("questions", JSON.stringify(preguntasValidas));

  // Archivos: portada + galería
  if (files.length > 0) {
    // Usa portadaIndex si lo tienes en tu estado, si no, por defecto el primero
    const portada = files[portadaIndex] || files[0];
    formData.append("media_url", portada);

    files.forEach((file, idx) => {
      if (idx !== portadaIndex) {
        formData.append("media_urls", file);
      }
    });
  }

  // Log de lo que se envía
  for (let [key, value] of formData.entries()) {
    console.log("📤 Campo enviado:", key, value);
  }

  // Único fetch hacia /api/upload
  const res = await fetch("http://localhost:8000/api/surveys/upload-survey", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
    body: formData,
  });

  console.log("📡 Respuesta subida:", res.status);

  if (res.ok) {
    const data = await res.json();
    console.log("✅ Respuesta JSON:", data);

    // Reset de estados
    setTitle("");
    setDescription("");
    setFechaExpiracion("");
    setPresupuesto(0);
    setRecompensaDinero(0);
    setRecompensaPuntos(0);
    setVisibilidad("publica");
    setQuestions([{ text: "", options: [{ text: "" }] }]);
    setSexoSeleccionado([]);
    setCiudadesSeleccionadas([]);
    setOcupacionesSeleccionadas([]);
    setProfesionesSeleccionadas([]);
    setNivelesSeleccionados([]);
    setReligionesSeleccionadas([]);
    setNacionalidadesSeleccionadas([]);
    setEstadoCivilSeleccionado([]);
    setPreviewMode(false);
    setFiles([]);
    setPreviewImages([]);
    onCreated();

    setSnackbarMessage(data.message || "✅ Encuesta creada exitosamente");
    setSnackbarSeverity("success");
    setOpenSnackbar(true);
  } else {
    setSnackbarMessage("❌ Error al crear encuesta");
    setSnackbarSeverity("error");
    setOpenSnackbar(true);
  }
}




// -------------------
// RENDER (RETURN JSX)
// -------------------
  
 return (

  <Box sx={{ maxWidth: "md", backgroundColor: "#f9f9f9", padding: 3, borderRadius: 2, margin: "0 auto" }}>
    {!previewMode ? (
        <form onSubmit={handleSubmit}>
        <Typography variant="h5" gutterBottom>
            Crear encuesta patrocinada
        </Typography>



        {/* -------------------
        # DATOS PRINCIPALES
        # ------------------- */}

        {/* Datos principales */} 


        <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
        Datos principales
        </Typography>

        {/* Título */}
        <TextField
        label="Título"
        variant="outlined"
        fullWidth
        margin="normal"
        value={title}
        onChange={e => setTitle(e.target.value)}
        sx={{ mb: 2 }}
        />

        {/* Descripción */}
        <TextField
        label="Descripción"
        variant="outlined"
        fullWidth
        margin="normal"
        multiline
        rows={3}
        value={description}
        onChange={e => setDescription(e.target.value)}
        sx={{ mb: 2 }}
        />



        {/* -------------------
        # SUBIDA DE ARCHIVOS
        # ------------------- */}

        {/* Subir archivos */}
        <Button
        variant="contained"
        component="label"
        sx={{ mb: 2 }}
        >
        Subir archivos
        <input
            type="file"
            accept="image/*,video/*"
            multiple
            hidden
            onChange={handleFileChange}   // 👈 usa la función que genera preview
        />
        </Button>


{previewImages.length > 0 && (
  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 2 }}>
    {previewImages.map((item, idx) => (
      <Box key={idx} sx={{ position: "relative" }}>
        {item.type === "image" ? (
          <img
            src={item.url}
            alt={`Vista previa ${idx + 1}`}
            style={{ maxWidth: "200px", borderRadius: "8px" }}
          />
        ) : (
          <video
            src={item.url}
            controls
            style={{ maxWidth: "200px", borderRadius: "8px" }}
          />
        )}

        {/* Botón eliminar */}
        <Button
          variant="contained"
          color="error"
          size="small"
          sx={{ position: "absolute", top: 5, right: 5 }}
          onClick={() => removePreview(idx)}
        >
          🗑️
        </Button>

        {/* Botón portada */}
        <Button
          variant={portadaIndex === idx ? "contained" : "outlined"}
          color="primary"
          size="small"
          sx={{ position: "absolute", bottom: 5, left: 5 }}
          onClick={() => setPortadaIndex(idx)}
        >
          {portadaIndex === idx ? "Portada seleccionada" : "Usar como portada"}
        </Button>
      </Box>
    ))}
  </Box>
)}




        {/* -------------------
        # PREGUNTAS DINÁMICAS
        # ------------------- */}

        {/* Preguntas dinámicas */}
        <Typography variant="h6" sx={{ marginTop: 3, marginBottom: 2 }}>
        Preguntas
        </Typography>
        {questions.map((q, qIndex) => (
        <Card key={qIndex} sx={{ marginBottom: 2, boxShadow: 1, borderRadius: 2 }}>
            <CardContent>
            <TextField
                label={`Pregunta ${qIndex + 1}`}
                variant="outlined"
                fullWidth
                margin="normal"
                value={q.text || ""}   // 👈 nunca null/undefined
                onChange={(e) => updateQuestion(qIndex, e.target.value)}
            />

            {q.options.map((opt, oIndex) => (
                <Box key={oIndex} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <TextField
                    label={`Opción ${oIndex + 1}`}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    value={opt.text || ""}   // 👈 nunca null/undefined
                    onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                />
                <Button
                    type="button"
                    variant="outlined"
                    color="error"
                    onClick={() => removeOption(qIndex, oIndex)}
                >
                    🗑️
                </Button>
                </Box>
            ))}

            <Button
                type="button"
                variant="outlined"
                onClick={() => addOption(qIndex)}
                sx={{ marginTop: 1 }}
            >
                + Añadir opción
            </Button>

            {/* 👇 Botón para eliminar pregunta */}
            <Button
                type="button"
                variant="outlined"
                color="error"
                onClick={() => removeQuestion(qIndex)}
                sx={{ marginTop: 1 }}
            >
                🗑️ Eliminar pregunta
            </Button>
            </CardContent>
        </Card>
        ))}
        <Button
        type="button"
        variant="outlined"
        onClick={addQuestion}
        sx={{ marginBottom: 3 }}
        >
        + Añadir pregunta
        </Button>



        {/* -------------------
        # CONFIGURACIÓN ADICIONAL
        # ------------------- */}

        {/* Configuración adicional */}
        <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
        Configuración adicional
        </Typography>

        <TextField
        label="Fecha de expiración"
        type="datetime-local"
        fullWidth
        margin="normal"
        value={fechaExpiracion}
        onChange={e => setFechaExpiracion(e.target.value)}
        InputLabelProps={{ shrink: true }}   // 👈 reemplazo de slotProps
        sx={{ mb: 2 }}
        />

        <TextField
        label="Presupuesto total"
        type="number"
        variant="outlined"
        fullWidth
        margin="normal"
        value={presupuesto}
        onChange={e => {
            const val = Number(e.target.value);
            setPresupuesto(val < 0 ? 0 : val);
        }}
        inputMode="numeric"
        sx={{ mb: 2 }}
        />

        <TextField
        label="Recompensa en dinero"
        type="number"
        variant="outlined"
        fullWidth
        margin="normal"
        value={recompensaDinero}
        onChange={e => {
            const val = Number(e.target.value);
            setRecompensaDinero(val < 0 ? 0 : val);
        }}
        inputMode="numeric"
        sx={{ mb: 2 }}
        />

        <TextField
        label="Recompensa en puntos"
        type="number"
        variant="outlined"
        fullWidth
        margin="normal"
        value={recompensaPuntos}
        onChange={e => {
            const val = Number(e.target.value);
            setRecompensaPuntos(val < 0 ? 0 : val);
        }}
        inputMode="numeric"
        sx={{ mb: 2 }}
        />

        <Select
        value={visibilidad}
        onChange={e => setVisibilidad(e.target.value)}
        fullWidth
        sx={{ mt: 2, mb: 3 }}
        >
        <MenuItem value="publica">Pública</MenuItem>
        <MenuItem value="privada">Privada</MenuItem>
        <MenuItem value="solo_sponsor">Solo Sponsor</MenuItem>
        </Select>



        {/* -------------------
        # SEGMENTACIÓN
        # ------------------- */}

        {/* Segmentación */}
        <Typography variant="h6" sx={{ marginTop: 3, marginBottom: 2 }}>
            Segmentación
        </Typography>

        {/* Sexo */}
        <Accordion sx={{ marginBottom: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">Sexo</Typography>
            </AccordionSummary>
            <AccordionDetails>
            <FormGroup>
                <FormControlLabel
                control={
                    <Checkbox
                    checked={sexoSeleccionado.length === sexos.length}
                    onChange={e =>
                        seleccionarTodos(sexos, setSexoSeleccionado, e.target.checked)
                    }
                    />
                }
                label="Todos"
                />
                {sexos.map(s => (
                <FormControlLabel
                    key={s}
                    control={
                    <Checkbox
                        checked={sexoSeleccionado.includes(s)}
                        onChange={e =>
                        toggleSeleccion(sexoSeleccionado, setSexoSeleccionado, s, e.target.checked)
                        }
                    />
                    }
                    label={s}
                />
                ))}
            </FormGroup>
            </AccordionDetails>
        </Accordion>

        {/* Ciudades */}
        <Accordion sx={{ marginBottom: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">Ciudades</Typography>
            </AccordionSummary>
            <AccordionDetails>
            <FormGroup>
                <FormControlLabel
                control={
                    <Checkbox
                    checked={ciudadesSeleccionadas.length === ciudades.length}
                    onChange={e =>
                        seleccionarTodos(ciudades, setCiudadesSeleccionadas, e.target.checked)
                    }
                    />
                }
                label="Todas"
                />
                {ciudades.map(c => (
                <FormControlLabel
                    key={c}
                    control={
                    <Checkbox
                        checked={ciudadesSeleccionadas.includes(c)}
                        onChange={e =>
                        toggleSeleccion(ciudadesSeleccionadas, setCiudadesSeleccionadas, c, e.target.checked)
                        }
                    />
                    }
                    label={c}
                />
                ))}
            </FormGroup>
            </AccordionDetails>
        </Accordion>

        {/* Ocupaciones */}
        <Accordion sx={{ marginBottom: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">Ocupaciones</Typography>
            </AccordionSummary>
            <AccordionDetails>
            <FormGroup>
                <FormControlLabel
                control={
                    <Checkbox
                    checked={ocupacionesSeleccionadas.length === ocupaciones.length}
                    onChange={e =>
                        seleccionarTodos(ocupaciones, setOcupacionesSeleccionadas, e.target.checked)
                    }
                    />
                }
                label="Todas"
                />
                {ocupaciones.map(o => (
                <FormControlLabel
                    key={o}
                    control={
                    <Checkbox
                        checked={ocupacionesSeleccionadas.includes(o)}
                        onChange={e =>
                        toggleSeleccion(ocupacionesSeleccionadas, setOcupacionesSeleccionadas, o, e.target.checked)
                        }
                    />
                    }
                    label={o}
                />
                ))}
            </FormGroup>
            </AccordionDetails>
        </Accordion>

        {/* Profesiones */}
        <Accordion sx={{ marginBottom: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">Profesiones</Typography>
            </AccordionSummary>
            <AccordionDetails>
            <FormGroup>
                <FormControlLabel
                control={
                    <Checkbox
                    checked={profesionesSeleccionadas.length === profesiones.length}
                    onChange={e =>
                        seleccionarTodos(profesiones, setProfesionesSeleccionadas, e.target.checked)
                    }
                    />
                }
                label="Todas"
                />
                {profesiones.map(p => (
                <FormControlLabel
                    key={p}
                    control={
                    <Checkbox
                        checked={profesionesSeleccionadas.includes(p)}
                        onChange={e =>
                        toggleSeleccion(profesionesSeleccionadas, setProfesionesSeleccionadas, p, e.target.checked)
                        }
                    />
                    }
                    label={p}
                />
                ))}
            </FormGroup>
            </AccordionDetails>
        </Accordion>

        {/* Niveles Educativos */}
        <Accordion sx={{ marginBottom: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">Niveles Educativos</Typography>
            </AccordionSummary>
            <AccordionDetails>
            <FormGroup>
                <FormControlLabel
                control={
                    <Checkbox
                    checked={nivelesSeleccionados.length === nivelesEducativos.length}
                    onChange={e =>
                        seleccionarTodos(nivelesEducativos, setNivelesSeleccionados, e.target.checked)
                    }
                    />
                }
                label="Todos"
                />
                {nivelesEducativos.map(n => (
                <FormControlLabel
                    key={n}
                    control={
                    <Checkbox
                        checked={nivelesSeleccionados.includes(n)}
                        onChange={e =>
                        toggleSeleccion(nivelesSeleccionados, setNivelesSeleccionados, n, e.target.checked)
                        }
                    />
                    }
                    label={n}
                />
                ))}
            </FormGroup>
            </AccordionDetails>
        </Accordion>

        {/* Religiones */}
        <Accordion sx={{ marginBottom: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">Religiones</Typography>
            </AccordionSummary>
            <AccordionDetails>
            <FormGroup>
                <FormControlLabel
                control={
                    <Checkbox
                    checked={religionesSeleccionadas.length === religiones.length}
                    onChange={e =>
                        seleccionarTodos(religiones, setReligionesSeleccionadas, e.target.checked)
                    }
                    />
                }
                label="Todas"
                />
                {religiones.map(r => (
                <FormControlLabel
                    key={r}
                    control={
                    <Checkbox
                        checked={religionesSeleccionadas.includes(r)}
                        onChange={e =>
                        toggleSeleccion(religionesSeleccionadas, setReligionesSeleccionadas, r, e.target.checked)
                        }
                    />
                    }
                    label={r}
                />
                ))}
            </FormGroup>
            </AccordionDetails>
        </Accordion>

        {/* Nacionalidades */}
        <Accordion sx={{ marginBottom: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">Nacionalidades</Typography>
            </AccordionSummary>
            <AccordionDetails>
            <FormGroup>
                <FormControlLabel
                control={
                    <Checkbox
                    checked={nacionalidadesSeleccionadas.length === nacionalidades.length}
                    onChange={e =>
                        seleccionarTodos(nacionalidades, setNacionalidadesSeleccionadas, e.target.checked)
                    }
                    />
                }
                label="Todas"
                />
                {nacionalidades.map(n => (
                <FormControlLabel
                    key={n}
                    control={
                    <Checkbox
                        checked={nacionalidadesSeleccionadas.includes(n)}
                        onChange={e =>
                        toggleSeleccion(nacionalidadesSeleccionadas, setNacionalidadesSeleccionadas, n, e.target.checked)
                        }
                    />
                    }
                    label={n}
                />
                ))}
            </FormGroup>
            </AccordionDetails>
        </Accordion>

        {/* Estado Civil */}
        <Accordion sx={{ marginBottom: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">Estado Civil</Typography>
            </AccordionSummary>
            <AccordionDetails>
            <FormGroup>
                <FormControlLabel
                control={
                    <Checkbox
                    checked={estadoCivilSeleccionado.length === 4}
                    onChange={e =>
                        seleccionarTodos(
                        ["Soltero","Casado","Divorciado","Viudo"],
                        setEstadoCivilSeleccionado,
                        e.target.checked
                        )
                    }
                    />
                }
                label="Todos"
                />
                {["Soltero","Casado","Divorciado","Viudo"].map(ec => (
                <FormControlLabel
                    key={ec}
                    control={
                    <Checkbox
                        checked={estadoCivilSeleccionado.includes(ec)}
                        onChange={e =>
                        toggleSeleccion(estadoCivilSeleccionado, setEstadoCivilSeleccionado, ec, e.target.checked)
                        }
                    />
                    }
                    label={ec}
                />
                ))}
            </FormGroup>
            </AccordionDetails>
        </Accordion>







        {/*} -------------------
        # BOTONES FINALES
        # ------------------- */}


       {/* Botones finales en el formulario */}
        <Box sx={{ display: "flex", justifyContent: "flex-start", gap: 2, mt: 3 }}>
        <Button
            type="button"
            variant="contained"
            color="primary"
            onClick={() => setPreviewMode(true)}
        >
            Vista previa
        </Button>
        </Box>

        </form>
        ) : (



        // -------------------
        // VISTA PREVIA
        // -------------------


        <Card sx={{ mt: 3, p: 2 }}>
        <Typography variant="h6">Vista previa de la encuesta</Typography>
        <Typography variant="subtitle1">Título: {title}</Typography>
        <Typography variant="body2">Descripción: {description}</Typography>
        <Typography variant="body2">Fecha de expiración: {fechaExpiracion}</Typography>
        <Typography variant="body2">Presupuesto: {presupuesto}</Typography>
        <Typography variant="body2">Recompensa en dinero: {recompensaDinero}</Typography>
        <Typography variant="body2">Recompensa en puntos: {recompensaPuntos}</Typography>
        <Typography variant="body2">Visibilidad: {visibilidad}</Typography>

        {/* 👇 Archivos seleccionados con portada */}
        <Typography variant="subtitle1" sx={{ mt: 2 }}>Archivos seleccionados:</Typography>
        {previewImages.length > 0 ? (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 1 }}>
            {previewImages.map((preview, index) => (
            <Box key={index} sx={{ position: "relative" }}>
                {preview.type === "video" ? (
                <video src={preview.url} controls style={{ maxWidth: "200px", borderRadius: "8px" }} />
                ) : (
                <img src={preview.url} alt={`preview-${index}`} style={{ maxWidth: "200px", borderRadius: "8px" }} />
                )}

                <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                <Button
                    variant={portadaIndex === index ? "contained" : "outlined"}
                    size="small"
                    onClick={() => setPortadaIndex(index)}
                >
                    {portadaIndex === index ? "Portada seleccionada" : "Usar como portada"}
                </Button>
                <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={() => removePreview(index)}
                >
                    Eliminar
                </Button>
                </Box>
            </Box>
            ))}
        </Box>
        ) : (
        <Typography variant="body2">No se seleccionaron archivos</Typography>
        )}


        {/* Preguntas */}
        <Typography variant="subtitle1" sx={{ mt: 2 }}>Preguntas:</Typography>
        <ul>
            {questions.map((q, i) => (
            <li key={i}>
                <strong>{q.text}</strong>
                <ul>
                {q.options.map((opt, j) => (
                    <li key={j}>{opt.text}</li>
                ))}
                </ul>
            </li>
            ))}
        </ul>

        {/* Segmentación */}
        <Typography variant="subtitle1" sx={{ mt: 2 }}>Segmentación:</Typography>
        <ul>
            <li>Sexo: {sexoSeleccionado.length ? sexoSeleccionado.join(", ") : "Todos"}</li>
            <li>Ciudades: {ciudadesSeleccionadas.length ? ciudadesSeleccionadas.join(", ") : "Todas"}</li>
            <li>Ocupaciones: {ocupacionesSeleccionadas.length ? ocupacionesSeleccionadas.join(", ") : "Todas"}</li>
            <li>Profesiones: {profesionesSeleccionadas.length ? profesionesSeleccionadas.join(", ") : "Todas"}</li>
            <li>Niveles educativos: {nivelesSeleccionados.length ? nivelesSeleccionados.join(", ") : "Todos"}</li>
            <li>Religiones: {religionesSeleccionadas.length ? religionesSeleccionadas.join(", ") : "Todas"}</li>
            <li>Nacionalidades: {nacionalidadesSeleccionadas.length ? nacionalidadesSeleccionadas.join(", ") : "Todas"}</li>
            <li>Estado civil: {estadoCivilSeleccionado.length ? estadoCivilSeleccionado.join(", ") : "Todos"}</li>
        </ul>

        <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
            <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}   // 👈 aquí sí publicas
            >
            Publicar encuesta
            </Button>
            <Button
            variant="outlined"
            onClick={() => setPreviewMode(false)}   // 👈 regresa a edición
            >
            Editar
            </Button>
        </Box>
        </Card>

    )}



        {/* -------------------
            SNACKBAR
        ------------------- */}

        {/* Snackbar con Alert */}
        <Snackbar
        open={openSnackbar}
        autoHideDuration={4000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
        <Alert severity={snackbarSeverity} onClose={() => setOpenSnackbar(false)}>
            {snackbarMessage}
        </Alert>
       </Snackbar>
  </Box>
);
}
