import { useState, useEffect } from "react";
import { addCita, getCitas } from "../../services/citasService";
import serviciosService from "../../services/serviciosService";

export default function ReservaForm({ sucursalId }) {
  const [form, setForm] = useState({
    cliente: "",
    telefono: "",
    email: "",
    placa: "",
    marca: "",
    modelo: "",
    cilindraje: "",
    servicio: "",
    comentarios: "",
    metodo_pago: "",
    servicioId: null,
    sucursal_id: sucursalId, // Agregar sucursal_id al formulario
  });
  const [aceptaDatos, setAceptaDatos] = useState(false);
  
  const [servicios, setServicios] = useState([]);
  const [serviciosDisponibles, setServiciosDisponibles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });
  const [motosEnEspera, setMotosEnEspera] = useState(0);

  const loadServicios = async () => {
    try {
      console.log('🔍 Intentando cargar servicios desde API...');
      const data = await serviciosService.getServicios();
      console.log('✅ Servicios cargados:', data);
      
      if (Array.isArray(data) && data.length > 0) {
        setServicios(data);
      } else {
        console.warn('⚠️ No se obtuvieron servicios de la API, usando fallback');
        // Fallback a servicios por defecto si no hay datos
        const fallbackServicios = [
          { id: 1, nombre: "Lavado Básico", precio: 15000, duracion: 30, descripcion: "Lavado exterior completo", img: "/img/lavado-basico.jpg" },
          { id: 2, nombre: "Lavado Premium", precio: 25000, duracion: 60, descripcion: "Lavado + encerado y brillo", img: "/img/lavado-premium.jpg" },
          { id: 3, nombre: "Lavado Detallado", precio: 40000, duracion: 90, descripcion: "Lavado completo + motor + protección", img: "/img/lavado-detallado.jpg" },
        ];
        setServicios(fallbackServicios);
      }
    } catch (error) {
      console.error('❌ Error al cargar servicios:', error);
      // Fallback a servicios por defecto si hay error
      const fallbackServicios = [
        { id: 1, nombre: "Lavado Básico", precio: 15000, duracion: 30, descripcion: "Lavado exterior completo", img: "/img/lavado-basico.jpg" },
        { id: 2, nombre: "Lavado Premium", precio: 25000, duracion: 60, descripcion: "Lavado + encerado y brillo", img: "/img/lavado-premium.jpg" },
        { id: 3, nombre: "Lavado Detallado", precio: 40000, duracion: 90, descripcion: "Lavado completo + motor + protección", img: "/img/lavado-detallado.jpg" },
      ];
      setServicios(fallbackServicios);
    }
  };

  // Cargar servicios al montar el componente
  useEffect(() => {
    loadServicios();
    loadMotosEnEspera();
  }, []);

  // Actualizar sucursal_id cuando cambie el prop
  useEffect(() => {
    if (sucursalId) {
      setForm(prev => ({ ...prev, sucursal_id: sucursalId }));
    }
  }, [sucursalId]);

  // Filtrar servicios según el cilindraje
  useEffect(() => {
    if (!form.cilindraje) {
      setServiciosDisponibles([]);
      return;
    }

    const cc = parseInt(form.cilindraje);
    const disponibles = [];

    // Agregar solo servicios
    servicios.forEach(item => {
      disponibles.push({ ...item, tipo: 'servicio' });
    });

    setServiciosDisponibles(disponibles);
  }, [form.cilindraje, servicios]);

  // Función para contar motos en espera (citas de hoy pendientes/confirmadas/en curso)
  const loadMotosEnEspera = async () => {
    try {
      const todasLasCitas = await getCitas();
      const hoy = new Date();
      const yyyy = hoy.getFullYear();
      const mm = String(hoy.getMonth() + 1).padStart(2, '0');
      const dd = String(hoy.getDate()).padStart(2, '0');
      const fechaHoy = `${yyyy}-${mm}-${dd}`;
      
      // Contar citas de hoy que están pendientes, confirmadas o en curso
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

  // Mostrar loading mientras cargan los servicios
  if (servicios.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "2rem", color: "#e5e7eb" }}>
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#EB0463] border-t-transparent" style={{ margin: "0 auto 1rem" }} />
        <p style={{ margin: 0, fontSize: "0.95rem" }}>Cargando servicios disponibles...</p>
      </div>
    );
  }

  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: "", tipo: "" }), 5000);
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleServicioSelect = (servicioObj) => {
    setForm({ 
      ...form, 
      servicio: servicioObj.nombre
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validaciones básicas
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

    if (!aceptaDatos) {
      mostrarMensaje(
        "Debes aceptar el tratamiento de datos personales para continuar.",
        "error"
      );
      setLoading(false);
      return;
    }

    // Fecha y hora de registro (orden de llegada: la hora marca cuándo entró al sistema)
    const ahora = new Date();
    const yyyy = ahora.getFullYear();
    const mm = String(ahora.getMonth() + 1).padStart(2, '0');
    const dd = String(ahora.getDate()).padStart(2, '0');
    const hh = String(ahora.getHours()).padStart(2, '0');
    const mi = String(ahora.getMinutes()).padStart(2, '0');
    
    const citaData = {
      cliente: form.cliente,
      telefono: form.telefono,
      email: form.email,
      placa: form.placa,
      marca: form.marca,
      modelo: form.modelo,
      cilindraje: form.cilindraje,
      servicio: form.servicio,
      metodo_pago: form.metodo_pago,
      comentarios: form.comentarios,
      fecha: `${yyyy}-${mm}-${dd}`,
      hora: `${hh}:${mi}`,
    };
    
    // Promociones removidas

    console.log('📤 Enviando datos:', citaData);

    try {
      await addCita(citaData);
      
      mostrarMensaje("🎉 ¡Cita reservada con éxito! Te esperamos en MOTOBOMBON 🏍️✨", "success");
      
      setForm({
        cliente: "",
        telefono: "",
        email: "",
        placa: "",
        marca: "",
        modelo: "",
        cilindraje: "",
        servicio: "",
        comentarios: "",
        metodo_pago: "",
        servicioId: null,
      });
      setAceptaDatos(false);
      
    } catch (error) {
      mostrarMensaje(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {mensaje.texto && (
        <div className={`reserva-portal-notificacion ${mensaje.tipo}`}>
          {mensaje.texto}
        </div>
      )}

      {motosEnEspera > 0 && (
        <div className="reserva-portal-banner con-espera">
          <div style={{ fontSize: "1.5rem", marginBottom: "0.35rem" }}>🏍️</div>
          <p className="banner-title">
            {motosEnEspera} {motosEnEspera === 1 ? "moto" : "motos"} en espera
          </p>
          <p className="banner-text">
            {motosEnEspera === 1 ? "Hay 1 moto antes que la tuya" : `Hay ${motosEnEspera} motos antes que la tuya`}
          </p>
        </div>
      )}

      {motosEnEspera === 0 && (
        <div className="reserva-portal-banner sin-espera">
          <div style={{ fontSize: "1.5rem", marginBottom: "0.35rem" }}>✨</div>
          <p className="banner-title">¡Sin espera!</p>
          <p className="banner-text">Serías el primero en la fila hoy</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="reserva-portal-form">
        <div className="form-row form-row-2">
          <div className="form-group">
            <input
              type="text"
              name="cliente"
              placeholder="Tu nombre completo"
              value={form.cliente}
              onChange={handleChange}
              required
              className="reserva-portal-input"
            />
          </div>
          <div className="form-group">
            <input
              type="text"
              name="telefono"
              placeholder="Teléfono o WhatsApp"
              value={form.telefono}
              onChange={handleChange}
              required
              className="reserva-portal-input"
            />
          </div>
        </div>
        <div className="form-group">
          <input
            type="email"
            name="email"
            placeholder="Correo electrónico"
            value={form.email}
            onChange={handleChange}
            required
            className="reserva-portal-input"
          />
        </div>

        <h3 className="section-title">🏍️ Datos de tu moto</h3>
        <div className="form-row form-row-2">
          <div className="form-group">
            <input
              type="text"
              name="placa"
              placeholder="Placa (ej: ABC123)"
              value={form.placa}
              onChange={handleChange}
              required
              className="reserva-portal-input"
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
              className="reserva-portal-input"
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
              className="reserva-portal-input"
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
              className="reserva-portal-input"
            />
          </div>
        </div>

        <h3 className="section-title">💰 Método de pago</h3>
        <div className="reserva-portal-radio-group">
          <label className={`reserva-portal-radio-option ${form.metodo_pago === "codigo_qr" ? "selected" : ""}`}>
            <input
              type="radio"
              name="metodo_pago"
              value="codigo_qr"
              checked={form.metodo_pago === "codigo_qr"}
              onChange={handleChange}
            />
            📲 Código QR
          </label>
          <label className={`reserva-portal-radio-option ${form.metodo_pago === "efectivo" ? "selected" : ""}`}>
            <input
              type="radio"
              name="metodo_pago"
              value="efectivo"
              checked={form.metodo_pago === "efectivo"}
              onChange={handleChange}
            />
            💵 Efectivo
          </label>
          <label className={`reserva-portal-radio-option ${form.metodo_pago === "tarjeta" ? "selected" : ""}`}>
            <input
              type="radio"
              name="metodo_pago"
              value="tarjeta"
              checked={form.metodo_pago === "tarjeta"}
              onChange={handleChange}
            />
            💳 Tarjeta
          </label>
        </div>

        <h3 className="section-title">🔧 Selecciona tu servicio</h3>
        {(() => {
          const ccNumber = parseInt(form.cilindraje);
          const cilindrajeValido = !isNaN(ccNumber) && ccNumber >= 50 && ccNumber <= 2000;
          if (!cilindrajeValido) {
            return (
              <p className="reserva-portal-aviso">
                Ingresa el <strong>cilindraje</strong> válido (50 – 2000 cc) para ver y seleccionar los servicios.
              </p>
            );
          }
          return (
            <div className="servicios-grid">
              {serviciosDisponibles.map((s) => {
                const cc = ccNumber || 0;
                const esBajoCC = cc >= 50 && cc <= 405;
                const esAltoCC = cc > 405 && cc <= 1200;
                let precioMostrar = s.precio_mostrar || s.precio;
                if (form.cilindraje && s.precio_bajo_cc && s.precio_alto_cc) {
                  if (esBajoCC) precioMostrar = s.precio_bajo_cc;
                  else if (esAltoCC) precioMostrar = s.precio_alto_cc;
                }
                let imagenMostrar = s.imagen || s.img || "/img/default.jpg";
                if (esBajoCC && s.imagen_bajo_cc) imagenMostrar = s.imagen_bajo_cc;
                else if (esAltoCC && s.imagen_alto_cc) imagenMostrar = s.imagen_alto_cc;
                return (
                  <div
                    key={`${s.tipo}-${s.id || s.nombre}`}
                    className={`servicio-card ${form.servicio === s.nombre ? "selected" : ""}`}
                    onClick={() => handleServicioSelect(s)}
                  >
                    <img src={imagenMostrar} alt={s.nombre} loading="lazy" />
                    <div className="servicio-info">
                      <p className="servicio-nombre">{s.nombre}</p>
                      {precioMostrar && (
                        <p className="servicio-precio">${precioMostrar.toLocaleString("es-CO")}</p>
                      )}
                      {form.cilindraje && (s.precio_bajo_cc || s.precio_cliente_bajo_cc) && (
                        <p style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                          {esBajoCC ? "(Bajo CC)" : esAltoCC ? "(Alto CC)" : ""}
                        </p>
                      )}
                      {s.descripcion && <p className="servicio-descripcion">{s.descripcion}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        <p className="reserva-portal-aviso">
          ⏱️ Se atiende por <strong>orden de llegada</strong>. No necesitas elegir hora.
        </p>

        <div className="form-group">
          <textarea
            name="comentarios"
            placeholder="Comentarios adicionales (opcional)"
            value={form.comentarios}
            onChange={handleChange}
            className="reserva-portal-textarea"
            rows={3}
          />
        </div>

        <div className="reserva-portal-habeas">
          <label>
            <input
              type="checkbox"
              checked={aceptaDatos}
              onChange={(e) => setAceptaDatos(e.target.checked)}
              required
            />
            <span>
              Autorizo el tratamiento de mis datos personales de acuerdo con la política de privacidad del sistema, conforme a la <strong>Ley 1581 de 2012</strong>.
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading || !aceptaDatos}
          className="reserva-portal-submit"
        >
          {loading ? "Reservando..." : "Reservar cita"}
        </button>
      </form>
    </div>
  );
}
