// src/pages/HomePage.jsx
import { Link } from "react-router-dom";

const HomePage = () => {
  const servicios = [
    {
      nombre: "Lavado Básico",
      imagen: "/assets/lavado-basico.jpg",
      descripcion: "Lavado completo exterior con productos de calidad.",
    },
    {
      nombre: "Lavado Premium",
      imagen: "/assets/lavado-premium.jpg",
      descripcion: "Lavado completo + encerado y brillo profesional.",
    },
    {
      nombre: "Lavado Detallado",
      imagen: "/assets/lavado-detallado.jpg",
      descripcion: "Lavado completo, motor, encerado y protección total.",
    },
  ];

  return (
    <div className="centered-page">
      <div className="container" style={{ maxWidth: 1100, background: '#0a0a0a', textAlign: 'left' }}>
        <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'Yeseva One, serif', fontSize: '2.5rem', color: '#EB0463', marginBottom: '0.5rem' }}>
            MOTOBOMBON
          </h1>
          <p style={{ color: '#e5e7eb', fontSize: '1rem' }}>Tu moto brillante como nueva 🏍️✨</p>
        </header>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {servicios.map((s) => (
            <div
              key={s.nombre}
              style={{
                borderRadius: '18px',
                overflow: 'hidden',
                background: 'radial-gradient(circle at top, rgba(235,4,99,0.18), #111)',
                border: '1px solid rgba(235,4,99,0.4)',
                boxShadow: '0 0 24px rgba(235,4,99,0.35)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ overflow: 'hidden', maxHeight: 220 }}>
                <img
                  src={s.imagen}
                  alt={s.nombre}
                  loading="lazy"
                  decoding="async"
                  style={{
                    width: '100%',
                    height: 220,
                    objectFit: 'cover',
                    transformOrigin: 'center',
                    transition: 'transform 0.4s ease',
                    display: 'block',
                  }}
                />
              </div>
              <div style={{ padding: '1.25rem', textAlign: 'center' }}>
                <h3 style={{ fontFamily: 'Yeseva One, serif', fontSize: '1.25rem', color: '#ffffff', marginBottom: '0.5rem' }}>
                  {s.nombre}
                </h3>
                <p style={{ color: '#d1d5db', fontSize: '0.9rem', marginBottom: '1rem' }}>{s.descripcion}</p>
                <Link to="/reserva" state={{ fromHome: true }}>
                  <button
                    style={{
                      background: 'linear-gradient(135deg, #EB0463, #ff1a75)',
                      border: 'none',
                      padding: '0.85rem 1.5rem',
                      borderRadius: '999px',
                      color: '#ffffff',
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      boxShadow: '0 8px 20px rgba(235,4,99,0.5)',
                    }}
                  >
                    Reservar
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};

export default HomePage;
