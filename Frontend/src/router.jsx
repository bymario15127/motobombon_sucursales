// src/router.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SucursalSelector from "./pages/SucursalSelector";
import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/HomePage";
import ClientePage from "./pages/ClientePage";
import AdminPage from "./pages/AdminPage";
import TallerPage from "./pages/TallerPage";
import LoginAdmin from "./components/admin/LoginAdmin";

function ProtectedRoute({ children }) {
  const isAdmin = localStorage.getItem("motobombon_is_admin") === "true";
  return isAdmin ? children : <Navigate to="/login" replace />;
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
