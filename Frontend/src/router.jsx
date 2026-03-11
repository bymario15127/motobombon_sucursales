// src/router.jsx
import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import SucursalSelector from "./pages/SucursalSelector";
import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/HomePage";
import ClientePage from "./pages/ClientePage";
import AdminPage from "./pages/AdminPage";
import TallerPage from "./pages/TallerPage";
import LoginAdmin from "./components/admin/LoginAdmin";

function ProtectedRoute({ children }) {
  const [status, setStatus] = useState("checking"); // 'checking' | 'allowed' | 'denied'
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    async function verifySession() {
      try {
        const token = localStorage.getItem("motobombon_token");

        if (!token) {
          // No hay token: sesión inválida
          if (isMounted) setStatus("denied");
          return;
        }

        const res = await fetch("/api/auth/verify", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Token inválido");
        }

        const data = await res.json();

        if (data.valid) {
          if (isMounted) setStatus("allowed");
        } else {
          throw new Error("Token inválido");
        }
      } catch (error) {
        // Limpiar cualquier rastro de sesión inválida
        localStorage.removeItem("motobombon_token");
        localStorage.removeItem("motobombon_is_admin");
        localStorage.removeItem("motobombon_user_role");
        localStorage.removeItem("motobombon_user_name");

        if (isMounted) setStatus("denied");
      }
    }

    setStatus("checking");
    verifySession();

    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  if (status === "checking") {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        Verificando sesión...
      </div>
    );
  }

  if (status === "denied") {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Página principal: Selector de Sucursal */}
        <Route path="/" element={<SucursalSelector />} />
        
        {/* Rutas específicas por sucursal */}
        <Route path="/:sucursalId/home" element={<LandingPage />} />
        <Route path="/:sucursalId/reserva" element={<ClientePage />} />
        <Route path="/:sucursalId/cliente" element={<ClientePage />} />
        <Route path="/:sucursalId/taller" element={<TallerPage />} />
        
        {/* Rutas administrativas (no requieren sucursal) */}
        <Route path="/login" element={<LoginAdmin />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
