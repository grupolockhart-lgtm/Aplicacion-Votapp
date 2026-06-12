// sponsor-portal/src/App.js

import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom"; // 👈 importa Router
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import MyPublishedSurveys from "./components/MyPublishedSurveys"; // 👈 ejemplo de ruta extra
import { AuthProvider } from "./context/AuthContext";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
  };

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* 👉 Ruta principal */}
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

          {/* 👉 Ejemplo: ruta para encuestas publicadas */}
          <Route
            path="/surveys"
            element={<MyPublishedSurveys user={{ id: 1, nombre: "Sidney", rol: "sponsor", wallet: null }} />}
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
