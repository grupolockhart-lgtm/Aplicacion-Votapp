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

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [logoutMessageOpen, setLogoutMessageOpen] = useState(false);
  const navigate = useNavigate();   // ✅ ahora sí funciona porque App está dentro de BrowserRouter

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  const handleLogin = () => setIsLoggedIn(true);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setLogoutMessageOpen(true);   // 👈 abre Snackbar
    navigate("/");                // 👈 redirige al login
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
          element={
            <MyPublishedSurveys
              user={{ id: 1, nombre: "Sidney", rol: "sponsor", wallet: null }}
            />
          }
        />

        <Route
          path="/surveys/web/:survey_id/results"
          element={
            <ResultsPage
              user={{ id: 1, nombre: "Sidney", rol: "sponsor", wallet: { balance: 9900 } }}
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

