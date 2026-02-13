export type RootStackParamList = {
  LoginScreen: undefined;
  RegisterScreen: undefined;
  MainTabs: undefined;
  SurveysScreen: undefined;

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

  ResultsScreen: {
    surveyId: number;
    title?: string;
    description?: string;
    media_url?: string;
    media_urls?: string[];
    refreshSurveys: () => Promise<void>;
    refreshProfile: () => Promise<void>;
  };

  SurveyCommentsScreen: {
    surveyId: number;
  };

  TestChart: undefined;
  ProfileScreen: undefined;
  LogoutScreen: undefined;

  WalletHistoryScreen: {
    movimientos: {
      id: number;
      tipo: "ingreso" | "retiro";
      monto: number;
      fecha: string;
    }[];
  };

  // ✅ Mantienes la ruta antigua por si la usas en otro flujo
  SurveyHistory: {
    originalId: number;
  };

  // ✅ Nueva ruta para historial completo
  SurveyHistoryScreen: {
    history: {
      id: number;
      title: string;
      completed_at: string;
    }[];
  };
};









