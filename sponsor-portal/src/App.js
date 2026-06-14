import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import MyPublishedSurveys from "./components/MyPublishedSurveys";
import ResultsPage from "./components/ResultsPage";   // 👈 importa ResultsPage
import { AuthProvider } from "./context/AuthContext";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  const handleLogin = () => setIsLoggedIn(true);
  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
  };

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta principal */}
          <Route
            path="/"
            element={
              isLoggedIn ? (
                <Dashboard onLogout={handleLogout} />
              ) : (
                <Login onLogin={handleLogin} />
              )
            }
          />

          {/* 👉 Nueva ruta explícita para dashboard */}
          <Route
            path="/dashboard"
            element={
              isLoggedIn ? (
                <Dashboard onLogout={handleLogout} />
              ) : (
                <Login onLogin={handleLogin} />
              )
            }
          />

          {/* Ruta para encuestas publicadas */}
          <Route
            path="/surveys"
            element={
              <MyPublishedSurveys
                user={{ id: 1, nombre: "Sidney", rol: "sponsor", wallet: null }}
              />
            }
          />

          {/* Ruta para resultados */}
          <Route
            path="/surveys/web/:survey_id/results"
            element={<ResultsPage />}
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

