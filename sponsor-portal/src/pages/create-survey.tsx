

import React from "react";
import { useAuth } from "../context/AuthContext";
import CreateSurvey from "../components/CreateSurvey";

export default function CreateSurveyPage() {
  const { user } = useAuth();

  if (!user || user.rol !== "sponsor") {
    return <p>Solo los sponsors pueden crear encuestas patrocinadas.</p>;
  }

  return <CreateSurvey onCreated={() => alert("Encuesta creada")} />;
}
