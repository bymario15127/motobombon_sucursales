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
      <div className="centered-page centered-page--portal" style={{ padding: "1.25rem" }}>
        <div className="mb-surface-card">
          <div className="mb-surface-card__icon" aria-hidden>🏢</div>
          <h2 className="mb-surface-card__title">Portal de Talleres</h2>
          <p className="mb-surface-card__text">
            No hay talleres registrados aún en el sistema.
          </p>
          <p className="mb-surface-card__hint">
            Contacta con la administración de MOTOBOMBON para registrar tu taller.
          </p>
          <button
            type="button"
            className="mb-surface-card__btn"
            onClick={() => { window.location.href = "/"; }}
          >
            ← Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="taller-portal-page">
      <div className="taller-portal-card">
        <p className="taller-portal-sucursal">📍 {sucursalNombre}</p>

        {mensaje.texto && (
          <div className={`taller-portal-notificacion ${mensaje.tipo}`}>
            {mensaje.texto}
          </div>
        )}

        <div className="taller-portal-header">
          <h1>🏢 Portal de Talleres Aliados</h1>
          <p>Ingresa las motos para servicio</p>
        </div>

        {motosEnEspera > 0 && (
          <div className="taller-portal-motos-banner">
            <div className="icon">🏍️</div>
            <p className="count">
              {motosEnEspera} {motosEnEspera === 1 ? "moto" : "motos"} en espera
            </p>
            <p className="text">
              {motosEnEspera === 1
                ? "Hay 1 moto antes de las nuevas"
                : `Hay ${motosEnEspera} motos antes de las nuevas`}
            </p>
            <p className="eta">
              Tiempo estimado: {calcularTiempoEspera() || "sin espera"}
            </p>
          </div>
        )}

        <form className="taller-portal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>🏢 Selecciona tu Taller</label>
            <select
              name="taller_id"
              value={form.taller_id}
              onChange={handleChange}
              required
              className="taller-portal-select"
            >
              <option value="">-- Selecciona un taller --</option>
              {talleres.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre} {t.contacto ? `(${t.contacto})` : ""}
                </option>
              ))}
            </select>
          </div>

          <h3 className="section-title">🏍️ Datos de la Moto</h3>
          <div className="form-row form-row-2">
            <div className="form-group">
              <input
                type="text"
                name="placa"
                placeholder="Placa (ej: ABC-123)"
                value={form.placa}
                onChange={handleChange}
                required
                className="taller-portal-input"
              />
            </div>
            <div className="form-group">
              <input
                type="text"
                name="marca"
                placeholder="Marca (ej: Yamaha, Honda)"
                value={form.marca}
                onChange={handleChange}
                required
                className="taller-portal-input"
              />
            </div>
          </div>
          <div className="form-row form-row-2">
            <div className="form-group">
              <input
                type="text"
                name="modelo"
                placeholder="Modelo (ej: FZ-16, CBR 600)"
                value={form.modelo}
                onChange={handleChange}
                required
                className="taller-portal-input"
              />
            </div>
            <div className="form-group">
              <input
                type="number"
                name="cilindraje"
                placeholder="Cilindraje CC (ej: 150, 600)"
                value={form.cilindraje}
                onChange={handleChange}
                min="50"
                max="2000"
                required
                className="taller-portal-input"
              />
            </div>
          </div>

          <h3 className="section-title">💰 Método de Pago</h3>
          <div className="taller-portal-radio-group">
            {["codigo_qr", "efectivo"].map((metodo) => (
              <label
                key={metodo}
                className={`taller-portal-radio-option ${form.metodo_pago === metodo ? "selected" : ""}`}
              >
                <input
                  type="radio"
                  name="metodo_pago"
                  value={metodo}
                  checked={form.metodo_pago === metodo}
                  onChange={handleChange}
                />
                {metodo === "codigo_qr" ? "📲 Código QR" : "💵 Efectivo"}
              </label>
            ))}
          </div>

          <h3 className="section-title">🔧 Selecciona Servicio</h3>
          {servicios.length === 0 ? (
            <p style={{ color: "#9ca3af", marginBottom: "1rem" }}>
              Cargando servicios...
            </p>
          ) : (
            (() => {
              const servicioCard = servicioSeleccionado || servicios[0];
              if (!servicioCard) return null;
              const precio = precioDinamico();
              const { bajo, alto } = preciosTaller();
              return (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => handleServicioSelect(servicioCard.nombre)}
                  onKeyDown={(e) =>
                    (e.key === "Enter" || e.key === " ") &&
                    handleServicioSelect(servicioCard.nombre)
                  }
                  className={`taller-portal-servicio-card ${form.servicio === servicioCard.nombre ? "selected" : ""}`}
                >
                  <p style={{ margin: "0 0 0.35rem 0", fontWeight: "700", fontSize: "1rem" }}>
                    Lavado
                  </p>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "#9ca3af" }}>
                    {servicioCard.duracion} min
                  </p>
                  {tallerSeleccionado ? (
                    precio ? (
                      <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9rem", color: "#f472b6", fontWeight: 700 }}>
                        Precio: {precio}
                      </p>
                    ) : (
                      <div style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "#f472b6", fontWeight: 600 }}>
                        <div>Bajo CC: {bajo || "N/D"}</div>
                        <div>Alto CC: {alto || "N/D"}</div>
                      </div>
                    )
                  ) : (
                    <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.85rem", color: "#f472b6", fontWeight: 600 }}>
                      Selecciona tu taller
                    </p>
                  )}
                </div>
              );
            })()
          )}

          <div className="form-group">
            <textarea
              name="comentarios"
              placeholder="Comentarios adicionales (opcional)"
              value={form.comentarios}
              onChange={handleChange}
              rows={3}
              className="taller-portal-textarea"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="taller-portal-submit"
          >
            {loading ? "Ingresando..." : "✅ Ingresar Moto al Sistema"}
          </button>
        </form>
      </div>
    </div>
  );
}
