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
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-center mb-4">🔄 Cargando formulario...</h2>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#a65495] mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando servicios disponibles...</p>
        </div>
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

    // Generar solo fecha (hoy). Las citas de cliente se atienden por orden de llegada,
    // así que NO enviamos hora para evitar conflictos cuando varios reservan al mismo tiempo.
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');
    
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
      // hora: null -> el backend la deja en blanco y no aplica validación de traslapes
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
        <div className={`notificacion ${mensaje.tipo}`}>
          {mensaje.texto}
        </div>
      )}
      
      {/* Contador de motos en espera */}
      {motosEnEspera > 0 && (
        <div className="motos-en-espera" style={{
          backgroundColor: '#FEF3C7',
          border: '2px solid #F59E0B',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🏍️</div>
          <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#92400E', marginBottom: '4px' }}>
            {motosEnEspera} {motosEnEspera === 1 ? 'moto' : 'motos'} en espera
          </p>
          <p style={{ fontSize: '14px', color: '#78350F' }}>
            {motosEnEspera === 1 ? 'Hay 1 moto antes que la tuya' : `Hay ${motosEnEspera} motos antes que la tuya`}
          </p>
        </div>
      )}
      
      {motosEnEspera === 0 && (
        <div className="motos-en-espera" style={{
          backgroundColor: '#D1FAE5',
          border: '2px solid #10B981',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>✨</div>
          <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#065F46', marginBottom: '4px' }}>
            ¡Sin espera!
          </p>
          <p style={{ fontSize: '14px', color: '#047857' }}>
            Serías el primero en la fila hoy
          </p>
        </div>
      )}
      
      {/* Estado de carga para servicios */}
      {servicios.length === 0 && (
        <div className="text-center py-8">
          <div className="spinner border-4 border-[#a65495] border-t-transparent rounded-full w-8 h-8 mx-auto animate-spin"></div>
          <p className="mt-2 text-gray-600">Cargando servicios...</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="form-container">
        <input
          type="text"
          name="cliente"
          placeholder="Tu nombre completo"
          value={form.cliente}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="telefono"
          placeholder="Teléfono o WhatsApp"
          value={form.telefono}
          onChange={handleChange}
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Correo electrónico"
          value={form.email}
          onChange={handleChange}
          required
        />

        <h3>🏍️ Datos de tu moto</h3>
        
        <input
          type="text"
          name="placa"
          placeholder="Placa (ej: ABC123)"
          value={form.placa}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="marca"
          placeholder="Marca (ej: Yamaha, Honda, Suzuki)"
          value={form.marca}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="modelo"
          placeholder="Modelo (ej: FZ-16, CBR 600)"
          value={form.modelo}
          onChange={handleChange}
          required
        />

        <input
          type="number"
          name="cilindraje"
          placeholder="Cilindraje en CC (ej: 150, 600, 1000)"
          value={form.cilindraje}
          onChange={handleChange}
          min="50"
          max="2000"
          required
        />

        <h3>Método de pago</h3>
        <div className="metodo-pago-group">
          <label className={`opcion-pago ${form.metodo_pago === 'codigo_qr' ? 'selected' : ''}`}> 
            <input
              type="radio"
              name="metodo_pago"
              value="codigo_qr"
              checked={form.metodo_pago === 'codigo_qr'}
              onChange={handleChange}
            />
            <span>📲 Código QR</span>
          </label>
          <label className={`opcion-pago ${form.metodo_pago === 'efectivo' ? 'selected' : ''}`}> 
            <input
              type="radio"
              name="metodo_pago"
              value="efectivo"
              checked={form.metodo_pago === 'efectivo'}
              onChange={handleChange}
            />
            <span>💵 Efectivo</span>
          </label>
          <label className={`opcion-pago ${form.metodo_pago === 'tarjeta' ? 'selected' : ''}`}> 
            <input
              type="radio"
              name="metodo_pago"
              value="tarjeta"
              checked={form.metodo_pago === 'tarjeta'}
              onChange={handleChange}
            />
            <span>💳 Tarjeta</span>
          </label>
        </div>

        <h3>Selecciona tu servicio</h3>
        {(() => {
          const ccNumber = parseInt(form.cilindraje);
          const cilindrajeValido = !isNaN(ccNumber) && ccNumber >= 50 && ccNumber <= 2000;
          if (!cilindrajeValido) {
            return (
              <p className="aviso-cilindraje" style={{marginBottom: '16px', fontSize: '14px'}}>
                Ingresa el <strong>cilindraje</strong> válido (50 - 2000 cc) para ver y seleccionar los servicios.
              </p>
            );
          }
          return (
            <div className="servicios-grid">
              {serviciosDisponibles.map((s) => {
                // Determinar precio según cilindraje
                const cc = ccNumber || 0;
                const esBajoCC = cc >= 50 && cc <= 405;
                const esAltoCC = cc > 405 && cc <= 1200;
                
                // Determinar precio a mostrar
                let precioMostrar = s.precio_mostrar || s.precio;
                
                // Precio por servicio normal
                if (form.cilindraje && s.precio_bajo_cc && s.precio_alto_cc) {
                  if (esBajoCC) {
                    precioMostrar = s.precio_bajo_cc;
                  } else if (esAltoCC) {
                    precioMostrar = s.precio_alto_cc;
                  }
                }
                
                return (
                  <div
                    key={`${s.tipo}-${s.id || s.nombre}`}
                    className={`servicio-card ${
                      form.servicio === s.nombre ? "selected" : ""
                    }`}
                    onClick={() => handleServicioSelect(s)}
                  >
                    {(() => {
                      // Determinar qué imagen mostrar según el cilindraje
                      let imagenMostrar = s.imagen || s.img || "/img/default.jpg";
                      
                      // Imagen por servicio
                      if (esBajoCC && s.imagen_bajo_cc) {
                        imagenMostrar = s.imagen_bajo_cc;
                      } else if (esAltoCC && s.imagen_alto_cc) {
                        imagenMostrar = s.imagen_alto_cc;
                      }
                      
                      return <img src={imagenMostrar} alt={s.nombre} loading="lazy" />;
                    })()}
                    <div className="servicio-info">
                      <p className="servicio-nombre">
                        {s.nombre}
                        
                      </p>
                      {precioMostrar && (
                        <p className="servicio-precio">${precioMostrar.toLocaleString('es-CO')}</p>
                      )}
                      {form.cilindraje && (s.precio_bajo_cc || s.precio_cliente_bajo_cc) && (
                        <p className="text-xs text-gray-500">
                          {esBajoCC ? '(Bajo CC)' : esAltoCC ? '(Alto CC)' : ''}
                        </p>
                      )}
                      {s.descripcion && (
                        <p className="servicio-descripcion">{s.descripcion}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        <div className="aviso-orden" style={{marginTop: '8px', marginBottom: '16px', fontSize: '14px'}}>
          ⏱️ Se atiende por <strong>orden de llegada</strong>. No necesitas elegir hora.
        </div>

        <textarea
          name="comentarios"
          placeholder="Comentarios adicionales"
          value={form.comentarios}
          onChange={handleChange}
        />

        <div
          className="habeas-data-box"
          style={{
            marginTop: '16px',
            marginBottom: '20px',
            padding: '16px 18px',
            borderRadius: '14px',
            border: '2px solid rgba(235, 4, 99, 0.5)',
            background: 'linear-gradient(135deg, rgba(235, 4, 99, 0.12) 0%, rgba(20, 20, 20, 0.98) 100%)',
            boxShadow: '0 4px 16px rgba(235, 4, 99, 0.15)',
            fontSize: '14px',
            lineHeight: 1.5,
            color: '#e5e7eb',
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              cursor: 'pointer',
              margin: 0,
            }}
          >
            <input
              type="checkbox"
              checked={aceptaDatos}
              onChange={(e) => setAceptaDatos(e.target.checked)}
              required
              style={{
                marginTop: '4px',
                width: '20px',
                height: '20px',
                accentColor: '#EB0463',
                flexShrink: 0,
              }}
            />
            <span style={{ flex: 1 }}>
              Autorizo el tratamiento de mis datos personales de acuerdo con la política de privacidad del sistema, conforme a la <strong style={{ color: '#EB0463' }}>Ley 1581 de 2012</strong>.
            </span>
          </label>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Reservando..." : "Reservar cita"}
        </button>
      </form>
    </div>
  );
}
