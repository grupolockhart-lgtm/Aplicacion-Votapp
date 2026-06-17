
//sponsor-portal/src/componentes/Layout.tsx

import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";

export default function Layout({ user, onLogout, children }) {
  return (
    <Box>
      {/* Header global */}
        <AppBar position="static" color="default" sx={{ mb: 3 }}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
            {/* Logo alineado a la izquierda */}
            <Box sx={{ display: "flex", alignItems: "center" }}>
            <img
                src="/assets/logo.png"   // 👈 asegúrate que la ruta sea correcta
                alt="Logo Votapp"
                style={{ height: 85 }}   // 👈 ajusta tamaño según prefieras
            />
            </Box>

            {/* Bienvenida + balance + cerrar sesión a la derecha */}
            {user?.rol === "sponsor" && user?.wallet && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography variant="body1">
                Bienvenido, {user.nombre} ({user.rol})
                </Typography>
                <Typography
                variant="body1"
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                <AccountBalanceWalletIcon fontSize="small" />
                Balance: {user.wallet.balance}
                </Typography>
                <Button
                color="inherit"
                startIcon={<LogoutIcon />}
                onClick={onLogout}
                >
                Cerrar sesión
                </Button>
            </Box>
            )}
        </Toolbar>
        </AppBar>

      {/* Contenido de cada pantalla */}
      <Box sx={{ p: 3 }}>
        {children}
      </Box>
    </Box>
  );
}
