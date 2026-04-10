// src/components/admin/AdminLayout.jsx
import { useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { segmentToViewId, viewIdToPath } from "../../config/adminNav.js";
import Dashboard from "./Dashboard";
import CalendarAdmin from "./CalendarAdmin";
import PanelAdmin from "./PanelAdmin";
import ServiciosManager from "./ServiciosManager";
import TalleresManager from "./TalleresManager";
import LavadoresManager from "./LavadoresManager";
import NominaManager from "./NominaManager";
import ClientesManager from "./ClientesManager";
import ProductosManagement from "./ProductosManagement";
import FinanzasManager from "./FinanzasManager";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/admin" || location.pathname === "/admin/") {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [location.pathname, navigate]);

  const activeView = useMemo(() => {
    const segments = location.pathname.replace(/^\/admin\/?/, "").split("/").filter(Boolean);
    const segment = segments[0] || "dashboard";
    return segmentToViewId(segment);
  }, [location.pathname]);

  const navigateToView = (viewId) => {
    navigate(viewIdToPath(viewId));
  };

  const handleLogout = () => {
    localStorage.removeItem("motobombon_token");
    localStorage.removeItem("motobombon_is_admin");
    localStorage.removeItem("motobombon_user_role");
    localStorage.removeItem("motobombon_user_name");
    window.location.href = "/login";
  };

  const renderContent = () => {
    const getPageTitle = () => {
      switch (activeView) {
        case 'dashboard': return 'Dashboard';
        case 'calendar': return 'Calendario';
        case 'appointments': return 'Citas';
        case 'services': return 'Servicios';
        case 'talleres': return 'Talleres Aliados';
        case 'lavadores': return 'Lavadores';
        case 'clientes': return 'Clientes y Fidelización';
        case 'nomina': return 'Nómina y CRM';
        case 'productos': return 'Productos y Ventas';
        case 'finanzas': return 'Finanzas';
        case 'settings': return 'Ajustes';
        default: return 'Dashboard';
      }
    };

    return (
      <div>
        {/* Header de la página */}
        <div className="admin-page-header">
          <h1 className="admin-page-title">{getPageTitle()}</h1>
          <p className="admin-page-subtitle">
            {activeView === 'dashboard' && 'Resumen general de tu negocio'}
            {activeView === 'calendar' && 'Gestiona las citas en el calendario'}
            {activeView === 'appointments' && 'Administra las reservas de clientes'}
            {activeView === 'services' && 'Configura servicios y precios'}
            {activeView === 'talleres' && 'Gestiona talleres aliados y sus precios especiales'}
            {activeView === 'lavadores' && 'Administra el equipo de trabajo'}
            {activeView === 'clientes' && 'Sistema de fidelización y gestión de clientes'}
            {activeView === 'nomina' && 'Control financiero y reportes de nómina'}
            {activeView === 'productos' && 'Gestión de bebidas y productos, registro de ventas'}
            {activeView === 'finanzas' && 'Control de ingresos, gastos y utilidades'}
            {activeView === 'settings' && 'Preferencias y configuración del sistema'}
          </p>
        </div>

        {/* Contenido de la página */}
        <div>
          {(() => {
            switch (activeView) {
              case 'dashboard':
                return <Dashboard onNavigateToView={navigateToView} />;
              case 'calendar':
                return <CalendarAdmin />;
              case 'appointments':
                return <PanelAdmin />;
              case 'services':
                return <ServiciosManager />;
              case 'talleres':
                return <TalleresManager />;
              case 'lavadores':
                return <LavadoresManager />;
              case 'clientes':
                return <ClientesManager />;
              case 'nomina':
                return <NominaManager />;
              case 'productos':
                return <ProductosManagement />;
              case 'finanzas':
                return <FinanzasManager />;
              case 'settings':
                return (
                  <div className="admin-card-placeholder">
                    <div className="admin-card-placeholder-icon" aria-hidden>🚧</div>
                    <h2>Configuración</h2>
                    <p>Esta sección estará disponible próximamente</p>
                  </div>
                );
              default:
                return <Dashboard />;
            }
          })()}
        </div>
      </div>
    );
  };

  return (
    <div className="admin-shell">
      {/* Sidebar con menú hamburguesa integrado */}
      <Sidebar
        activeView={activeView}
        onNavigateToView={navigateToView}
        onLogout={handleLogout}
      />

      {/* Contenido principal */}
      <div className="admin-main">
        {renderContent()}
      </div>
    </div>
  );
}