// src/pages/LandingPage.jsx
import { useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import { getSucursalById } from "../config/sucursales";

export default function LandingPage() {
  const navigate = useNavigate();
  const { sucursalId } = useParams();

  const sucursalNombre = getSucursalById(sucursalId)?.nombre || "Sucursal";

  useEffect(() => {
    if (!sucursalId) {
      navigate("/");
    }
  }, [sucursalId, navigate]);

  return (
    <div className="centered-page">
      <div className="landing-wrap">
        <div className="landing-card">
          <button
            type="button"
            className="landing-back"
            onClick={() => navigate("/")}
            aria-label="Cambiar sucursal"
          >
            ← Cambiar Sucursal
          </button>

          <h1 className="landing-title">MOTOBOMBON</h1>
          <p className="landing-subtitle">📍 {sucursalNombre}</p>
          <p className="landing-tagline">Tu moto brillante como nueva 🏍️✨</p>

          <div className="landing-buttons">
            <button
              type="button"
              className="landing-btn landing-btn-primary"
              onClick={() => navigate(`/${sucursalId}/reserva`)}
            >
              🏍️ Soy Cliente
            </button>
            <button
              type="button"
              className="landing-btn landing-btn-taller"
              onClick={() => navigate(`/${sucursalId}/taller`)}
            >
              🏢 Taller Aliado
            </button>
            <button
              type="button"
              className="landing-btn landing-btn-admin"
              onClick={() => navigate("/login")}
            >
              🔒 Administración
            </button>
            <button
              type="button"
              className="landing-btn landing-btn-supervisor"
              onClick={() => navigate("/login")}
            >
              👁️ Supervisor
            </button>
          </div>

          <p className="landing-footer">
            Bienvenido a MOTOBOMBON — Tu lavamotors de confianza
          </p>
        </div>
      </div>
    </div>
  );
}
