// Frontend/src/pages/TallerPage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { addCita, getCitas } from "../services/citasService";
import talleresService from "../services/talleresService";
import serviciosService from "../services/serviciosService";

export default function TallerPage() {
  const { sucursalId } = useParams();
  const navigate = useNavigate();
  const [talleres, setTalleres] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });
  const [motosEnEspera, setMotosEnEspera] = useState(0);
  
  // Obtener el nombre de la sucursal del localStorage
  const sucursalNombre = localStorage.getItem('motobombon_sucursal_nombre') || 'Sucursal';
  
  const [form, setForm] = useState({
    taller_id: "",
    placa: "",
    marca: "",
    modelo: "",
    cilindraje: "",
    servicio: "",
    comentarios: "",
    metodo_pago: "",
  });

  useEffect(() => {
    // Si no hay sucursal en la URL, redirigir al selector
    if (!sucursalId) {
      navigate('/');
      return;
    }
    
    const params = new URLSearchParams(window.location.search);
    loadTalleres();
    loadServicios();
    loadMotosEnEspera();
  }, [sucursalId, navigate]);

  const loadTalleres = async () => {
    try {
      const data = await talleresService.getTalleres();
      console.log("Talleres cargados:", data);
      if (data && data.length > 0) {
        setTalleres(data);
      } else {
        setTalleres([]);
        mostrarMensaje("⚠️ No hay talleres registrados aún. Contacta con administración.", "error");
      }
    } catch (error) {
      console.error("Error al cargar talleres:", error);
      setTalleres([]);
      mostrarMensaje("Error al cargar talleres: " + error.message, "error");
    }
  };

  const loadServicios = async () => {
    try {
      const data = await serviciosService.getServicios();
      setServicios(data);
      if (!form.servicio && data?.length > 0) {
        setForm((prev) => ({ ...prev, servicio: data[0].nombre }));
      }
    } catch (error) {
      console.error("Error al cargar servicios:", error);
    }
  };

  const loadMotosEnEspera = async () => {
    try {
      const todasLasCitas = await getCitas();
      const hoy = new Date();
      const yyyy = hoy.getFullYear();
      const mm = String(hoy.getMonth() + 1).padStart(2, '0');
      const dd = String(hoy.getDate()).padStart(2, '0');
      const fechaHoy = `${yyyy}-${mm}-${dd}`;
      
      const citasHoy = todasLasCitas.filter(cita => 
        cita.fecha === fechaHoy && 
        ['pendiente', 'confirmada', 'en curso'].includes(cita.estado)
      );
      
      setMotosEnEspera(citasHoy.length);
    } catch (error) {
      console.error('Error al cargar motos en espera:', error);
      setMotosEnEspera(0);
    }
  };

  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: "", tipo: "" }), 5000);
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleServicioSelect = (nombre) => {
    setForm({ ...form, servicio: nombre });
  };

  const tallerSeleccionado = talleres.find(t => t.id === parseInt(form.taller_id));
  const servicioSeleccionado = servicios.find(s => s.nombre === form.servicio);

  const formatCOP = (value) => {
    if (value === null || value === undefined || isNaN(value)) return null;
    return value.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
  };

  const preciosTaller = () => {
    if (!tallerSeleccionado) return { bajo: null, alto: null };
    const bajo = formatCOP(tallerSeleccionado?.precio_bajo_cc);
    const alto = formatCOP(tallerSeleccionado?.precio_alto_cc ?? tallerSeleccionado?.precio_bajo_cc);
    return { bajo, alto };
  };

  const calcularTiempoEspera = () => {
    if (motosEnEspera <= 0) return null;
    const duracionMin = servicioSeleccionado?.duracion || 30;
    const totalMin = motosEnEspera * duracionMin;
    const horas = Math.floor(totalMin / 60);
    const minutos = totalMin % 60;
    if (horas > 0) return `${horas}h ${minutos}m`;
    return `${minutos} min`;
  };

  const precioDinamico = () => {
    if (!tallerSeleccionado) return null;
    const ccNumber = parseInt(form.cilindraje);
    if (isNaN(ccNumber)) return null;
    const limiteCC = 405;
    const usaAlto = ccNumber > limiteCC;
    const valor = usaAlto ? tallerSeleccionado?.precio_alto_cc : tallerSeleccionado?.precio_bajo_cc;
    const fallback = tallerSeleccionado?.precio_bajo_cc ?? tallerSeleccionado?.precio_alto_cc;
    return formatCOP(valor ?? fallback);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validaciones
    if (!form.taller_id) {
      mostrarMensaje("Selecciona un taller", "error");
      setLoading(false);
      return;
    }

    const ccNumber = parseInt(form.cilindraje);
    const cilindrajeValido = !isNaN(ccNumber) && ccNumber >= 50 && ccNumber <= 2000;
    if (!cilindrajeValido) {
      mostrarMensaje("Por favor ingresa un cilindraje válido (50 - 2000 cc)", "error");
      setLoading(false);
      return;
    }

    if (!form.servicio) {
      mostrarMensaje("Selecciona un servicio", "error");
      setLoading(false);
      return;
    }

    if (!form.metodo_pago) {
      mostrarMensaje("Selecciona un método de pago", "error");
      setLoading(false);
      return;
    }
    
    // Obtener datos del taller
    const tallerSeleccionado = talleres.find(t => t.id === parseInt(form.taller_id));

    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');
    const hh = String(hoy.getHours()).padStart(2, '0');
    const mi = String(hoy.getMinutes()).padStart(2, '0');

    const citaData = {
      cliente: tallerSeleccionado?.nombre || "Taller Aliado",
      telefono: tallerSeleccionado?.telefono || "",
      email: tallerSeleccionado?.email || "",
      placa: form.placa,
      marca: form.marca,
      modelo: form.modelo,
      cilindraje: form.cilindraje,
      servicio: form.servicio,
      metodo_pago: form.metodo_pago,
      comentarios: form.comentarios,
      fecha: `${yyyy}-${mm}-${dd}`,
      hora: `${hh}:${mi}`,
      tipo_cliente: "taller", // IMPORTANTE: marcar como taller
      taller_id: form.taller_id
    };

    try {
      await addCita(citaData);
      
      mostrarMensaje("🎉 ¡Moto ingresada al sistema! Gracias por confiar en MOTOBOMBON 🏍️✨", "success");
      
      setForm({
        taller_id: "",
        placa: "",
        marca: "",
        modelo: "",
        cilindraje: "",
        servicio: "",
        comentarios: "",
        metodo_pago: "",
      });
      
      loadMotosEnEspera();
    } catch (error) {
      mostrarMensaje(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  if (talleres.length === 0) {
    return (
      <div style={{ minHeight: "100vh", background: "#050505", padding: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{
          background: "#0f0f14",
          borderRadius: "16px",
          padding: "40px",
          maxWidth: "520px",
          width: "100%",
          boxShadow: "0 20px 60px rgba(235,4,99,0.25)",
          border: "1px solid rgba(235,4,99,0.35)",
          textAlign: "center"
        }}>
          <div style={{ fontSize: "48px", marginBottom: "20px" }}>🏢</div>
          <h2 style={{ fontSize: "24px", color: "#EB0463", marginBottom: "10px" }}>Portal de Talleres</h2>
          <p style={{ fontSize: "16px", color: "#e5e7eb", marginBottom: "20px", lineHeight: "1.6" }}>
            ⚠️ No hay talleres registrados aún en el sistema.
          </p>
          <p style={{ fontSize: "14px", color: "#9ca3af", marginBottom: "20px" }}>
            Contacta con la administración de MOTOBOMBON para registrar tu taller.
          </p>
          <button
            onClick={() => window.location.href = "/"}
            style={{
              padding: "12px 24px",
              background: "linear-gradient(135deg, #EB0463 0%, #a65495 100%)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: "700",
              cursor: "pointer",
              boxShadow: "0 12px 30px rgba(235,4,99,0.35)"
            }}
          >
            ← Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="taller-page" style={{ minHeight: "100vh", background: "#050505", padding: "20px" }}>
      <div className="taller-card" style={{ maxWidth: "900px", margin: "0 auto", background: "#0b0b0f", border: "1px solid #EB0463", borderRadius: "14px", boxShadow: "0 20px 60px rgba(235,4,99,0.25)", padding: "20px" }}>
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
        
        {mensaje.texto && (
          <div className={`notificacion ${mensaje.tipo}`}>
            {mensaje.texto}
          </div>
        )}
        
        <div style={{
          background: "#0f0f14",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "20px",
          textAlign: "center",
          border: "1px solid rgba(235,4,99,0.35)",
          boxShadow: "0 15px 40px rgba(235,4,99,0.15)"
        }}>
          <h1 style={{ fontSize: "28px", margin: "0 0 10px 0", color: "#EB0463", letterSpacing: "0.3px" }}>
            🏢 Portal de Talleres Aliados
          </h1>
          <p style={{ color: "#e5e7eb", margin: "0" }}>
            Ingresa las motos para servicio
          </p>
        </div>

        {motosEnEspera > 0 && (
          <div style={{
            background: '#0f0f14',
            border: '1px solid rgba(235,4,99,0.35)',
            borderRadius: '10px',
            padding: '16px',
            marginBottom: '20px',
            textAlign: 'center',
            boxShadow: '0 12px 30px rgba(235,4,99,0.15)'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🏍️</div>
            <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#EB0463', marginBottom: '4px' }}>
              {motosEnEspera} {motosEnEspera === 1 ? 'moto' : 'motos'} en espera
            </p>
            <p style={{ fontSize: '14px', color: '#e5e7eb' }}>
              {motosEnEspera === 1 ? 'Hay 1 moto antes de las nuevas' : `Hay ${motosEnEspera} motos antes de las nuevas`}
            </p>
            <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '8px' }}>
              Tiempo estimado: {calcularTiempoEspera() || 'sin espera' }
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{
          background: "#0f0f14",
          borderRadius: "12px",
          padding: "20px",
          boxShadow: "0 15px 40px rgba(235,4,99,0.15)",
          border: "1px solid rgba(235,4,99,0.35)"
        }}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontWeight: "700", marginBottom: "8px", color: "#e5e7eb" }}>
              🏢 Selecciona tu Taller
            </label>
            <select
              name="taller_id"
              value={form.taller_id}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid rgba(235,4,99,0.5)",
                borderRadius: "8px",
                fontSize: "14px",
                fontFamily: "inherit",
                background: "#0b0b10",
                color: "#f9fafb",
                outline: "none",
                boxShadow: "0 10px 30px rgba(0,0,0,0.35)"
              }}
            >
              <option value="">-- Selecciona un taller --</option>
              {talleres.map(t => (
                <option key={t.id} value={t.id}>
                  {t.nombre} {t.contacto ? `(${t.contacto})` : ''}
                </option>
              ))}
            </select>
          </div>

          <h3 style={{ fontSize: "16px", fontWeight: "700", marginTop: "20px", marginBottom: "12px", color: "#e5e7eb" }}>
            🏍️ Datos de la Moto
          </h3>

          <div style={{ marginBottom: "12px" }}>
            <input
              type="text"
              name="placa"
              placeholder="Placa (ej: ABC-123)"
              value={form.placa}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid rgba(235,4,99,0.5)",
                borderRadius: "8px",
                fontSize: "14px",
                boxSizing: "border-box",
                background: "#0b0b10",
                color: "#f9fafb"
              }}
            />
          </div>

          <div style={{ marginBottom: "12px" }}>
            <input
              type="text"
              name="marca"
              placeholder="Marca (ej: Yamaha, Honda)"
              value={form.marca}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid rgba(235,4,99,0.5)",
                borderRadius: "8px",
                fontSize: "14px",
                boxSizing: "border-box",
                background: "#0b0b10",
                color: "#f9fafb"
              }}
            />
          </div>

          <div style={{ marginBottom: "12px" }}>
            <input
              type="text"
              name="modelo"
              placeholder="Modelo (ej: FZ-16, CBR 600)"
              value={form.modelo}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid rgba(235,4,99,0.5)",
                borderRadius: "8px",
                fontSize: "14px",
                boxSizing: "border-box",
                background: "#0b0b10",
                color: "#f9fafb"
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <input
              type="number"
              name="cilindraje"
              placeholder="Cilindraje en CC (ej: 150, 600)"
              value={form.cilindraje}
              onChange={handleChange}
              min="50"
              max="2000"
              required
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid rgba(235,4,99,0.5)",
                borderRadius: "8px",
                fontSize: "14px",
                boxSizing: "border-box",
                background: "#0b0b10",
                color: "#f9fafb"
              }}
            />
          </div>

          <h3 style={{ fontSize: "16px", fontWeight: "700", marginTop: "20px", marginBottom: "12px", color: "#e5e7eb" }}>
            💰 Método de Pago
          </h3>

          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            {['codigo_qr', 'efectivo'].map(metodo => (
              <label key={metodo} style={{
                flex: 1,
                padding: "12px",
                border: `1px solid ${form.metodo_pago === metodo ? '#EB0463' : 'rgba(235,4,99,0.35)'}`,
                borderRadius: "10px",
                cursor: "pointer",
                background: form.metodo_pago === metodo ? 'rgba(235,4,99,0.12)' : '#0b0b10',
                transition: "all 0.3s",
                color: '#f9fafb',
                boxShadow: "0 8px 24px rgba(0,0,0,0.35)"
              }}>
                <input
                  type="radio"
                  name="metodo_pago"
                  value={metodo}
                  checked={form.metodo_pago === metodo}
                  onChange={handleChange}
                  style={{ marginRight: "6px" }}
                />
                <span style={{ fontWeight: "600" }}>
                  {metodo === 'codigo_qr' ? '📲 Código QR' : '💵 Efectivo'}
                </span>
              </label>
            ))}
          </div>

          <h3 style={{ fontSize: "16px", fontWeight: "700", marginTop: "20px", marginBottom: "12px", color: "#e5e7eb" }}>
            🔧 Selecciona Servicio
          </h3>

          {servicios.length === 0 ? (
            <p style={{ color: "#999" }}>Cargando servicios...</p>
          ) : (
            (() => {
              const servicioCard = servicioSeleccionado || servicios[0];
              if (!servicioCard) return null;
              const precio = precioDinamico();
              const { bajo, alto } = preciosTaller();

              return (
                <div
                  onClick={() => handleServicioSelect(servicioCard.nombre)}
                  style={{
                    padding: "14px",
                    border: `1px solid ${form.servicio === servicioCard.nombre ? '#EB0463' : 'rgba(235,4,99,0.35)'}`,
                    borderRadius: "12px",
                    cursor: "pointer",
                    background: form.servicio === servicioCard.nombre ? 'rgba(235,4,99,0.12)' : '#0b0b10',
                    textAlign: "center",
                    transition: "all 0.3s",
                    color: '#f9fafb',
                    boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
                    marginBottom: "20px"
                  }}
                >
                  <p style={{ margin: "0 0 6px 0", fontWeight: "700", fontSize: "15px", letterSpacing: "0.2px" }}>
                    Lavado
                  </p>
                  <p style={{ margin: "0", fontSize: "12px", color: "#9ca3af" }}>
                    {servicioCard.duracion} min
                  </p>

                  {tallerSeleccionado ? (
                    precio ? (
                      <p style={{ margin: "6px 0 0 0", fontSize: "13px", color: "#f472b6", fontWeight: 700 }}>
                        Precio: {precio}
                      </p>
                    ) : (
                      <div style={{ marginTop: "6px", fontSize: "12px", color: "#f472b6", fontWeight: 600, lineHeight: 1.35 }}>
                        <div>Bajo CC: {bajo || "N/D"}</div>
                        <div>Alto CC: {alto || "N/D"}</div>
                      </div>
                    )
                  ) : (
                    <p style={{ margin: "6px 0 0 0", fontSize: "12px", color: "#f472b6", fontWeight: 600 }}>
                      Selecciona tu taller
                    </p>
                  )}
                </div>
              );
            })()
          )}

          <div style={{ marginBottom: "20px" }}>
            <textarea
              name="comentarios"
              placeholder="Comentarios adicionales (opcional)"
              value={form.comentarios}
              onChange={handleChange}
              rows="3"
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid rgba(235,4,99,0.5)",
                borderRadius: "8px",
                fontSize: "14px",
                fontFamily: "inherit",
                boxSizing: "border-box",
                background: "#0b0b10",
                color: "#f9fafb"
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              background: loading ? "#ccc" : "linear-gradient(135deg, #EB0463 0%, #a65495 100%)",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontWeight: "700",
              fontSize: "16px",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.3s",
              boxShadow: "0 14px 35px rgba(235,4,99,0.35)"
            }}
          >
            {loading ? "Ingresando..." : "✅ Ingresar Moto al Sistema"}
          </button>
        </form>
      </div>

      <style>{`
        .notificacion {
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-weight: 600;
          text-align: center;
          color: #f9fafb;
          background: #0b0b10;
          border: 1px solid rgba(235,4,99,0.35);
          box-shadow: 0 12px 30px rgba(235,4,99,0.15);
        }

        .notificacion.success {
          background: rgba(16, 185, 129, 0.12);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.6);
        }

        .notificacion.error {
          background: rgba(248, 113, 113, 0.12);
          color: #f87171;
          border: 1px solid rgba(248, 113, 113, 0.6);
        }
      `}</style>
    </div>
  );
}
