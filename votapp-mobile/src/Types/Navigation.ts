export type RootStackParamList = {
  LoginScreen: undefined;
  RegisterScreen: undefined;
  MainTabs: undefined;

  // Pantallas principales
  SurveysScreen: undefined;
  CrearEncuesta: undefined;
  ProfileScreen: undefined;
  LogoutScreen: undefined;

  // Nueva pantalla de previsualización
  SurveySimplePreviewScreen: { draftSurvey: any };

  // Flujo de votación
  VoteScreen: {
    surveyId: number;
    surveyType: "normal" | "simple"; // 👈 agregado
    questions: {
      id: number;
      text: string;
      options: { id: number; text: string }[];
    }[];
    media_url?: string;
    media_urls?: string[];
  };

  // Resultados
  ResultsScreen: {
    surveyId: number;
    surveyType: "normal" | "simple"; // 👈 agregado
    title?: string;
    description?: string;
    media_url?: string;
    media_urls?: string[];
  };



  // Comentarios
  SurveyCommentsScreen: { surveyId: number };

  // Extras
  TestChart: undefined;

  // Wallet / Movimientos
  WalletHistoryScreen: {
    movimientos: {
      id: number;
      tipo: "ingreso" | "retiro";
      monto: number;
      fecha: string;
    }[];
  };

  // Historial de encuestas
  SurveyHistory: { originalId: number };
  SurveyHistoryScreen: {
    history: { id: number; title: string; completed_at: string }[];
  };
};








