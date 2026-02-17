import { useEffect } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import ReservaForm from "../components/Cliente/ReservaForm";
import "../index.css";

export default function ClientePage() {
  const location = useLocation();
  const { sucursalId } = useParams();
  const navigate = useNavigate();

  // Obtener el nombre de la sucursal del localStorage
  const sucursalNombre = localStorage.getItem('motobombon_sucursal_nombre') || 'Sucursal';

  useEffect(() => {
    // Si no hay sucursal en la URL, redirigir al selector
    if (!sucursalId) {
      navigate('/');
      return;
    }

    // Prevenir navegación hacia atrás solo si se accede directamente a /cliente o /reserva
    const fromHome = location.state?.fromHome;
    
    if (!fromHome) {
      // Reemplazar el historial para que no puedan volver
      window.history.pushState(null, "", window.location.href);
      
      const handlePopState = () => {
        window.history.pushState(null, "", window.location.href);
      };
      
      window.addEventListener("popstate", handlePopState);
      
      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, [location, sucursalId, navigate]);

  return (
    <div className="centered-page">
      <div className="container">
        {/* Indicador de sucursal */}
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <p style={{ 
            fontSize: '0.9rem', 
            color: '#EB0463',
            fontWeight: '600'
          }}>
            📍 {sucursalNombre}
          </p>
        </div>
        
        <h1 className="text-3xl font-bold text-center mb-6" style={{ color: '#EB0463' }}>
          🏍️ MOTOBOMBON — Reserva tu servicio de lavado
        </h1>
        <ReservaForm sucursalId={sucursalId} />
      </div>
    </div>
  );
}
