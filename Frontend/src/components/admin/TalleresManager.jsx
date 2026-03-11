// Frontend/src/components/admin/TalleresManager.jsx
import { useState, useEffect } from "react";
import talleresService from "../../services/talleresService";

export default function TalleresManager() {
  const [talleres, setTalleres] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTaller, setEditingTaller] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    contacto: "",
    telefono: "",
    email: "",
    precio_bajo_cc: "",
    precio_alto_cc: ""
  });

  useEffect(() => {
    loadTalleres();
  }, []);

  const loadTalleres = async () => {
    try {
      const data = await talleresService.getTalleresAdmin();
      setTalleres(data);
    } catch (error) {
      console.error("Error al cargar talleres:", error);
      alert("Error al cargar talleres");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingTaller) {
        await talleresService.updateTaller(editingTaller.id, {
          ...formData,
          precio_bajo_cc: formData.precio_bajo_cc ? parseFloat(formData.precio_bajo_cc) : null,
          precio_alto_cc: formData.precio_alto_cc ? parseFloat(formData.precio_alto_cc) : null,
          activo: 1
        });
        alert("Taller actualizado");
      } else {
        await talleresService.createTaller({
          ...formData,
          precio_bajo_cc: formData.precio_bajo_cc ? parseFloat(formData.precio_bajo_cc) : null,
          precio_alto_cc: formData.precio_alto_cc ? parseFloat(formData.precio_alto_cc) : null
        });
        alert("Taller creado");
      }
      loadTalleres();
      resetForm();
    } catch (error) {
      console.error("Error:", error);
      alert("Error al guardar taller");
    }
  };

  const handleEdit = (taller) => {
    setEditingTaller(taller);
    setFormData({
      nombre: taller.nombre,
      contacto: taller.contacto || "",
      telefono: taller.telefono || "",
      email: taller.email || "",
      precio_bajo_cc: taller.precio_bajo_cc ? taller.precio_bajo_cc.toString() : "",
      precio_alto_cc: taller.precio_alto_cc ? taller.precio_alto_cc.toString() : ""
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este taller?")) return;
    
    try {
      await talleresService.deleteTaller(id);
      loadTalleres();
      alert("Taller eliminado");
    } catch (error) {
      console.error("Error:", error);
      alert("Error al eliminar taller");
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: "",
      contacto: "",
      telefono: "",
      email: "",
      precio_bajo_cc: "",
      precio_alto_cc: ""
    });
    setEditingTaller(null);
    setShowForm(false);
  };

  const formatPrecio = (precio) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(precio);
  };

  return (
    <div className="talleres-manager">
      <div className="talleres-header">
        <h1 className="admin-section-title">🏢 Talleres Aliados</h1>
        <button 
          className="btn-neon-pill"
          onClick={() => setShowForm(true)}
        >
          + Nuevo Taller
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTaller ? "Editar Taller" : "Nuevo Taller"}</h2>
              <button className="modal-close" onClick={resetForm}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="service-form">
              <div className="form-group">
                <label>Nombre del Taller</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Contacto</label>
                <input
                  type="text"
                  value={formData.contacto}
                  onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
                  placeholder="Nombre del encargado"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Teléfono</label>
                  <input
                    type="text"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Precio Bajo CC (100-405cc)</label>
                  <input
                    type="number"
                    value={formData.precio_bajo_cc}
                    onChange={(e) => setFormData({ ...formData, precio_bajo_cc: e.target.value })}
                    min="0"
                    step="1000"
                    placeholder="Precio especial"
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
                    placeholder="Precio especial"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={resetForm} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingTaller ? "Actualizar" : "Crear"} Taller
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="talleres-grid">
        {talleres.map(taller => (
          <div key={taller.id} className="taller-card">
            <div className="taller-header-card">
              <h3>🏢 {taller.nombre}</h3>
              {taller.activo === 0 && <span className="badge-inactivo">Inactivo</span>}
            </div>
            
            <div className="taller-info">
              {taller.contacto && <p><strong>Contacto:</strong> {taller.contacto}</p>}
              {taller.telefono && <p><strong>Teléfono:</strong> {taller.telefono}</p>}
              {taller.email && <p><strong>Email:</strong> {taller.email}</p>}
              
              <div className="taller-precios">
                {taller.precio_bajo_cc && (
                  <p><strong>Bajo CC:</strong> {formatPrecio(taller.precio_bajo_cc)}</p>
                )}
                {taller.precio_alto_cc && (
                  <p><strong>Alto CC:</strong> {formatPrecio(taller.precio_alto_cc)}</p>
                )}
              </div>
            </div>
            
            <div className="taller-actions">
              <button 
                className="btn-neon-pill"
                onClick={() => handleEdit(taller)}
              >
                Editar
              </button>
              <button 
                className="btn-neon-pill"
                onClick={() => handleDelete(taller.id)}
                style={{ boxShadow: '0 0 12px rgba(239, 68, 68, 0.7)' }}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {talleres.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🏢</div>
          <h3>No hay talleres registrados</h3>
          <p>Comienza agregando tu primer taller aliado</p>
        </div>
      )}

      <style>{`
        .talleres-manager {
          padding: 20px;
        }

        .talleres-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .talleres-header h1 {
          margin: 0;
        }

        .talleres-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }

        .taller-card {
          background: linear-gradient(135deg, rgba(235, 4, 99, 0.05) 0%, rgba(166, 84, 149, 0.05) 100%);
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          padding: 20px;
          border: 2px solid #EB0463;
          transition: all 0.3s ease;
        }

        .taller-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(235, 4, 99, 0.2);
        }

        .taller-header-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .taller-header-card h3 {
          margin: 0;
          font-size: 18px;
          color: #ffffff;
          font-weight: 700;
          font-family: 'Poppins', sans-serif;
        }

        .badge-inactivo {
          background: #fee;
          color: #c33;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
        }

        .taller-info {
          margin-bottom: 15px;
          font-size: 14px;
          color: #cccccc;
        }

        .taller-info p {
          margin: 6px 0;
        }

        .taller-info strong {
          color: #EB0463;
          font-weight: 600;
        }

        .taller-precios {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 2px solid rgba(235, 4, 99, 0.2);
        }

        .taller-precios p {
          color: #ffffff;
          font-weight: 500;
        }

        .taller-actions {
          display: flex;
          gap: 8px;
        }

        .btn-edit,
        .btn-delete {
          flex: 1;
          padding: 10px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.3s;
        }

        .btn-edit {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
        }

        .btn-edit:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
        }

        .btn-delete {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
        }

        .btn-delete:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }

        .empty-state {
          text-align: center;
          padding: 40px;
          color: #999;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 10px;
        }
      `}</style>
    </div>
  );
}
