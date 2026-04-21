// src/components/Admin/PanelAdmin.jsx
import { useEffect, useState, useRef } from "react";
import ReactDOM from "react-dom";
import { getCitas, deleteCita, updateCita } from "../../services/citasService";
import { getLavadoresActivos } from "../../services/lavadoresService";

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const Ic = ({ d, size = 14, sw = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d={d} />
  </svg>
);
const IcCalendar = () => <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IcClock  = () => <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IcPhone  = () => <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.03 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>;
const IcMail   = () => <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const IcMoto   = () => <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="17" r="3"/><circle cx="19" cy="17" r="3"/><path d="M14 17H8M6 8h12l2 9"/><path d="M14 8l-2-3H9"/></svg>;
const IcCard   = () => <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
const IcUser   = () => <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IcSearch = () => <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IcCheck  = () => <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcZap    = () => <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
const IcStar   = () => <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const IcTrash  = () => <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>;

// ── Custom Lavador Dropdown ───────────────────────────────────────────────────
function LavadorDropdown({ citaId, currentLavadorId, lavadores, onAssign, hasError }) {
  const [open, setOpen] = useState(false);
  const [rect, setRect]  = useState(null);
  const triggerRef = useRef(null);
  const panelRef   = useRef(null);

  const selected = lavadores.find(l => String(l.id) === String(currentLavadorId));
  const initials  = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';

  const handleOpen = () => {
    if (!open && triggerRef.current) {
      setRect(triggerRef.current.getBoundingClientRect());
    }
    setOpen(o => !o);
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        panelRef.current   && !panelRef.current.contains(e.target)
      ) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Reposition on scroll
  useEffect(() => {
    if (!open) return;
    const update = () => { if (triggerRef.current) setRect(triggerRef.current.getBoundingClientRect()); };
    window.addEventListener('scroll', update, true);
    return () => window.removeEventListener('scroll', update, true);
  }, [open]);

  const DropdownPanel = rect && (() => {
    // Flip upward if not enough space below
    const spaceBelow = window.innerHeight - rect.bottom - 10;
    const maxH = Math.min(280, spaceBelow > 150 ? spaceBelow : rect.top - 10);
    const top  = spaceBelow > 150 ? rect.bottom + 6 : rect.top - Math.min(280, rect.top - 10) - 6;

    return (
      <div ref={panelRef}
        onScroll={e => e.stopPropagation()}
        onWheel={e => e.stopPropagation()}
        style={{
        position: 'fixed',
        top,
        left: rect.left,
        width: rect.width,
        maxHeight: maxH,
        zIndex: 9999,
        background: '#141414',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 12,
        overflowY: 'auto',
        overflowX: 'hidden',
        boxShadow: '0 16px 40px rgba(0,0,0,0.7)',
        animation: 'fadeIn 0.15s ease',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(235,4,99,0.4) transparent',
      }}>
      {/* Sin asignar */}
      <button
        onClick={() => { onAssign(citaId, null); setOpen(false); }}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px',
          background: !currentLavadorId ? 'rgba(239,68,68,0.1)' : 'transparent',
          border: 0, color: !currentLavadorId ? '#ef4444' : 'rgba(255,255,255,0.45)',
          fontSize: 13, cursor: 'pointer', fontFamily: 'Inter,sans-serif',
          fontWeight: !currentLavadorId ? 700 : 400, textAlign: 'left',
          margin: 0, transition: 'background 0.15s',
        }}
        onMouseEnter={e => { if (currentLavadorId) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
        onMouseLeave={e => { if (currentLavadorId) e.currentTarget.style.background = 'transparent'; }}
      >
        <span style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>⚠️</span>
        Sin asignar
      </button>

      {lavadores.length > 0 && <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '0 14px' }} />}

      {lavadores.map(lav => {
        const isActive = String(lav.id) === String(currentLavadorId);
        return (
          <button key={lav.id}
            onClick={() => { onAssign(citaId, lav.id); setOpen(false); }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px',
              background: isActive ? 'rgba(235,4,99,0.1)' : 'transparent',
              border: 0, color: isActive ? '#EB0463' : 'rgba(255,255,255,0.8)',
              fontSize: 13, cursor: 'pointer', fontFamily: 'Inter,sans-serif',
              fontWeight: isActive ? 700 : 400, textAlign: 'left',
              margin: 0, transition: 'background 0.15s',
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
          >
            <span style={{
              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
              background: isActive ? 'linear-gradient(135deg,#EB0463,#a65495)' : 'rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: '#fff',
            }}>{initials(lav.nombre)}</span>
            {lav.nombre}
            {isActive && (
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
                style={{ marginLeft: 'auto', color: '#EB0463', flexShrink: 0 }}>
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
          </button>
        );
      })}
      </div>
    );
  })();

  return (
    <div style={{ position: 'relative' }}>
      {/* Trigger button */}
      <button ref={triggerRef} onClick={handleOpen}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 12px', borderRadius: 10,
          border: `1px solid ${hasError ? 'rgba(239,68,68,0.4)' : open ? 'rgba(235,4,99,0.45)' : 'rgba(255,255,255,0.1)'}`,
          background: hasError ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.03)',
          color: '#fff', cursor: 'pointer', fontFamily: 'Inter,sans-serif',
          fontSize: 13, fontWeight: 500, textAlign: 'left',
          transition: 'border 0.2s', margin: 0, boxShadow: 'none',
        }}>
        {selected ? (
          <>
            <span style={{
              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
              background: 'linear-gradient(135deg, #EB0463, #a65495)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: '#fff',
            }}>{initials(selected.nombre)}</span>
            <span style={{ flex: 1, color: '#fff' }}>{selected.nombre}</span>
          </>
        ) : (
          <>
            <span style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>⚠️</span>
            <span style={{ flex: 1, color: 'rgba(255,255,255,0.38)' }}>Sin asignar</span>
          </>
        )}
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, color: 'rgba(255,255,255,0.3)', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* Portal: render outside card to escape overflow:hidden */}
      {open && ReactDOM.createPortal(DropdownPanel, document.body)}
    </div>
  );
}


// ── Estado Badge config ────────────────────────────────────────────────────────
const ESTADO_CONFIG = {
  pendiente:  { label: 'Pendiente',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)'  },
  confirmada: { label: 'Confirmada', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.3)'  },
  'en curso': { label: 'En curso',   color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)',  border: 'rgba(139,92,246,0.3)'  },
  finalizada: { label: 'Finalizada', color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' },
  cancelada:  { label: 'Cancelada',  color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)'  },
};

// ── Small helpers ──────────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'rgba(255,255,255,0.65)', fontFamily: 'Inter,sans-serif' }}>
      <span style={{ color: 'rgba(255,255,255,0.35)', display: 'flex' }}><Icon /></span>
      <span style={{ color: 'rgba(255,255,255,0.38)', fontWeight: 500 }}>{label}:</span>
      <span style={{ color: 'rgba(255,255,255,0.8)' }}>{value}</span>
    </div>
  );
}

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
    return fecha.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };
  const capitalizar = (str) => str.charAt(0).toUpperCase() + str.slice(1);

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

  const formatPago = (v) => v === 'codigo_qr' ? 'Código QR' : v === 'efectivo' ? 'Efectivo' : v === 'tarjeta' ? 'Tarjeta' : v;

  const load = async () => {
    const data = await getCitas();
    setCitas(data);
  };
  const loadLavadores = async () => {
    try { const data = await getLavadoresActivos(); setLavadores(data); } catch (e) { console.error(e); }
  };

  useEffect(() => { load(); loadLavadores(); }, []);

  const handleDelete    = async (id) => { if (!confirm("¿Eliminar esta cita?")) return; await deleteCita(id); load(); };
  const changeEstado    = async (id, estado) => {
    if (estado === "finalizada") {
      const cita = citas.find(c => c.id === id);
      if (!cita?.lavador_id) { alert("⚠️ Asigna un lavador antes de finalizar"); return; }
    }
    await updateCita(id, { estado }); load();
  };
  const updateCitaLavador    = async (id, lavadorId) => { try { await updateCita(id, { lavador_id: lavadorId }); load(); } catch (e) { alert('Error al asignar lavador'); } };
  const handleEditPaymentMethod  = (citaId, current) => { setEditingPayment(citaId); setNewPaymentMethod(current || ''); };
  const handleSavePaymentMethod  = async (citaId) => {
    if (!newPaymentMethod) { alert('Selecciona un método'); return; }
    try { await updateCita(citaId, { metodo_pago: newPaymentMethod }); load(); setEditingPayment(null); }
    catch (e) { alert('Error al actualizar'); }
  };
  const handleCancelPaymentEdit = () => { setEditingPayment(null); setNewPaymentMethod(''); };

  // Orden de llegada por fecha
  const ordenByCitaId = {};
  const porFecha = {};
  citas.forEach(c => { const f = c.fecha || ''; if (!porFecha[f]) porFecha[f] = []; porFecha[f].push(c); });
  Object.values(porFecha).forEach(lista => {
    [...lista].sort((a, b) => (a.id||0)-(b.id||0)).forEach((c, i) => { ordenByCitaId[c.id] = i + 1; });
  });

  const citasFiltradas = citas.filter(cita => {
    const bl = busqueda.toLowerCase();
    const coincideBusqueda = !bl || (cita.cliente && cita.cliente.toLowerCase().includes(bl)) || (cita.placa && cita.placa.toLowerCase().includes(bl));
    const estado = (cita.estado || 'pendiente').toLowerCase();
    const coincideEstado = filtroEstado === 'todos' || estado === filtroEstado;
    return coincideBusqueda && coincideEstado;
  });

  // Conteo por estado para badges del filtro
  const conteo = { todos: citas.length };
  citas.forEach(c => {
    const e = (c.estado || 'pendiente').toLowerCase();
    conteo[e] = (conteo[e] || 0) + 1;
  });

  const FILTROS = [
    { id: 'todos',      label: 'Todas' },
    { id: 'pendiente',  label: 'Pendiente' },
    { id: 'confirmada', label: 'Confirmar' },
    { id: 'en curso',   label: 'En curso' },
    { id: 'finalizada', label: 'Finalizada' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Top bar ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#fff', fontFamily: 'Inter,sans-serif', letterSpacing: '-0.02em' }}>
            Gestión de Citas
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.38)', fontFamily: 'Inter,sans-serif' }}>
            {citasFiltradas.length} cita{citasFiltradas.length !== 1 ? 's' : ''} · hoy
          </p>
        </div>

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FILTROS.map(f => {
            const active = filtroEstado === f.id;
            const cfg = ESTADO_CONFIG[f.id] || { color: '#EB0463', bg: 'rgba(235,4,99,0.1)', border: 'rgba(235,4,99,0.3)' };
            return (
              <button key={f.id} onClick={() => setFiltroEstado(f.id)}
                style={{
                  padding: '7px 14px', borderRadius: 999,
                  border: `1px solid ${active ? cfg.border : 'rgba(255,255,255,0.1)'}`,
                  background: active ? cfg.bg : 'transparent',
                  color: active ? cfg.color : 'rgba(255,255,255,0.5)',
                  fontSize: 12, fontWeight: active ? 700 : 500,
                  cursor: 'pointer', fontFamily: 'Inter,sans-serif',
                  transition: 'all 0.18s', width: 'auto', margin: 0, letterSpacing: '0.03em',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                {f.label}
                {conteo[f.id] !== undefined && (
                  <span style={{
                    background: active ? cfg.color : 'rgba(255,255,255,0.1)',
                    color: active ? '#000' : 'rgba(255,255,255,0.5)',
                    borderRadius: 999, fontSize: 10, fontWeight: 700,
                    padding: '1px 6px', minWidth: 18, textAlign: 'center'
                  }}>{conteo[f.id]}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Search bar ── */}
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', display: 'flex' }}>
          <IcSearch />
        </span>
        <input
          type="text"
          placeholder="Buscar por nombre o placa..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{
            width: '100%', padding: '12px 16px 12px 40px',
            borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)',
            fontSize: 14, background: 'rgba(255,255,255,0.03)',
            color: '#fff', outline: 'none', boxSizing: 'border-box',
            fontFamily: 'Inter,sans-serif', transition: 'border 0.2s',
          }}
          onFocus={e => e.target.style.borderColor = 'rgba(235,4,99,0.5)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
        />
        {busqueda && (
          <button onClick={() => setBusqueda('')} style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'rgba(255,255,255,0.08)', border: 0, borderRadius: 6,
            color: 'rgba(255,255,255,0.5)', padding: '3px 8px', fontSize: 12,
            cursor: 'pointer', width: 'auto', margin: 0, fontFamily: 'Inter,sans-serif',
          }}>✕</button>
        )}
      </div>

      {/* ── Citas grid ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {citasFiltradas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.2)', fontFamily: 'Inter,sans-serif', fontSize: 14 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
            {busqueda ? `Sin resultados para "${busqueda}"` : 'No hay citas registradas'}
          </div>
        ) : (
          [...citasFiltradas].reverse().map(c => {
            const estado = (c.estado || 'pendiente').toLowerCase();
            const cfg = ESTADO_CONFIG[estado] || ESTADO_CONFIG.pendiente;
            const orden = ordenByCitaId[c.id];
            const hora = getHoraRegistro(c);

            return (
              <div key={c.id} style={{
                background: 'rgba(255,255,255,0.025)',
                border: `1px solid rgba(255,255,255,0.07)`,
                borderLeft: `3px solid ${cfg.color}`,
                borderRadius: 16,
                overflow: 'hidden',
                transition: 'box-shadow 0.2s',
                fontFamily: 'Inter,sans-serif',
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = `0 4px 24px rgba(0,0,0,0.3)`}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>

                {/* Card header */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    {orden && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                        #{orden} EN LA FILA
                      </span>
                    )}
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>
                      {c.cliente}
                    </h3>
                    <p style={{ margin: '3px 0 0', fontSize: 13, color: cfg.color, fontWeight: 600 }}>
                      {c.servicio}
                    </p>
                  </div>
                  <span style={{
                    padding: '5px 12px', borderRadius: 999,
                    background: cfg.bg, border: `1px solid ${cfg.border}`,
                    color: cfg.color, fontSize: 11, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap',
                  }}>
                    {cfg.label}
                  </span>
                </div>

                {/* Card body */}
                <div style={{ padding: '14px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px 24px' }}>
                  <InfoRow icon={IcCalendar} label="Fecha" value={capitalizar(formatearFecha(c.fecha))} />
                  <InfoRow icon={IcClock}    label="Hora"  value={hora || `Orden #${orden || '?'}`} />
                  <InfoRow icon={IcPhone}    label="Tel."  value={c.telefono} />
                  <InfoRow icon={IcMail}     label="Email" value={c.email} />

                  {(c.placa || c.marca || c.modelo || c.cilindraje) && (<>
                    <div style={{ gridColumn: '1 / -1', height: 1, background: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />
                    <InfoRow icon={IcMoto} label="Placa"   value={c.placa} />
                    <InfoRow icon={IcMoto} label="Marca"   value={c.marca} />
                    <InfoRow icon={IcMoto} label="Modelo"  value={c.modelo} />
                    <InfoRow icon={IcMoto} label="CC"      value={c.cilindraje ? `${c.cilindraje} cc` : null} />
                  </>)}

                  {c.comentarios && (
                    <div style={{ gridColumn: '1 / -1', fontSize: 12.5, color: 'rgba(255,255,255,0.45)', fontStyle: 'italic', padding: '4px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
                      "{c.comentarios}"
                    </div>
                  )}

                  {/* Método de pago */}
                  {c.metodo_pago && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '4px 0 10px' }} />
                      {editingPayment === c.id ? (
                        <div style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: 14 }}>
                          <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 10 }}>Selecciona método de pago:</p>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                            {[
                              { value: 'codigo_qr', label: 'Código QR', color: '#3b82f6' },
                              { value: 'efectivo',  label: 'Efectivo',  color: '#10b981' },
                              { value: 'tarjeta',   label: 'Tarjeta',   color: '#8b5cf6' },
                            ].map(m => (
                              <button key={m.value} onClick={() => setNewPaymentMethod(m.value)}
                                style={{
                                  flex: '1 1 auto', padding: '8px 14px', borderRadius: 9,
                                  border: `1px solid ${newPaymentMethod === m.value ? m.color : 'rgba(255,255,255,0.1)'}`,
                                  background: newPaymentMethod === m.value ? `${m.color}18` : 'transparent',
                                  color: newPaymentMethod === m.value ? m.color : 'rgba(255,255,255,0.5)',
                                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                  fontFamily: 'Inter,sans-serif', width: 'auto', margin: 0,
                                  transition: 'all 0.15s',
                                }}>
                                {m.label}
                              </button>
                            ))}
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => handleSavePaymentMethod(c.id)} disabled={!newPaymentMethod}
                              style={{ flex: 1, padding: '8px', borderRadius: 8, border: 0, background: '#10b981', color: '#fff', fontWeight: 700, fontSize: 12, cursor: newPaymentMethod ? 'pointer' : 'not-allowed', opacity: newPaymentMethod ? 1 : 0.5, width: 'auto', margin: 0, fontFamily: 'Inter,sans-serif' }}>
                              ✓ Guardar
                            </button>
                            <button onClick={handleCancelPaymentEdit}
                              style={{ flex: 1, padding: '8px', borderRadius: 8, border: 0, background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontWeight: 700, fontSize: 12, cursor: 'pointer', width: 'auto', margin: 0, fontFamily: 'Inter,sans-serif', border: '1px solid rgba(239,68,68,0.3)' }}>
                              ✕ Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ display: 'flex', color: 'rgba(255,255,255,0.35)' }}><IcCard /></span>
                          <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Pago:</span>
                          <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.8)' }}>{formatPago(c.metodo_pago)}</span>
                          <button onClick={() => handleEditPaymentMethod(c.id, c.metodo_pago)}
                            style={{ marginLeft: 6, padding: '3px 10px', borderRadius: 6, border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.08)', color: '#f59e0b', fontSize: 11, fontWeight: 600, cursor: 'pointer', width: 'auto', margin: '0 0 0 6px', fontFamily: 'Inter,sans-serif' }}>
                            Cambiar
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Asignar lavador */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '4px 0 10px' }} />
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontFamily: 'Inter,sans-serif' }}>
                      <IcUser />
                      Asignar lavador
                      {!c.lavador_id && <span style={{ color: '#ef4444', fontSize: 11 }}>· requerido para finalizar</span>}
                    </label>
                    <LavadorDropdown
                      citaId={c.id}
                      currentLavadorId={c.lavador_id}
                      lavadores={lavadores}
                      onAssign={updateCitaLavador}
                      hasError={!c.lavador_id}
                    />
                  </div>
                </div>

                {/* Card actions */}
                <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Confirmar', estado: 'confirmada', color: '#3b82f6', Icon: IcCheck  },
                    { label: 'En curso',  estado: 'en curso',   color: '#8b5cf6', Icon: IcZap   },
                    { label: 'Finalizar', estado: 'finalizada', color: '#10b981', Icon: IcStar,  disabled: !c.lavador_id },
                  ].map(({ label, estado: est, color, Icon, disabled }) => (
                    <button key={est} onClick={() => changeEstado(c.id, est)}
                      disabled={disabled}
                      title={disabled ? 'Asigna un lavador primero' : label}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 14px', borderRadius: 9,
                        border: `1px solid ${color}40`,
                        background: `${color}12`,
                        color: disabled ? 'rgba(255,255,255,0.2)' : color,
                        fontSize: 12.5, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
                        opacity: disabled ? 0.5 : 1,
                        fontFamily: 'Inter,sans-serif', width: 'auto', margin: 0,
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.background = `${color}22`; e.currentTarget.style.transform = 'translateY(-1px)'; }}}
                      onMouseLeave={e => { e.currentTarget.style.background = `${color}12`; e.currentTarget.style.transform = 'translateY(0)'; }}>
                      <Icon />
                      {label}
                    </button>
                  ))}

                  {userRole === 'admin' && (
                    <button onClick={() => handleDelete(c.id)}
                      style={{
                        marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 14px', borderRadius: 9,
                        border: '1px solid rgba(239,68,68,0.25)',
                        background: 'rgba(239,68,68,0.07)',
                        color: '#ef4444', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                        fontFamily: 'Inter,sans-serif', width: 'auto', margin: '0 0 0 auto',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.07)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                      <IcTrash />
                      Eliminar
                    </button>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
