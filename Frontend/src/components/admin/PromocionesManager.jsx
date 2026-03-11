import { useState, useEffect } from "react";
import serviciosService, { uploadImagen } from "../../services/serviciosService";

export default function PromocionesManager() {
  const [promociones, setPromociones] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });
  const [loading, setLoading] = useState(false);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    precio_cliente_bajo_cc: "",
    precio_cliente_alto_cc: "",
    precio_comision_bajo_cc: "",
    precio_comision_alto_cc: "",
    duracion: "60",
    activo: 1,
    fecha_inicio: "",
    fecha_fin: "",
    imagen_bajo_cc: "",
    imagen_alto_cc: "",
  });

  // Cargar promociones
  useEffect(() => {
    cargarPromociones();
  }, []);

  const cargarPromociones = async () => {
    try {
      const res = await fetch("/api/promociones");
      if (res.ok) {
        const data = await res.json();
        setPromociones(data);
      }
    } catch (error) {
      console.error("Error cargando promociones:", error);
      mostrarMensaje("Error al cargar promociones", "error");
    }
  };

  const exportarExcel = async (mode = 'detallado') => {
    try {
      const qs = new URLSearchParams();
      if (desde) qs.append('from', desde);
      if (hasta) qs.append('to', hasta);
      if (mode === 'resumen') qs.append('mode', 'summary');
      const res = await fetch(`/api/reportes/promociones-excel?${qs.toString()}`);
      if (!res.ok) {
        mostrarMensaje("No se pudo generar el Excel", "error");
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const base = mode === 'resumen' ? 'promociones-resumen' : 'promociones-detallado';
      a.download = `${base}-${new Date().toISOString().slice(0,10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      mostrarMensaje("Excel generado ✅", "success");
    } catch (e) {
      console.error(e);
      mostrarMensaje("Error generando Excel", "error");
    }
  };

  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: "", tipo: "" }), 3000);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    });
  };

  const resetForm = () => {
    setFormData({
      nombre: "",
      descripcion: "",
      precio_cliente_bajo_cc: "",
      precio_cliente_alto_cc: "",
      precio_comision_bajo_cc: "",
      precio_comision_alto_cc: "",
      duracion: "60",
      activo: 1,
      fecha_inicio: "",
      fecha_fin: "",
      imagen_bajo_cc: "",
      imagen_alto_cc: "",
    });
    setEditandoId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.nombre) {
      mostrarMensaje("El nombre es obligatorio", "error");
      setLoading(false);
      return;
    }

    try {
      const url = editandoId
        ? `/api/promociones/${editandoId}`
        : "/api/promociones";
      const method = editandoId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        mostrarMensaje(
          editandoId
            ? "Promoción actualizada ✅"
            : "Promoción creada ✅",
          "success"
        );
        cargarPromociones();
        resetForm();
      } else {
        const error = await res.json();
        mostrarMensaje(error.error || "Error al guardar", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      mostrarMensaje("Error al guardar la promoción", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (promocion) => {
    setFormData(promocion);
    setEditandoId(promocion.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta promoción?")) return;

    try {
      const res = await fetch(`/api/promociones/${id}`, { method: "DELETE" });
      if (res.ok) {
        mostrarMensaje("Promoción eliminada ✅", "success");
        cargarPromociones();
      }
    } catch (error) {
      console.error("Error:", error);
      mostrarMensaje("Error al eliminar", "error");
    }
  };

  const formatPrecio = (precio) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(precio);
  };

  return (
    <div className="promociones-manager">
      <div className="servicios-header">
        <h1>⚡ Gestión de Promociones</h1>
        <div style={{display:'flex', gap:'12px', alignItems:'center', flexWrap:'wrap'}}>
          <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
            <input type="date" value={desde} onChange={e=>setDesde(e.target.value)} />
            <span>→</span>
            <input type="date" value={hasta} onChange={e=>setHasta(e.target.value)} />
          </div>
          <button 
            className="btn-secondary"
            onClick={() => exportarExcel('resumen')}
          >
            ⬇️ Exportar Resumen
          </button>
          <button 
            className="btn-primary"
            onClick={() => exportarExcel('detallado')}
          >
            ⬇️ Exportar Detallado
          </button>
          <button 
            className="btn-primary"
            onClick={() => setShowForm(true)}
          >
            + Nueva Promoción
          </button>
        </div>
      </div>

      {/* Modal de formulario */}
      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editandoId ? 'Editar Promoción' : 'Nueva Promoción'}</h2>
              <button className="modal-close" onClick={resetForm}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="service-form">
              <div className="form-group">
                <label>Nombre de la promoción</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Ej: GOLD NAVIDEÑO"
                  required
                />
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  placeholder="Ej: Incluye dorado, navideño, etc..."
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Precio Cliente Bajo CC (100-405cc)</label>
                  <input
                    type="number"
                    name="precio_cliente_bajo_cc"
                    value={formData.precio_cliente_bajo_cc}
                    onChange={handleChange}
                    placeholder="25000"
                  />
                </div>
                <div className="form-group">
                  <label>Precio Cliente Alto CC (406-1200cc)</label>
                  <input
                    type="number"
                    name="precio_cliente_alto_cc"
                    value={formData.precio_cliente_alto_cc}
                    onChange={handleChange}
                    placeholder="28000"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label style={{color: '#d97706', fontWeight: 'bold'}}>💰 Precio Comisión Bajo CC *</label>
                  <input
                    type="number"
                    name="precio_comision_bajo_cc"
                    value={formData.precio_comision_bajo_cc}
                    onChange={handleChange}
                    placeholder="45000"
                    required
                  />
                  <small style={{color: '#d97706'}}>Sobre este valor se calcula la comisión</small>
                </div>
                <div className="form-group">
                  <label style={{color: '#d97706', fontWeight: 'bold'}}>💰 Precio Comisión Alto CC *</label>
                  <input
                    type="number"
                    name="precio_comision_alto_cc"
                    value={formData.precio_comision_alto_cc}
                    onChange={handleChange}
                    placeholder="45000"
                    required
                  />
                  <small style={{color: '#d97706'}}>Sobre este valor se calcula la comisión</small>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Duración (minutos)</label>
                  <input
                    type="number"
                    name="duracion"
                    value={formData.duracion}
                    onChange={handleChange}
                    min="30"
                    max="180"
                  />
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      name="activo"
                      checked={formData.activo === 1}
                      onChange={handleChange}
                    />
                    ✅ Promoción Activa
                  </label>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>📅 Fecha Inicio</label>
                  <input
                    type="date"
                    name="fecha_inicio"
                    value={formData.fecha_inicio}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>📅 Fecha Fin</label>
                  <input
                    type="date"
                    name="fecha_fin"
                    value={formData.fecha_fin}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Imagen Bajo CC (100-405cc)</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = async (ev) => {
                        try {
                          const dataUrl = ev.target.result;
                          const { url } = await uploadImagen(dataUrl);
                          setFormData((prev) => ({ ...prev, imagen_bajo_cc: url }));
                        } catch (err) {
                          console.error('Error subiendo imagen:', err);
                          alert('No se pudo subir la imagen');
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                  {formData.imagen_bajo_cc && (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 10 }}>
                      <img
                        src={formData.imagen_bajo_cc}
                        alt="preview bajo cc"
                        loading="lazy"
                        decoding="async"
                        style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid #EB0463' }}
                      />
                      <span style={{ fontSize: 12, color: '#6b7280' }}>✓ Imagen cargada</span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Imagen Alto CC (406-1200cc)</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = async (ev) => {
                        try {
                          const dataUrl = ev.target.result;
                          const { url } = await uploadImagen(dataUrl);
                          setFormData((prev) => ({ ...prev, imagen_alto_cc: url }));
                        } catch (err) {
                          console.error('Error subiendo imagen:', err);
                          alert('No se pudo subir la imagen');
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                  {formData.imagen_alto_cc && (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 10 }}>
                      <img
                        src={formData.imagen_alto_cc}
                        alt="preview alto cc"
                        loading="lazy"
                        decoding="async"
                        style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid #10b981' }}
                      />
                      <span style={{ fontSize: 12, color: '#6b7280' }}>✓ Imagen cargada</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? "Guardando..." : editandoId ? "Actualizar Promoción" : "Crear Promoción"}
                </button>
                <button type="button" onClick={resetForm} className="btn-secondary">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de promociones */}
      <div className="servicios-list">
        <h2>Promociones Existentes ({promociones.length})</h2>
        
        {mensaje.texto && (
          <div className={`alert alert-${mensaje.tipo}`} style={{marginBottom: '20px'}}>
            {mensaje.texto}
          </div>
        )}

        {promociones.length === 0 ? (
          <div className="empty-state">
            <div style={{fontSize: '48px', marginBottom: '10px'}}>📭</div>
            <p>No hay promociones creadas</p>
            <p style={{fontSize: '12px', color: '#999'}}>Crea tu primera promoción haciendo clic en "+ Nueva Promoción"</p>
          </div>
        ) : (
          <div className="servicios-grid">
            {promociones.map((promo) => (
              <div key={promo.id} className="servicio-card">
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  marginBottom: '10px'
                }}>
                  <h3 style={{margin: 0}}>{promo.nombre}</h3>
                  <span className={`badge ${promo.activo ? 'active' : 'inactive'}`}>
                    {promo.activo ? '✅ Activa' : '❌ Inactiva'}
                  </span>
                </div>

                {promo.descripcion && (
                  <p style={{fontSize: '13px', color: '#666', margin: '8px 0'}}>
                    {promo.descripcion}
                  </p>
                )}

                <div style={{
                  backgroundColor: '#f9fafb',
                  padding: '10px',
                  borderRadius: '6px',
                  marginBottom: '10px',
                  fontSize: '13px'
                }}>
                  <div style={{marginBottom: '8px'}}>
                    <strong>💵 Cliente:</strong>
                    <div>Bajo CC: {formatPrecio(promo.precio_cliente_bajo_cc)}</div>
                    <div>Alto CC: {formatPrecio(promo.precio_cliente_alto_cc)}</div>
                  </div>
                  <div style={{borderTop: '1px solid #e5e7eb', paddingTop: '8px'}}>
                    <strong style={{color: '#d97706'}}>💰 Comisión:</strong>
                    <div>Bajo CC: {formatPrecio(promo.precio_comision_bajo_cc)}</div>
                    <div>Alto CC: {formatPrecio(promo.precio_comision_alto_cc)}</div>
                  </div>
                </div>

                {(promo.fecha_inicio || promo.fecha_fin) && (
                  <div style={{fontSize: '12px', color: '#666', marginBottom: '10px'}}>
                    {promo.fecha_inicio && <div>📅 Desde: <strong>{promo.fecha_inicio}</strong></div>}
                    {promo.fecha_fin && <div>📅 Hasta: <strong>{promo.fecha_fin}</strong></div>}
                  </div>
                )}

                <div className="card-actions">
                  <button 
                    onClick={() => handleEdit(promo)}
                    className="btn-edit"
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => handleDelete(promo.id)}
                    className="btn-delete"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
