// sponsor-portal/src/components/ResultsPage.tsx
import { useParams } from "react-router-dom";
import ResultsDashboard from "./ResultsDashboard";
import { Container, Typography } from "@mui/material";
import Layout from "./Layout";

export default function ResultsPage({ user, handleLogout }) {
  const { survey_id } = useParams<{ survey_id: string }>();

  if (!survey_id) {
    return (
      <Layout user={user} onLogout={handleLogout}>
        <Container sx={{ mt: 4 }}>
          <Typography variant="h6" color="error">
            ❌ No se encontró survey_id en la URL
          </Typography>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      <Container sx={{ mt: 4 }}>
        <ResultsDashboard surveyId={Number(survey_id)} />
      </Container>
    </Layout>
  );
}
