// sponsor-portal/src/components/ResultsPage.tsx
import { useParams } from "react-router-dom";
import ResultsDashboard from "./ResultsDashboard";
import { Container, Typography } from "@mui/material";

export default function ResultsPage() {
  // 👇 Leemos el parámetro de la URL
  const { survey_id } = useParams<{ survey_id: string }>();
  console.log("Params:", useParams()); // 👈 para verificar qué llega realmente

  // 👇 Validamos que exista survey_id
  if (!survey_id) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography variant="h6" color="error">
          ❌ No se encontró survey_id en la URL
        </Typography>
      </Container>
    );
  }

  // 👇 Pasamos el surveyId como número al Dashboard
  return (
    <Container sx={{ mt: 4 }}>
      <ResultsDashboard surveyId={Number(survey_id)} />
    </Container>
  );
}
