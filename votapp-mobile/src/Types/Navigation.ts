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
  SurveySimplePreviewScreen: { draftSurvey: any };  // 👈 agregado

  // Flujo de votación
  VoteScreen: {
    surveyId: number;
    questions: {
      id: number;
      text: string;
      options: { id: number; text: string }[];
    }[];
    media_url?: string;
    media_urls?: string[];
    refreshSurveys: () => Promise<void>;
    refreshProfile: () => Promise<void>;
  };

  // Resultados
  ResultsScreen: {
    surveyId: number;
    title?: string;
    description?: string;
    media_url?: string;
    media_urls?: string[];
    refreshSurveys: () => Promise<void>;
    refreshProfile: () => Promise<void>;
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







