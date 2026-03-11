// src/components/admin/ServiciosManager.jsx
import { useState, useEffect } from "react";
import serviciosService, {
  uploadImagen,
  invalidateServiciosCache,
} from "../../services/serviciosService";

const DEFAULT_FORM = {
  nombre: "",
  duracion: "",
  precio_bajo_cc: "",
  precio_alto_cc: "",
  descripcion: "",
  imagen: "/img/default.jpg",
  imagen_bajo_cc: "",
  imagen_alto_cc: "",
};

export default function ServiciosManager() {
  const [servicios, setServicios] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_FORM);

  useEffect(() => {
    loadServicios();
  }, []);

  const loadServicios = async () => {
    try {
      const data = await serviciosService.getServicios();
      setServicios(data);
    } catch (error) {
      console.error("Error al cargar servicios:", error);
      alert("Error al cargar servicios");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...formData,
        duracion: parseInt(formData.duracion, 10),
        precio_bajo_cc: parseFloat(formData.precio_bajo_cc),
        precio_alto_cc: parseFloat(formData.precio_alto_cc),
        precio: parseFloat(formData.precio_bajo_cc),
      };

      if (editingService) {
        await serviciosService.updateServicio(editingService.id, payload);
      } else {
        await serviciosService.addServicio(payload);
      }

      invalidateServiciosCache();
      await loadServicios();
      resetForm();
      alert(editingService ? "Servicio actualizado" : "Servicio creado");
    } catch (error) {
      console.error("Error al guardar servicio:", error);
      alert("Error al guardar el servicio");
    }
  };

  const handleEdit = (servicio) => {
    setEditingService(servicio);
    setFormData({
      nombre: servicio.nombre || "",
      duracion: (servicio.duracion || "").toString(),
      precio_bajo_cc: (servicio.precio_bajo_cc || servicio.precio || "").toString(),
      precio_alto_cc: (servicio.precio_alto_cc || servicio.precio || "").toString(),
      descripcion: servicio.descripcion || "",
      imagen: servicio.imagen || "/img/default.jpg",
      imagen_bajo_cc: servicio.imagen_bajo_cc || "",
      imagen_alto_cc: servicio.imagen_alto_cc || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este servicio?")) return;

    try {
      await serviciosService.deleteServicio(id);
      invalidateServiciosCache();
      await loadServicios();
      alert("Servicio eliminado");
    } catch (error) {
      console.error("Error al eliminar servicio:", error);
      alert("Error al eliminar el servicio");
    }
  };

  const resetForm = () => {
    setFormData(DEFAULT_FORM);
    setEditingService(null);
    setShowForm(false);
  };

  const uploadFileToField = async (file, field) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const dataUrl = ev.target?.result;
        if (!dataUrl) return;

        const { url } = await uploadImagen(dataUrl);
        setFormData((prev) => ({
          ...prev,
          [field]: url,
        }));
      } catch (error) {
        console.error("Error subiendo imagen:", error);
        alert("No se pudo subir la imagen");
      }
    };
    reader.readAsDataURL(file);
  };

  const formatPrecio = (precio) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(precio);
  };

  return (
    <div className="servicios-manager">
      <div className="servicios-header">
        <h1 className="admin-section-title">🏍️ Gestión de Servicios</h1>
        <button className="btn-neon-pill" onClick={() => setShowForm(true)}>
          + Nuevo Servicio
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingService ? "Editar Servicio" : "Nuevo Servicio"}</h2>
              <button className="modal-close" onClick={resetForm}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="service-form">
              <div className="form-group">
                <label>Nombre del servicio</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Duración (minutos)</label>
                  <input
                    type="number"
                    value={formData.duracion}
                    onChange={(e) => setFormData({ ...formData, duracion: e.target.value })}
                    min="15"
                    max="300"
                    step="15"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Precio Bajo CC (100-405cc)</label>
                  <input
                    type="number"
                    value={formData.precio_bajo_cc}
                    onChange={(e) => setFormData({ ...formData, precio_bajo_cc: e.target.value })}
                    min="0"
                    step="1000"
                    placeholder="Precio para motos de 100 a 405 CC"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Precio Alto CC (405-1200cc)</label>
                  <input
                    type="number"
                    value={formData.precio_alto_cc}
                    onChange={(e) => setFormData({ ...formData, precio_alto_cc: e.target.value })}
                    min="0"
                    step="1000"
                    placeholder="Precio para motos de 405 a 1200 CC"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Imagen para Bajo CC (100-405cc)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => uploadFileToField(e.target.files?.[0], "imagen_bajo_cc")}
                  />
                  {formData.imagen_bajo_cc && (
                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 10 }}>
                      <img
                        src={formData.imagen_bajo_cc}
                        alt="preview bajo cc"
                        loading="lazy"
                        decoding="async"
                        style={{
                          width: 60,
                          height: 60,
                          objectFit: "cover",
                          borderRadius: 8,
                          border: "1px solid #EB0463",
                        }}
                      />
                      <span style={{ fontSize: 12, color: "#6b7280" }}>✓ Imagen cargada</span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Imagen para Alto CC (405-1200cc)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => uploadFileToField(e.target.files?.[0], "imagen_alto_cc")}
                  />
                  {formData.imagen_alto_cc && (
                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 10 }}>
                      <img
                        src={formData.imagen_alto_cc}
                        alt="preview alto cc"
                        loading="lazy"
                        decoding="async"
                        style={{
                          width: 60,
                          height: 60,
                          objectFit: "cover",
                          borderRadius: 8,
                          border: "1px solid #EB0463",
                        }}
                      />
                      <span style={{ fontSize: 12, color: "#6b7280" }}>✓ Imagen cargada</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={resetForm} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingService ? "Actualizar" : "Crear"} Servicio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="servicios-grid">
        {servicios.map((servicio) => (
          <div key={servicio.id} className="service-card">
            <div className="service-images">
              {servicio.imagen_bajo_cc && servicio.imagen_alto_cc ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div style={{ position: "relative" }}>
                    <img
                      src={servicio.imagen_bajo_cc}
                      alt={`${servicio.nombre} bajo CC`}
                      style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 6 }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        bottom: 4,
                        left: 4,
                        background: "rgba(0,0,0,0.6)",
                        color: "#fff",
                        fontSize: "11px",
                        padding: "2px 6px",
                        borderRadius: 4,
                      }}
                    >
                      Bajo CC
                    </span>
                  </div>
                  <div style={{ position: "relative" }}>
                    <img
                      src={servicio.imagen_alto_cc}
                      alt={`${servicio.nombre} alto CC`}
                      style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 6 }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        bottom: 4,
                        left: 4,
                        background: "rgba(0,0,0,0.6)",
                        color: "#fff",
                        fontSize: "11px",
                        padding: "2px 6px",
                        borderRadius: 4,
                      }}
                    >
                      Alto CC
                    </span>
                  </div>
                </div>
              ) : (
                    <img
                  src={servicio.imagen || "/img/default.jpg"}
                  alt={servicio.nombre}
                  loading="lazy"
                  decoding="async"
                  style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 6 }}
                />
              )}
            </div>

            <div className="service-content">
              <h3>{servicio.nombre}</h3>
              <p className="service-description">{servicio.descripcion}</p>

              <div className="service-details">
                <div className="service-detail">
                  <span className="detail-icon">⏱️</span>
                  <span>{servicio.duracion} min</span>
                </div>
                <div className="service-detail">
                  <span className="detail-icon">💰</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {servicio.precio_bajo_cc && (
                      <span style={{ fontSize: "12px" }}>
                        Bajo CC: {formatPrecio(servicio.precio_bajo_cc)}
                      </span>
                    )}
                    {servicio.precio_alto_cc && (
                      <span style={{ fontSize: "12px" }}>
                        Alto CC: {formatPrecio(servicio.precio_alto_cc)}
                      </span>
                    )}
                    {!servicio.precio_bajo_cc && !servicio.precio_alto_cc && servicio.precio && (
                      <span>{formatPrecio(servicio.precio)}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="service-actions">
              <button className="btn-neon-pill" onClick={() => handleEdit(servicio)}>
                Editar
              </button>
              <button className="btn-neon-pill" onClick={() => handleDelete(servicio.id)}>
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {servicios.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🏍️</div>
          <h3>No hay servicios registrados</h3>
          <p>Comienza agregando tu primer servicio</p>
        </div>
      )}
    </div>
  );
}