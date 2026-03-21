// src/components/Admin/PanelAdmin.jsx
import { useEffect, useState } from "react";
import { getCitas, deleteCita, updateCita } from "../../services/citasService";
import { getLavadoresActivos } from "../../services/lavadoresService";

export default function PanelAdmin() {
  const [citas, setCitas] = useState([]);
  const [lavadores, setLavadores] = useState([]);
  const [userRole, setUserRole] = useState('admin');
  const [busqueda, setBusqueda] = useState('');
  const [editingPayment, setEditingPayment] = useState(null);
  const [newPaymentMethod, setNewPaymentMethod] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  useEffect(() => {
    const role = localStorage.getItem('motobombon_user_role') || 'admin';
    setUserRole(role);
  }, []);

  const formatearFecha = (fechaStr) => {
    const [year, month, day] = fechaStr.split('-');
    const fecha = new Date(year, month - 1, day);
    return fecha.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const capitalizar = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  // Hora de registro: usa c.hora si existe (hora local del cliente).
  // Si no, extrae de created_at: la BD guarda en UTC, convertimos a Colombia (UTC-5).
  const getHoraRegistro = (c) => {
    if (c.hora && c.hora.trim()) return c.hora.trim();
    if (c.created_at) {
      const str = String(c.created_at);
      const d = new Date(str.includes('T') ? str : str.replace(' ', 'T') + 'Z');
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit', hour12: false });
      }
    }
    return null;
  };

  const load = async () => {
    const data = await getCitas();
    setCitas(data);
  };

  const loadLavadores = async () => {
    try {
      const data = await getLavadoresActivos();
      setLavadores(data);
    } catch (error) {
      console.error('Error al cargar lavadores:', error);
    }
  };

  useEffect(() => {
    load();
    loadLavadores();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Eliminar esta cita?")) return;
    await deleteCita(id);
    load();
  };

  const changeEstado = async (id, nuevoEstado) => {
    if (nuevoEstado === "finalizada") {
      const cita = citas.find(c => c.id === id);
      if (!cita?.lavador_id) {
        alert("⚠️ Debes asignar un lavador antes de finalizar la cita");
        return;
      }
    }
    await updateCita(id, { estado: nuevoEstado });
    load();
  };

  const updateCitaLavador = async (id, lavadorId) => {
    try {
      await updateCita(id, { lavador_id: lavadorId });
      load();
    } catch (error) {
      console.error('Error al asignar lavador:', error);
      alert('Error al asignar el lavador');
    }
  };

  const handleEditPaymentMethod = (citaId, currentMethod) => {
    setEditingPayment(citaId);
    setNewPaymentMethod(currentMethod || '');
  };

  const handleSavePaymentMethod = async (citaId) => {
    if (!newPaymentMethod) {
      alert('Por favor selecciona un método de pago');
      return;
    }
    try {
      await updateCita(citaId, { metodo_pago: newPaymentMethod });
      load();
      setEditingPayment(null);
      alert('✅ Método de pago actualizado correctamente');
    } catch (error) {
      console.error('Error al actualizar método de pago:', error);
      alert('❌ Error al actualizar el método de pago');
    }
  };

  const handleCancelPaymentEdit = () => {
    setEditingPayment(null);
    setNewPaymentMethod('');
  };

  // Orden de llegada por fecha (1º, 2º, 3º...) según id de registro
  const ordenByCitaId = {};
  const porFecha = {};
  citas.forEach(c => {
    const f = c.fecha || "";
    if (!porFecha[f]) porFecha[f] = [];
    porFecha[f].push(c);
  });
  Object.values(porFecha).forEach(lista => {
    [...lista].sort((a, b) => (a.id || 0) - (b.id || 0)).forEach((c, i) => {
      ordenByCitaId[c.id] = i + 1;
    });
  });

  const citasFiltradas = citas.filter(cita => {
    const busquedaLower = busqueda.toLowerCase();

    const coincideBusqueda =
      !busquedaLower ||
      (cita.cliente && cita.cliente.toLowerCase().includes(busquedaLower)) ||
      (cita.placa && cita.placa.toLowerCase().includes(busquedaLower));

    const estado = (cita.estado || 'pendiente').toLowerCase();

    const coincideEstado =
      filtroEstado === 'todos' ||
      estado === filtroEstado;

    return coincideBusqueda && coincideEstado;
  });

  return (
    <div className="container">
      <div className="admin-header" style={{ justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h2 className="admin-section-title">Panel Admin — MOTOBOMBON</h2>
          <p className="admin-text-muted" style={{ marginTop: 4 }}>
            Total citas: <span className="admin-card-label" style={{ color: '#EB0463' }}>{citasFiltradas.length}</span>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'todos', label: 'Todas' },
            { id: 'pendiente', label: 'Pendiente' },
            { id: 'confirmada', label: 'Confirmar' },
            { id: 'en curso', label: 'En curso' },
            { id: 'finalizada', label: 'Finalizada' },
          ].map((filtro) => (
            <button
              key={filtro.id}
              onClick={() => setFiltroEstado(filtro.id)}
              style={{
                padding: '8px 14px',
                borderRadius: '999px',
                border: filtroEstado === filtro.id ? '2px solid #EB0463' : '1px solid rgba(255,255,255,0.2)',
                background: filtroEstado === filtro.id ? 'rgba(235,4,99,0.15)' : 'transparent',
                color: '#fff',
                fontSize: '0.8rem',
                fontWeight: filtroEstado === filtro.id ? '700' : '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              {filtro.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute',
            left: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '18px'
          }}>🔍</span>
          <input
            type="text"
            placeholder="Buscar por nombre o placa..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              width: '100%',
              padding: '16px 16px 16px 44px',
              borderRadius: '12px',
              border: '2px solid #ff1744',
              fontSize: '18px',
              fontWeight: '700',
              background: '#1f1f1f',
              color: '#ffffff',
              outline: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              caretColor: '#ffffff',
              minHeight: '52px',
              WebkitTextFillColor: '#ffffff'
            }}
          />
        </div>
        {busqueda && (
          <button
            onClick={() => setBusqueda('')}
            style={{
              marginTop: '12px',
              padding: '12px 16px',
              width: '100%',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.background = '#dc2626'}
            onMouseLeave={(e) => e.target.style.background = '#ef4444'}
          >
            ✕ Limpiar
          </button>
        )}
      </div>

      <div className="citas-grid">
        {citasFiltradas.length === 0 ? (
          <div className="no-citas">
            <p className="text-gray-500 text-lg">
              {busqueda ? `📭 No se encontraron citas para "${busqueda}"` : '📅 No hay citas registradas'}
            </p>
          </div>
        ) : (
          [...citasFiltradas].reverse().map(c => (
            <div key={c.id} className="cita-card-admin">
              <div className="cita-header">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">{c.cliente}</h3>
                  <p className="text-lg text-[#a65495] font-medium">{c.servicio}</p>
                </div>
                <span className={`estado-badge ${c.estado || 'pendiente'}`}>
                  {c.estado || "pendiente"}
                </span>
              </div>

              <div className="cita-details">
                <div>
                  <p className="detail-item">📅 <strong>Fecha:</strong> {capitalizar(formatearFecha(c.fecha))}</p>
                  <p className="detail-item" style={{ color: '#e5e7eb' }}>🕐 <strong>Hora:</strong> {getHoraRegistro(c) || `— (Orden #${ordenByCitaId[c.id] || '?'})`}</p>
                </div>
                <div>
                  <p className="detail-item">📞 <strong>Teléfono:</strong> {c.telefono || 'No proporcionado'}</p>
                  {c.email && (
                    <p className="detail-item">📧 <strong>Email:</strong> {c.email}</p>
                  )}
                  {c.comentarios && (
                    <p className="detail-item">💬 <strong>Comentarios:</strong> {c.comentarios}</p>
                  )}
                </div>
                {(c.placa || c.marca || c.modelo || c.cilindraje) && (
                  <div style={{gridColumn: '1 / -1', borderTop: '1px solid #e5e7eb', paddingTop: '12px', marginTop: '8px'}}>
                    <p style={{fontWeight: 'bold', marginBottom: '8px'}}>🏍️ Datos de la Moto:</p>
                    {c.placa && <p className="detail-item">🆔 <strong>Placa:</strong> {c.placa}</p>}
                    {c.marca && <p className="detail-item">🔧 <strong>Marca:</strong> {c.marca}</p>}
                    {c.modelo && <p className="detail-item">📋 <strong>Modelo:</strong> {c.modelo}</p>}
                    {c.cilindraje && <p className="detail-item">⚙️ <strong>Cilindraje:</strong> {c.cilindraje} cc</p>}
                  </div>
                )}
                {c.metodo_pago && (
                  <div style={{gridColumn: '1 / -1', borderTop: '1px dashed #e5e7eb', paddingTop: '12px', marginTop: '8px'}}>
                    <p className="detail-item">💳 <strong>Método de pago:</strong> {editingPayment === c.id ? 'Editando...' : (c.metodo_pago === 'codigo_qr' ? 'Código QR' : c.metodo_pago === 'efectivo' ? 'Efectivo' : c.metodo_pago === 'tarjeta' ? 'Tarjeta' : c.metodo_pago)}</p>
                    {editingPayment !== c.id && (
                      <button
                        onClick={() => handleEditPaymentMethod(c.id, c.metodo_pago)}
                        style={{
                          padding: '6px 12px',
                          background: '#f59e0b',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          transition: 'all 0.2s ease',
                          marginTop: '8px',
                          display: 'inline-block'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#d97706'}
                        onMouseLeave={(e) => e.target.style.background = '#f59e0b'}
                      >
                        ✏️ Cambiar
                      </button>
                    )}
                    {editingPayment === c.id && (
                      <div style={{padding: '12px', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)', marginTop: '8px'}}>
                        <p style={{fontSize: '12px', fontWeight: 'bold', marginBottom: '10px', color: '#1f2937'}}>Selecciona el método de pago:</p>
                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px', marginBottom: '12px'}}>
                          {[
                            { value: 'codigo_qr', label: 'Código QR', icon: '📱', color: '#3b82f6' },
                            { value: 'efectivo', label: 'Efectivo', icon: '💵', color: '#10b981' },
                            { value: 'tarjeta', label: 'Tarjeta', icon: '💳', color: '#8b5cf6' }
                          ].map(method => (
                            <button
                              key={method.value}
                              onClick={() => setNewPaymentMethod(method.value)}
                              style={{
                                padding: '12px 16px',
                                background: newPaymentMethod === method.value 
                                  ? `${method.color}20` 
                                  : '#f3f4f6',
                                border: newPaymentMethod === method.value 
                                  ? `2px solid ${method.color}` 
                                  : '1px solid #d1d5db',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: '600',
                                color: newPaymentMethod === method.value ? method.color : '#6b7280',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.transform = 'scale(1.05)';
                                e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.transform = 'scale(1)';
                                e.target.style.boxShadow = 'none';
                              }}
                            >
                              <span style={{fontSize: '24px'}}>{method.icon}</span>
                              <span>{method.label}</span>
                            </button>
                          ))}
                        </div>
                        <div style={{display: 'flex', gap: '8px'}}>
                          <button
                            onClick={() => handleSavePaymentMethod(c.id)}
                            style={{
                              flex: 1,
                              padding: '10px 16px',
                              background: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: newPaymentMethod ? 'pointer' : 'not-allowed',
                              fontSize: '13px',
                              fontWeight: 'bold',
                              transition: 'all 0.2s ease',
                              opacity: newPaymentMethod ? 1 : 0.5
                            }}
                            disabled={!newPaymentMethod}
                            onMouseEnter={(e) => {
                              if (newPaymentMethod) {
                                e.target.style.background = '#059669';
                                e.target.style.transform = 'scale(1.02)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = '#10b981';
                              e.target.style.transform = 'scale(1)';
                            }}
                          >
                            ✓ Guardar
                          </button>
                          <button
                            onClick={handleCancelPaymentEdit}
                            style={{
                              flex: 1,
                              padding: '10px 16px',
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: 'bold',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = '#dc2626';
                              e.target.style.transform = 'scale(1.02)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = '#ef4444';
                              e.target.style.transform = 'scale(1)';
                            }}
                          >
                            ✕ Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {c.lavador_nombre && (
                  <div style={{gridColumn: '1 / -1', borderTop: '1px solid #e5e7eb', paddingTop: '12px', marginTop: '8px'}}>
                    <p className="detail-item">👤 <strong>Lavador asignado:</strong> {c.lavador_nombre}</p>
                  </div>
                )}
                <div style={{gridColumn: '1 / -1', borderTop: '1px solid #e5e7eb', paddingTop: '12px', marginTop: '8px'}}>
                  <label style={{display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151'}}>
                    👤 Asignar lavador: {!c.lavador_id && <span style={{color: '#EF4444', fontSize: '12px'}}>(Requerido para finalizar)</span>}
                  </label>
                  <select
                    value={c.lavador_id || ''}
                    onChange={(e) => updateCitaLavador(c.id, e.target.value || null)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: !c.lavador_id ? '2px solid #EF4444' : '1px solid rgba(102, 126, 234, 0.3)',
                      fontSize: '14px',
                      background: !c.lavador_id
                        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)'
                        : 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                      color: '#1f2937',
                      cursor: 'pointer',
                      fontWeight: '500',
                      outline: 'none',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <option value="">⚠️ Sin asignar</option>
                    {lavadores.map(lav => (
                      <option key={lav.id} value={lav.id}>
                        {lav.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="cita-actions">
                <button
                  onClick={() => changeEstado(c.id, "confirmada")}
                  className="btn-action confirm"
                >
                  ✅ Confirmar
                </button>
                <button
                  onClick={() => changeEstado(c.id, "en curso")}
                  className="btn-action progress"
                >
                  🔄 En curso
                </button>
                <button
                  onClick={() => changeEstado(c.id, "finalizada")}
                  className="btn-action complete"
                  disabled={!c.lavador_id}
                  style={{
                    opacity: !c.lavador_id ? 0.5 : 1,
                    cursor: !c.lavador_id ? 'not-allowed' : 'pointer'
                  }}
                  title={!c.lavador_id ? 'Debes asignar un lavador primero' : 'Finalizar cita'}
                >
                  ✨ Finalizar
                </button>
                {userRole === 'admin' && (
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="btn-action delete"
                  >
                    🗑️ Eliminar
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
