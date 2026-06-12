// src/types/survey.ts
export interface Opcion {
  id: number;
  texto: string;
  votos: number;
}

export interface Pregunta {
  id: number;
  texto: string;
  opciones: Opcion[];
  total_votos?: number;
}

export interface SurveyHistoryOut {
  id: number;
  titulo: string;
  description?: string;
  tipo?: string;
  completed_at?: string;
  imagenes: string[];
  preguntas: Pregunta[];
}

