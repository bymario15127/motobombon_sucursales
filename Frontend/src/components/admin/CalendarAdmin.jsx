// src/components/admin/CalendarAdmin.jsx
import { useState, useEffect } from 'react';
import { format, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { getCitasRango, updateCita, deleteCita } from '../../services/citasService';

const CalendarAdmin = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dayAppointments, setDayAppointments] = useState([]);

  // Solo citas del mes visible (evita descargar todo el historial)
  useEffect(() => {
    loadCitas();
  }, [currentMonth]);

  // Filtrar citas del día seleccionado (comparación por string para evitar problemas de zona horaria)
  useEffect(() => {
    if (citas.length > 0) {
      const selectedKey = format(selectedDate, 'yyyy-MM-dd');
      const filtered = citas.filter(cita => cita.fecha === selectedKey);
      setDayAppointments(filtered);
    } else {
      setDayAppointments([]);
    }
  }, [selectedDate, citas]);

  const loadCitas = async () => {
    try {
      setLoading(true);
      const desde = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const hasta = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      const data = await getCitasRango(desde, hasta);
      setCitas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar citas:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCitaStatus = async (id, newStatus) => {
    try {
      // Si se está finalizando, verificar que tenga lavador asignado
      if (newStatus === 'finalizada') {
        const cita = citas.find(c => c.id === id);
        if (!cita.lavador_id) {
          alert("⚠️ Debes asignar un lavador antes de finalizar la cita");
          return;
        }
      }
      await updateCita(id, { estado: newStatus });
      await loadCitas(); // Recargar citas
    } catch (error) {
      console.error('Error al actualizar cita:', error);
      alert('Error al actualizar el estado de la cita');
    }
  };

  const handleDeleteCita = async (id, cliente) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar la cita de ${cliente}?`)) {
      return;
    }
    try {
      await deleteCita(id);
      await loadCitas(); // Recargar citas
      alert('✅ Cita eliminada correctamente');
    } catch (error) {
      console.error('Error al eliminar cita:', error);
      alert('❌ Error al eliminar la cita');
    }
  };

  const getStatusColor = (estado) => {
    switch (estado) {
      case 'pendiente': return 'pendiente';
      case 'confirmada': return 'confirmada';
      case 'en curso': return 'en-curso';
      case 'finalizada': return 'finalizada';
      case 'cancelada': return 'cancelada';
      default: return '';
    }
  };

  const formatTime = (hora) => hora;
  const getHoraRegistro = (cita) => {
    if (cita.hora && cita.hora.trim()) return cita.hora.trim();
    if (cita.created_at) {
      const str = String(cita.created_at);
      const d = new Date(str.includes('T') ? str : str.replace(' ', 'T') + 'Z');
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit', hour12: false });
      }
    }
    return null;
  };

  // Helper para obtener la llave de fecha en formato YYYY-MM-DD
  const getDateKey = (date) => format(date, 'yyyy-MM-dd');

  // Generar días del mes con celdas vacías al inicio para alinear con el día de la semana.
  // Usamos año/mes explícitos para evitar desfases por zona horaria (1º del mes a medianoche local).
  const getCalendarSlots = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const days = eachDayOfInterval({ start: first, end: last });
    // getDay(): 0 = Domingo, 1 = Lunes, ... 6 = Sábado (igual que header Dom, Lun, Mar, Mié, Jue, Vie, Sáb)
    const firstDayOfWeek = first.getDay();
    const emptySlots = Array(firstDayOfWeek).fill(null);
    return [...emptySlots, ...days];
  };

  const hasAppointments = (date) => {
    const dateKey = getDateKey(date);
    return citas.some(cita => cita.fecha === dateKey);
  };

  const handlePreviousMonth = () => {
    setCurrentMonth((prev) => {
      const next = subMonths(prev, 1);
      setSelectedDate(startOfMonth(next));
      return next;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => {
      const next = addMonths(prev, 1);
      setSelectedDate(startOfMonth(next));
      return next;
    });
  };

  const handleDayClick = (day) => {
    setSelectedDate(day);
  };

  return (
    <div className="calendar-page">
      <h2 className="page-title">📅 Calendario de Citas</h2>

      <div className="calendar-grid">
        {/* Calendario */}
        <div className="card">
          <h3 className="card-title">Seleccionar Fecha</h3>
          <div className="custom-calendar">
            {/* Header con mes y año */}
            <div className="calendar-header">
              <button onClick={handlePreviousMonth} className="calendar-nav-btn">◀</button>
              <h4 className="calendar-month">
                {format(currentMonth, 'MMMM yyyy', { locale: es })}
              </h4>
              <button onClick={handleNextMonth} className="calendar-nav-btn">▶</button>
            </div>

            {/* Días de la semana */}
            <div className="calendar-weekdays">
              <div>Dom</div>
              <div>Lun</div>
              <div>Mar</div>
              <div>Mié</div>
              <div>Jue</div>
              <div>Vie</div>
              <div>Sáb</div>
            </div>

            {/* Grid de días (con celdas vacías para alinear día 1 con su día de la semana) */}
            <div className="calendar-days">
              {getCalendarSlots().map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="calendar-day calendar-day-empty" aria-hidden />;
                }
                const isSelected = isSameDay(day, selectedDate);
                const hasCitas = hasAppointments(day);
                return (
                  <button
                    key={idx}
                    onClick={() => handleDayClick(day)}
                    className={`calendar-day ${isSelected ? 'selected' : ''} ${hasCitas ? 'has-citas' : ''}`}
                  >
                    {format(day, 'd')}
                    {hasCitas && <span className="cita-dot"></span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Citas del día seleccionado */}
        <div className="card">
          <h3 className="card-title">
            Citas para {format(selectedDate, 'dd/MM/yyyy', { locale: es })}
          </h3>

          {loading ? (
            <div className="empty-state">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#a65495] mx-auto"></div>
              <p className="mt-2">Cargando citas...</p>
            </div>
          ) : dayAppointments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🗓️</div>
              <h3>No hay citas programadas para este día</h3>
              <p>Selecciona otra fecha en el calendario</p>
            </div>
          ) : (
            <div className="apt-list max-h-96 overflow-y-auto">
              {[...dayAppointments].sort((a, b) => (a.id || 0) - (b.id || 0)).map((cita, idx) => (
                <div key={cita.id} className="apt-card">
                  <div className="apt-header">
                    <div>
                      <h4 className="apt-title">{cita.cliente}</h4>
                      <p className="apt-line">📞 {cita.telefono}</p>
                      {cita.email && <p className="apt-line">📧 {cita.email}</p>}
                      <p className="apt-line">🕐 {getHoraRegistro(cita) ? formatTime(getHoraRegistro(cita)) : `— (Orden #${idx + 1})`}</p>
                      <p className="apt-line">🏍️ {cita.servicio}</p>
                    </div>
                    <span className={`badge ${getStatusColor(cita.estado)}`}>
                      {cita.estado}
                    </span>
                  </div>

                  {cita.comentarios && (
                    <div className="apt-notes">
                      <strong>Comentarios:</strong> {cita.comentarios}
                    </div>
                  )}

                  {(cita.placa || cita.marca || cita.modelo || cita.cilindraje) && (
                    <div style={{gridColumn: '1 / -1', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px', marginTop: '8px'}}>
                      <p style={{fontWeight: '600', marginBottom: '8px', color: 'rgba(255,255,255,0.6)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Datos de la Moto</p>
                      <div style={{marginTop: '4px', fontSize: '13px', color: 'rgba(255,255,255,0.7)', display: 'flex', flexDirection: 'column', gap: 2}}>
                        {cita.placa && <div>Placa: <strong style={{color:'#fff'}}>{cita.placa}</strong></div>}
                        {cita.marca && <div>Marca: <strong style={{color:'#fff'}}>{cita.marca}</strong></div>}
                        {cita.modelo && <div>Modelo: <strong style={{color:'#fff'}}>{cita.modelo}</strong></div>}
                        {cita.cilindraje && <div>Cilindraje: <strong style={{color:'#fff'}}>{cita.cilindraje} cc</strong></div>}
                      </div>
                    </div>
                  )}
                  {cita.metodo_pago && (
                    <div style={{gridColumn: '1 / -1', borderTop: '1px dashed rgba(255,255,255,0.06)', paddingTop: '8px', marginTop: '8px'}}>
                      <span style={{fontSize:12.5, color:'rgba(255,255,255,0.5)'}}>
                        Pago: <strong style={{color:'rgba(255,255,255,0.85)'}}>{cita.metodo_pago === 'codigo_qr' ? 'Código QR' : cita.metodo_pago === 'efectivo' ? 'Efectivo' : cita.metodo_pago}</strong>
                      </span>
                    </div>
                  )}

                  {cita.lavador_nombre && (
                    <div className="apt-notes" style={{borderTop: '1px solid #e5e7eb', paddingTop: '8px', marginTop: '8px'}}>
                      <strong>👤 Lavador asignado:</strong> {cita.lavador_nombre}
                    </div>
                  )}
                  {!cita.lavador_nombre && cita.estado !== 'cancelada' && (
                    <div className="apt-notes" style={{borderTop: '1px solid #EF4444', paddingTop: '8px', marginTop: '8px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '4px', padding: '8px'}}>
                      <strong style={{color: '#EF4444'}}>⚠️ Sin lavador asignado</strong>
                      <div style={{fontSize: '12px', color: '#991B1B', marginTop: '4px'}}>
                        Asigna un lavador desde el Panel Admin para poder finalizar esta cita
                      </div>
                    </div>
                  )}

                  {/* Botones de acción */}
                  <div style={{display: 'flex', gap: '8px', marginTop: '14px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', flexWrap: 'wrap'}}>
                    {cita.estado === 'pendiente' && (
                      <button onClick={() => updateCitaStatus(cita.id, 'confirmada')}
                        style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 14px', borderRadius:9, border:'1px solid rgba(59,130,246,0.35)', background:'rgba(59,130,246,0.1)', color:'#3b82f6', fontSize:12.5, fontWeight:600, cursor:'pointer', fontFamily:'Inter,sans-serif', width:'auto', margin:0, transition:'background 0.15s' }}
                        onMouseEnter={e=>e.currentTarget.style.background='rgba(59,130,246,0.18)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(59,130,246,0.1)'}>
                        ✓ Confirmar
                      </button>
                    )}
                    {cita.estado === 'confirmada' && (
                      <button onClick={() => updateCitaStatus(cita.id, 'en curso')}
                        style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 14px', borderRadius:9, border:'1px solid rgba(139,92,246,0.35)', background:'rgba(139,92,246,0.1)', color:'#8b5cf6', fontSize:12.5, fontWeight:600, cursor:'pointer', fontFamily:'Inter,sans-serif', width:'auto', margin:0, transition:'background 0.15s' }}
                        onMouseEnter={e=>e.currentTarget.style.background='rgba(139,92,246,0.18)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(139,92,246,0.1)'}>
                        ⚡ En curso
                      </button>
                    )}
                    {cita.estado === 'en curso' && (
                      <button onClick={() => updateCitaStatus(cita.id, 'finalizada')}
                        style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 14px', borderRadius:9, border:'1px solid rgba(16,185,129,0.35)', background:'rgba(16,185,129,0.1)', color:'#10b981', fontSize:12.5, fontWeight:600, cursor:'pointer', fontFamily:'Inter,sans-serif', width:'auto', margin:0, transition:'background 0.15s' }}
                        onMouseEnter={e=>e.currentTarget.style.background='rgba(16,185,129,0.18)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(16,185,129,0.1)'}>
                        ✔ Finalizar
                      </button>
                    )}
                    {cita.estado !== 'cancelada' && (
                      <button onClick={() => updateCitaStatus(cita.id, 'cancelada')}
                        style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 14px', borderRadius:9, border:'1px solid rgba(245,158,11,0.35)', background:'rgba(245,158,11,0.08)', color:'#f59e0b', fontSize:12.5, fontWeight:600, cursor:'pointer', fontFamily:'Inter,sans-serif', width:'auto', margin:0, transition:'background 0.15s' }}
                        onMouseEnter={e=>e.currentTarget.style.background='rgba(245,158,11,0.18)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(245,158,11,0.08)'}>
                        ✕ Cancelar
                      </button>
                    )}
                    <button onClick={() => handleDeleteCita(cita.id, cita.cliente)}
                      style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 14px', borderRadius:9, border:'1px solid rgba(239,68,68,0.25)', background:'rgba(239,68,68,0.07)', color:'#ef4444', fontSize:12.5, fontWeight:600, cursor:'pointer', fontFamily:'Inter,sans-serif', width:'auto', margin:'0 0 0 auto', transition:'background 0.15s' }}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(239,68,68,0.15)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(239,68,68,0.07)'}>
                      🗑 Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Resumen del día */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px,1fr))', gap:12, marginTop: 20 }}>
        {[
          { label: 'Pendientes',  count: dayAppointments.filter(c => c.estado === 'pendiente').length,  color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)' },
          { label: 'Confirmadas', count: dayAppointments.filter(c => c.estado === 'confirmada').length, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.25)' },
          { label: 'Finalizadas', count: dayAppointments.filter(c => c.estado === 'finalizada').length, color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' },
          { label: 'Canceladas',  count: dayAppointments.filter(c => c.estado === 'cancelada').length,  color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.25)' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, padding: '14px 18px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: s.color, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4, fontFamily:'Inter,sans-serif' }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', fontFamily:'Inter,sans-serif', lineHeight:1 }}>{s.count}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarAdmin;
