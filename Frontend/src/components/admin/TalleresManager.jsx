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
        <h1>🏢 Talleres Aliados</h1>
        <button 
          className="btn-primary"
          onClick={() => setShowForm(true)}
        >
          + Nuevo Taller
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTaller ? 'Editar Taller' : 'Nuevo Taller'}</h2>
              <button className="modal-close" onClick={resetForm}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="taller-form">
              <div className="form-group">
                <label>Nombre del Taller</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Contacto</label>
                <input
                  type="text"
                  value={formData.contacto}
                  onChange={(e) => setFormData({...formData, contacto: e.target.value})}
                  placeholder="Nombre del encargado"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Teléfono</label>
                  <input
                    type="text"
                    value={formData.telefono}
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Precio Bajo CC (100-405cc)</label>
                  <input
                    type="number"
                    value={formData.precio_bajo_cc}
                    onChange={(e) => setFormData({...formData, precio_bajo_cc: e.target.value})}
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
                    onChange={(e) => setFormData({...formData, precio_alto_cc: e.target.value})}
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
                  {editingTaller ? 'Actualizar' : 'Crear'} Taller
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
                className="btn-edit"
                onClick={() => handleEdit(taller)}
              >
                Editar
              </button>
              <button 
                className="btn-delete"
                onClick={() => handleDelete(taller.id)}
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
          color: #1f2937;
          font-weight: 700;
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
          color: #374151;
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
          color: #1f2937;
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

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #eee;
        }

        .modal-header h2 {
          margin: 0;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 28px;
          cursor: pointer;
          color: #999;
        }

        .taller-form {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .taller-form input,
        .taller-form select {
          background: white !important;
          color: #0f172a !important; /* texto oscuro visible */
          caret-color: #EB0463;
          font-weight: 600;
          -webkit-text-fill-color: #0f172a !important;
        }

        .taller-form input::placeholder,
        .taller-form select::placeholder {
          color: #6b7280 !important; /* gris medio visible */
          opacity: 1;
          -webkit-text-fill-color: #6b7280 !important;
        }

        .taller-form input:focus,
        .taller-form select:focus {
          background: white !important;
          color: #000 !important;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-weight: 600;
          font-size: 14px;
          color: #333 !important;
          display: block;
          margin-bottom: 6px;
        }

        .form-group input {
          padding: 10px;
          border: 2px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          background: white !important;
          color: #0f172a !important;
          caret-color: #EB0463;
          font-weight: 600;
          -webkit-text-fill-color: #0f172a !important;
        }

        .form-group input:focus {
          outline: none;
          border-color: #EB0463;
          background: white !important;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .form-row input {
          padding: 10px;
          border: 2px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          background: white !important;
          color: #0f172a !important;
          caret-color: #EB0463;
          font-weight: 600;
          -webkit-text-fill-color: #0f172a !important;
        }

        .form-row input:focus {
          outline: none;
          border-color: #EB0463;
          background: white !important;
        }

        .form-actions {
          display: flex;
          gap: 10px;
          margin-top: 10px;
        }

        .btn-primary,
        .btn-secondary {
          padding: 10px 16px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          flex: 1;
        }

        .btn-primary {
          background: linear-gradient(135deg, #EB0463 0%, #a65495 100%);
          color: white;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(235,4,99,0.3);
        }

        .btn-secondary {
          background: #f0f0f0;
          color: #333;
        }

        .btn-secondary:hover {
          background: #e0e0e0;
        }
      `}</style>
    </div>
  );
}
