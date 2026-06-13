
//Sponsor-portal/src/component/ResultsPage.tsx

import React from "react";
import { useParams } from "react-router-dom";
import ResultsDashboard from "./ResultsDashboard";
import { Container, Typography } from "@mui/material";

export default function ResultsPage() {
  // 👉 Tomamos el parámetro :id de la URL
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography variant="h6" color="error">
          ❌ No se encontró el ID de la encuesta.
        </Typography>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4 }}>
      <ResultsDashboard surveyId={Number(id)} />
    </Container>
  );
}
