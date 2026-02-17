// src/pages/SucursalSelector.jsx
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { sucursales } from "../config/sucursales";

export default function SucursalSelector() {
  const navigate = useNavigate();
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const handleSelectSucursal = (sucursal) => {
    // Guardar la sucursal seleccionada en localStorage
    localStorage.setItem('motobombon_sucursal', sucursal.id);
    localStorage.setItem('motobombon_sucursal_nombre', sucursal.nombre);
    
    // Navegar a la landing page de esa sucursal
    navigate(`/${sucursal.id}/home`);
  };

  return (
    <div className="centered-page" style={{ background: '#000000', minHeight: '100vh', padding: '2rem' }}>
      <div className="container" style={{ maxWidth: '900px', textAlign: 'center' }}>
        {/* Header */}
        <div style={{ marginBottom: '3rem' }}>
          <h1 style={{ 
            fontFamily: 'Yeseva One, serif', 
            fontSize: '3.5rem', 
            color: '#ffffff',
            textShadow: '0 0 30px #EB0463',
            marginBottom: '1rem'
          }}>
            MOTOBOMBON
          </h1>
          <p style={{ 
            fontSize: '1.5rem', 
            color: '#EB0463',
            fontWeight: '600',
            marginBottom: '0.5rem'
          }}>
            Selecciona tu Sucursal
          </p>
          <p style={{ fontSize: '1rem', color: '#cccccc' }}>
            Elige la sucursal más cercana a ti
          </p>
        </div>

        {/* Grid de Sucursales */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '2rem',
          marginTop: '3rem'
        }}>
          {sucursales.map((sucursal, index) => (
            <div
              key={sucursal.id}
              onClick={() => handleSelectSucursal(sucursal)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                padding: '2rem',
                borderRadius: '20px',
                border: '2px solid #EB0463',
                background: hoveredIndex === index 
                  ? 'linear-gradient(135deg, #EB0463, #ff1a75)'
                  : 'rgba(235, 4, 99, 0.1)',
                color: '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                transform: hoveredIndex === index ? 'translateY(-8px) scale(1.05)' : 'translateY(0)',
                boxShadow: hoveredIndex === index 
                  ? '0 15px 40px rgba(235,4,99,0.6)'
                  : '0 8px 25px rgba(235,4,99,0.3)'
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                📍
              </div>
              <h3 style={{ 
                fontSize: '1.5rem', 
                marginBottom: '0.5rem',
                fontWeight: '700'
              }}>
                {sucursal.nombre}
              </h3>
              <p style={{ 
                fontSize: '0.9rem', 
                color: '#f0f0f0',
                marginBottom: '0.3rem'
              }}>
                {sucursal.direccion}
              </p>
              <p style={{ 
                fontSize: '0.85rem', 
                color: '#cccccc'
              }}>
                {sucursal.ciudad}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
