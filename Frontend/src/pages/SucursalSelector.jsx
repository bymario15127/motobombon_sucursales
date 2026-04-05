// src/pages/SucursalSelector.jsx
import { useNavigate } from "react-router-dom";
import { sucursales } from "../config/sucursales";

export default function SucursalSelector() {
  const navigate = useNavigate();

  const handleSelectSucursal = (sucursal) => {
    localStorage.setItem("motobombon_sucursal", sucursal.id);
    localStorage.setItem("motobombon_sucursal_nombre", sucursal.nombre);
    navigate(`/${sucursal.id}/home`);
  };

  return (
    <div className="centered-page">
      <div className="sucursal-selector-page">
        <div className="sucursal-selector-header">
          <h1 className="sucursal-selector-title">MOTOBOMBON</h1>
          <p className="sucursal-selector-subtitle">Selecciona tu Sucursal</p>
          <p className="sucursal-selector-hint">Elige la sucursal más cercana a ti</p>
        </div>

        <div className="sucursal-selector-grid">
          {sucursales.map((sucursal) => (
            <div
              key={sucursal.id}
              className="sucursal-selector-card"
              onClick={() => handleSelectSucursal(sucursal)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSelectSucursal(sucursal);
                }
              }}
              aria-label={`Ir a ${sucursal.nombre}`}
            >
              <div className="card-icon" aria-hidden>📍</div>
              <h3 className="card-name">{sucursal.nombre}</h3>
              <p className="card-address">{sucursal.direccion}</p>
              <p className="card-city">{sucursal.ciudad}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
