// sponsor-portal/src/App.js
import { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import MyPublishedSurveys from "./components/MyPublishedSurveys";
import ResultsPage from "./components/ResultsPage";
import { AuthProvider } from "./context/AuthContext";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { getMe } from "./services/api";   // 👈 importa tu API

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);   // 👈 estado global de usuario
  const [logoutMessageOpen, setLogoutMessageOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
      getMe(token)
        .then(setUser)
        .catch(() => {
          localStorage.removeItem("token");
          setIsLoggedIn(false);
          setUser(null);
        });
    }
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
    const token = localStorage.getItem("token");
    if (token) {
      getMe(token).then(setUser);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setUser(null);   // 👈 limpia usuario
    setLogoutMessageOpen(true);
    navigate("/");   // 👈 redirige al login
  };

  return (
    <AuthProvider>
      <Routes>
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

        <Route
          path="/surveys"
          element={<MyPublishedSurveys user={user} />}
        />

        <Route
          path="/surveys/web/:survey_id/results"
          element={
            <ResultsPage
              user={user}   // 👈 ahora sí existe
              handleLogout={handleLogout}
            />
          }
        />
      </Routes>

      {/* Snackbar para mensaje de logout */}
      <Snackbar
        open={logoutMessageOpen}
        autoHideDuration={3000}
        onClose={() => setLogoutMessageOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="info" sx={{ width: "100%" }}>
          Sesión cerrada correctamente
        </Alert>
      </Snackbar>
    </AuthProvider>
  );
}

export default App;

