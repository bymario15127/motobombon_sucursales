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

  const [confirmConfig, setConfirmConfig] = useState({
    show: false,
    title: '',
    message: '',
    subMessage: '',
    confirmText: '',
    confirmColor: '',
    confirmShadow: '',
    onConfirm: null
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

  const handleDeactivate = (lavador) => {
    setConfirmConfig({
      show: true,
      title: '👤 Desactivar Lavador',
      message: `¿Estás seguro de desactivar al lavador "${lavador.nombre}"?`,
      subMessage: 'El lavador pasará a estar inactivo y no aparecerá en la selección para nuevas citas, pero seguirá visible en el panel.',
      confirmText: 'Desactivar',
      confirmColor: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      confirmShadow: 'rgba(239, 68, 68, 0.4)',
      onConfirm: async () => {
        try {
          await updateLavador(lavador.id, {
            nombre: lavador.nombre,
            cedula: lavador.cedula,
            comision_porcentaje: lavador.comision_porcentaje,
            activo: 0
          });
          alert('✅ Lavador desactivado');
          loadLavadores();
        } catch (error) {
          alert(error.message);
        }
      }
    });
  };

  const handleActivate = (lavador) => {
    setConfirmConfig({
      show: true,
      title: '👤 Activar Lavador',
      message: `¿Estás seguro de activar al lavador "${lavador.nombre}"?`,
      subMessage: 'El lavador volverá a estar disponible para recibir servicios y citas.',
      confirmText: 'Activar',
      confirmColor: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      confirmShadow: 'rgba(16, 185, 129, 0.4)',
      onConfirm: async () => {
        try {
          await updateLavador(lavador.id, {
            nombre: lavador.nombre,
            cedula: lavador.cedula,
            comision_porcentaje: lavador.comision_porcentaje,
            activo: 1
          });
          alert('✅ Lavador activado');
          loadLavadores();
        } catch (error) {
          alert(error.message);
        }
      }
    });
  };

  const handleEliminar = (lavador) => {
    setConfirmConfig({
      show: true,
      title: '🗑️ Eliminar Lavador',
      message: `¿Estás seguro de eliminar al lavador "${lavador.nombre}"?`,
      subMessage: 'Esta acción lo quitará de la lista, pero conservará su historial de citas y nóminas anteriores de forma permanente.',
      confirmText: 'Eliminar',
      confirmColor: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      confirmShadow: 'rgba(239, 68, 68, 0.4)',
      onConfirm: async () => {
        try {
          await deleteLavador(lavador.id);
          alert('✅ Lavador eliminado exitosamente');
          loadLavadores();
        } catch (error) {
          alert(error.message);
        }
      }
    });
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                    <button
                      onClick={() => handleEliminar(lavador)}
                      title="Eliminar lavador"
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '14px',
                        padding: '6px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '8px',
                        transition: 'all 0.2s ease',
                        width: 'auto',
                        marginTop: 0,
                        boxShadow: 'none'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.6)';
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      🗑️
                    </button>
                  </div>
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
                {lavador.activo === 1 ? (
                  <button
                    onClick={() => handleDeactivate(lavador)}
                    className="btn-neon-pill"
                    style={{ flex: 1, minWidth: '120px', boxShadow: '0 0 12px rgba(239, 68, 68, 0.8)' }}
                  >
                    🗑️ Desactivar
                  </button>
                ) : (
                  <button
                    onClick={() => handleActivate(lavador)}
                    className="btn-neon-pill"
                    style={{ flex: 1, minWidth: '120px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: '2px solid #10b981', boxShadow: '0 0 12px rgba(16, 185, 129, 0.8)' }}
                  >
                    ✓ Activar
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

      {/* Modal de Confirmación Genérico y Estilizado */}
      {/* Modal de Confirmación Genérico y Estilizado */}
      {confirmConfig.show && (
        <div className="modal-overlay" onClick={() => setConfirmConfig({ ...confirmConfig, show: false })}>
          <div 
            className="modal-content" 
            style={{ 
              maxWidth: '440px', 
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.08)', 
              boxShadow: `0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px ${confirmConfig.confirmShadow}22`,
              background: '#0d0d0d',
              padding: '24px',
              overflow: 'hidden',
              position: 'relative'
            }} 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: confirmConfig.confirmText === 'Activar' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${confirmConfig.confirmText === 'Activar' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                }}>
                  {confirmConfig.confirmText === 'Activar' ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  ) : confirmConfig.confirmText === 'Desactivar' ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  )}
                </div>
                <h3 style={{ 
                  color: '#ffffff', 
                  fontSize: '18px',
                  fontWeight: '700',
                  margin: 0,
                  fontFamily: '"Inter", "Poppins", sans-serif'
                }}>
                  {confirmConfig.title.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, '').trim()}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setConfirmConfig({ ...confirmConfig, show: false })}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.4)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)';
                  e.currentTarget.style.background = 'none';
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            
            {/* Body */}
            <div style={{ marginBottom: '24px', color: '#ffffff' }}>
              <p style={{ 
                fontSize: '15px', 
                lineHeight: '1.5', 
                margin: '0 0 8px 0',
                fontWeight: '500',
                color: 'rgba(255, 255, 255, 0.95)'
              }}>
                {confirmConfig.message}
              </p>
              {confirmConfig.subMessage && (
                <p style={{ 
                  fontSize: '13px', 
                  color: 'rgba(255, 255, 255, 0.5)', 
                  lineHeight: '1.45', 
                  margin: 0 
                }}>
                  {confirmConfig.subMessage}
                </p>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                onClick={() => setConfirmConfig({ ...confirmConfig, show: false })} 
                style={{ 
                  margin: 0, 
                  padding: '10px 20px', 
                  borderRadius: '10px', 
                  width: 'auto',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontWeight: '600',
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                }}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={async () => {
                  const currentConfirm = confirmConfig.onConfirm;
                  setConfirmConfig(prev => ({ ...prev, show: false }));
                  if (currentConfirm) await currentConfirm();
                }} 
                style={{ 
                  margin: 0, 
                  padding: '10px 20px', 
                  borderRadius: '10px', 
                  width: 'auto', 
                  background: confirmConfig.confirmColor,
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: `0 4px 14px ${confirmConfig.confirmShadow}`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.filter = 'brightness(1.1)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = `0 6px 18px ${confirmConfig.confirmShadow}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `0 4px 14px ${confirmConfig.confirmShadow}`;
                }}
              >
                {confirmConfig.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default LavadoresManager;
