// src/components/admin/LavadoresManager.jsx
import { useState, useEffect } from 'react';
import { getLavadores, addLavador, updateLavador, deleteLavador } from '../../services/lavadoresService';

const LavadoresManager = () => {
  const [lavadores, setLavadores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingLavador, setEditingLavador] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    cedula: '',
    activo: 1,
    comision_porcentaje: 30.0
  });

  useEffect(() => {
    loadLavadores();
  }, []);

  const loadLavadores = async () => {
    try {
      setLoading(true);
      const data = await getLavadores();
      setLavadores(data);
    } catch (error) {
      console.error('Error al cargar lavadores:', error);
      alert('Error al cargar lavadores');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingLavador) {
        await updateLavador(editingLavador.id, formData);
        alert('✅ Lavador actualizado exitosamente');
      } else {
        await addLavador(formData);
        alert('✅ Lavador creado exitosamente');
      }
      
      setShowModal(false);
      setEditingLavador(null);
      setFormData({ nombre: '', cedula: '', activo: 1, comision_porcentaje: 30.0 });
      loadLavadores();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleEdit = (lavador) => {
    setEditingLavador(lavador);
    setFormData({
      nombre: lavador.nombre,
      cedula: lavador.cedula || '',
      activo: lavador.activo,
      comision_porcentaje: lavador.comision_porcentaje || 30.0
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de desactivar este lavador?')) return;
    
    try {
      await deleteLavador(id);
      alert('✅ Lavador desactivado');
      loadLavadores();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingLavador(null);
    setFormData({ nombre: '', cedula: '', activo: 1, comision_porcentaje: 30.0 });
  };

  return (
    <>
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px' }}>
          <h2 className="admin-section-title">👤 Gestión de Lavadores</h2>
          <button
            onClick={() => setShowModal(true)}
            className="btn-neon-pill"
          >
            + Nuevo Lavador
          </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ 
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
          <p style={{ marginTop: '10px' }}>Cargando lavadores...</p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '20px' 
        }}>
          {lavadores.map((lavador) => (
            <div
              key={lavador.id}
              style={{
                background: 'linear-gradient(135deg, rgba(235, 4, 99, 0.05) 0%, rgba(166, 84, 149, 0.05) 100%)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                border: '2px solid #EB0463',
                backdropFilter: 'blur(10px)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(235, 4, 99, 0.4)';
                e.currentTarget.style.border = '2px solid #a65495';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                e.currentTarget.style.border = '2px solid #EB0463';
              }}
            >
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 className="admin-card-title" style={{ margin: 0 }}>
                    {lavador.nombre}
                  </h3>
                  <span style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    background: lavador.activo ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: 'white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }}>
                    {lavador.activo ? '✓ Activo' : '✗ Inactivo'}
                  </span>
                </div>
              </div>

              {lavador.cedula && (
                <p className="admin-text-muted" style={{ margin: '10px 0' }}>
                  🆔 {lavador.cedula}
                </p>
              )}

              <p className="admin-card-label" style={{ margin: '10px 0', color: '#10b981' }}>
                💰 Comisión: {lavador.comision_porcentaje || 30}%
              </p>

              <p className="admin-text-muted" style={{ margin: '8px 0', fontSize: '13px' }}>
                📅 Registro: {new Date(lavador.created_at).toLocaleDateString()}
              </p>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  onClick={() => handleEdit(lavador)}
                  className="btn-neon-pill"
                  style={{ flex: 1, minWidth: '120px' }}
                >
                  Editar
                </button>
                {lavador.activo === 1 && (
                  <button
                    onClick={() => handleDelete(lavador.id)}
                    className="btn-neon-pill"
                    style={{ flex: 1, minWidth: '120px', boxShadow: '0 0 12px rgba(239, 68, 68, 0.8)' }}
                  >
                    🗑️ Desactivar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {lavadores.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          <p>No hay lavadores registrados</p>
        </div>
      )}

      {/* Modal: misma estructura que Editar Servicio */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingLavador ? "Editar Lavador" : "Nuevo Lavador"}</h2>
              <button type="button" className="modal-close" onClick={handleCloseModal}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="service-form">
              <div className="form-group">
                <label>Nombre completo *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Cédula</label>
                  <input
                    type="text"
                    value={formData.cedula}
                    onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                    placeholder="1234567890"
                  />
                </div>
                <div className="form-group">
                  <label>Comisión (%)</label>
                  <input
                    type="number"
                    value={formData.comision_porcentaje}
                    onChange={(e) => setFormData({ ...formData, comision_porcentaje: parseFloat(e.target.value) || 0 })}
                    placeholder="30"
                    min="0"
                    max="100"
                    step="0.5"
                  />
                </div>
              </div>

              <div className="form-group">
                <small style={{ color: "#9ca3af", fontSize: "12px", display: "block", marginTop: "-8px", marginBottom: "12px" }}>
                  Porcentaje que gana el lavador por cada servicio completado
                </small>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", color: "#ffffff" }}>
                  <input
                    type="checkbox"
                    checked={formData.activo === 1}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked ? 1 : 0 })}
                    style={{ width: "18px", height: "18px", accentColor: "#EB0463" }}
                  />
                  <span>Lavador activo</span>
                </label>
              </div>

              <div className="form-actions">
                <button type="button" onClick={handleCloseModal} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingLavador ? "Actualizar" : "Crear"} Lavador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default LavadoresManager;
