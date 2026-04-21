// src/components/admin/Dashboard.jsx
import { useState, useEffect } from "react";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getCitas } from "../../services/citasService";
import serviciosService from "../../services/serviciosService";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// ── Inline SVG Icons ─────────────────────────────────────────────────────────
const CheckIcon = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const ClockIcon = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const ZapIcon = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);
const UsersIcon = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
  </svg>
);
const PlusIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const CalIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const WrenchIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
  </svg>
);

// ── Custom Tooltip for PieChart ───────────────────────────────────────────────
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(17,17,17,0.95)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10,
        padding: '8px 14px',
        fontSize: 13,
        fontFamily: 'Poppins, sans-serif',
        color: '#fff',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
      }}>
        <span style={{ fontWeight: 700 }}>{payload[0].name}</span>
        <span style={{ marginLeft: 8, color: payload[0].fill }}>{payload[0].value}</span>
      </div>
    );
  }
  return null;
};

export default function Dashboard({ onNavigateToView }) {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState('');
  const [stats, setStats] = useState({
    total: 0, pendientes: 0, confirmadas: 0, enCurso: 0, finalizadas: 0, canceladas: 0
  });

  useEffect(() => {
    const name = localStorage.getItem('motobombon_user_name') || 'Admin';
    setUserName(name.split(' ')[0]); // solo primer nombre
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getCitas().catch(() => []);
      const arr = Array.isArray(data) ? data : [];
      setCitas(arr);
      setStats({
        total:       arr.length,
        pendientes:  arr.filter(c => c.estado === 'pendiente').length,
        confirmadas: arr.filter(c => c.estado === 'confirmada').length,
        enCurso:     arr.filter(c => c.estado === 'en curso').length,
        finalizadas: arr.filter(c => c.estado === 'finalizada').length,
        canceladas:  arr.filter(c => c.estado === 'cancelada').length,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Chart data
  const chartData = [
    { name: 'Pendiente',  key: 'pendiente',  value: stats.pendientes,  color: '#f59e0b' },
    { name: 'Confirmada', key: 'confirmada', value: stats.confirmadas, color: '#10b981' },
    { name: 'En curso',   key: 'en curso',   value: stats.enCurso,    color: '#3b82f6' },
    { name: 'Finalizada', key: 'finalizada', value: stats.finalizadas, color: '#8b5cf6' },
    { name: 'Cancelada',  key: 'cancelada',  value: stats.canceladas,  color: '#ef4444' },
  ].filter(d => d.value > 0);

  // Payment methods
  const payments = {
    qr:       citas.filter(c => c.metodo_pago === 'codigo_qr').length,
    efectivo: citas.filter(c => c.metodo_pago === 'efectivo').length,
    tarjeta:  citas.filter(c => c.metodo_pago === 'tarjeta').length,
    sin:      citas.filter(c => !c.metodo_pago).length,
  };

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

  const hoy = format(new Date(), "EEEE d 'de' MMMM", { locale: es });
  const hoyCapitalized = hoy.charAt(0).toUpperCase() + hoy.slice(1);

  // KPI cards config
  const kpis = [
    {
      label: 'Total Hoy',
      value: stats.total,
      icon: <UsersIcon />,
      color: '#EB0463',
      glow: 'rgba(235,4,99,0.25)',
      bg: 'rgba(235,4,99,0.08)',
      border: 'rgba(235,4,99,0.2)',
    },
    {
      label: 'Pendientes',
      value: stats.pendientes,
      icon: <ClockIcon />,
      color: '#f59e0b',
      glow: 'rgba(245,158,11,0.2)',
      bg: 'rgba(245,158,11,0.07)',
      border: 'rgba(245,158,11,0.18)',
    },
    {
      label: 'En Curso',
      value: stats.enCurso,
      icon: <ZapIcon />,
      color: '#3b82f6',
      glow: 'rgba(59,130,246,0.2)',
      bg: 'rgba(59,130,246,0.07)',
      border: 'rgba(59,130,246,0.18)',
    },
    {
      label: 'Finalizadas',
      value: stats.finalizadas,
      icon: <CheckIcon />,
      color: '#10b981',
      glow: 'rgba(16,185,129,0.2)',
      bg: 'rgba(16,185,129,0.07)',
      border: 'rgba(16,185,129,0.18)',
    },
  ];

  const quickActions = [
    { label: 'Nueva Cita',         icon: <PlusIcon />,   view: 'appointments', color: '#EB0463' },
    { label: 'Ver Calendario',     icon: <CalIcon />,    view: 'calendar',     color: '#3b82f6' },
    { label: 'Gestionar Servicios',icon: <WrenchIcon />, view: 'services',     color: '#8b5cf6' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Welcome Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(235,4,99,0.12) 0%, rgba(166,84,149,0.08) 50%, rgba(15,15,15,0) 100%)',
        border: '1px solid rgba(235,4,99,0.18)',
        borderRadius: 18,
        padding: '24px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontFamily: 'Poppins,sans-serif', marginBottom: 4, letterSpacing: '0.04em' }}>
            {hoyCapitalized}
          </div>
          <h2 style={{
            margin: 0,
            fontSize: 'clamp(18px,2.2vw,24px)',
            fontWeight: 700,
            color: '#ffffff',
            fontFamily: 'Poppins,sans-serif',
            letterSpacing: '-0.02em'
          }}>
            {greeting}, <span style={{ color: '#EB0463' }}>{userName}</span> 👋
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.4)', fontFamily: 'Poppins,sans-serif' }}>
            Aquí tienes el resumen de hoy en tu negocio
          </p>
        </div>
        <div style={{
          background: 'rgba(235,4,99,0.1)',
          border: '1px solid rgba(235,4,99,0.25)',
          borderRadius: 12,
          padding: '10px 20px',
          fontSize: 13,
          fontWeight: 600,
          color: '#EB0463',
          fontFamily: 'Poppins,sans-serif',
          whiteSpace: 'nowrap',
          cursor: 'pointer',
        }} onClick={loadData}>
          ↻ Actualizar
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))',
        gap: 16,
      }}>
        {kpis.map(({ label, value, icon, color, glow, bg, border }) => (
          <div key={label} style={{
            background: bg,
            border: `1px solid ${border}`,
            borderRadius: 16,
            padding: '20px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'default',
            boxShadow: `0 0 0 0 ${glow}`,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = `0 8px 24px ${glow}`;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = `0 0 0 0 ${glow}`;
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: `rgba(${color === '#EB0463' ? '235,4,99' : color === '#f59e0b' ? '245,158,11' : color === '#3b82f6' ? '59,130,246' : '16,185,129'},0.15)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color
            }}>
              {icon}
            </div>
            <div>
              <div style={{ fontSize: 30, fontWeight: 800, color: '#fff', fontFamily: 'Poppins,sans-serif', lineHeight: 1 }}>
                {loading ? '—' : value}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 4, fontFamily: 'Poppins,sans-serif', fontWeight: 500 }}>
                {label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Distribution Chart + Payment Methods ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>

        {/* Pie Chart */}
        <div style={{
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 18,
          padding: '22px 22px 18px',
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'Poppins,sans-serif', marginBottom: 4 }}>
            Distribución de Citas
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontFamily: 'Poppins,sans-serif', marginBottom: 18 }}>
            Estado actual del día
          </div>

          {stats.total === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.25)', fontSize: 13, fontFamily: 'Poppins,sans-serif' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📊</div>
              Sin citas registradas hoy
            </div>
          ) : (
            <>
              <div style={{ width: '100%', height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} dataKey="value" nameKey="name"
                      cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginTop: 12 }}>
                {chartData.map(({ name, value, color }) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontFamily: 'Poppins,sans-serif', color: 'rgba(255,255,255,0.65)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0, display: 'inline-block' }}/>
                    {name}: <strong style={{ color: '#fff' }}>{value}</strong>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Payment Methods */}
        <div style={{
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 18,
          padding: '22px 22px 18px',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'Poppins,sans-serif', marginBottom: 4 }}>
            Métodos de Pago
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontFamily: 'Poppins,sans-serif', marginBottom: 20 }}>
            Citas del día por forma de pago
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
            {[
              { label: 'Código QR', value: payments.qr,       color: '#3b82f6', icon: '📱', pct: stats.total ? Math.round(payments.qr / stats.total * 100) : 0 },
              { label: 'Efectivo',  value: payments.efectivo, color: '#10b981', icon: '💵', pct: stats.total ? Math.round(payments.efectivo / stats.total * 100) : 0 },
              { label: 'Tarjeta',   value: payments.tarjeta,  color: '#8b5cf6', icon: '💳', pct: stats.total ? Math.round(payments.tarjeta / stats.total * 100) : 0 },
            ].map(({ label, value, color, icon, pct }) => (
              <div key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: 'Poppins,sans-serif' }}>
                    <span style={{ fontSize: 16 }}>{icon}</span> {label}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'Poppins,sans-serif' }}>
                    {value} <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>({pct}%)</span>
                  </span>
                </div>
                <div style={{ height: 5, borderRadius: 999, background: 'rgba(255,255,255,0.07)' }}>
                  <div style={{
                    height: '100%', borderRadius: 999,
                    width: `${pct}%`,
                    background: color,
                    transition: 'width 0.6s ease',
                    boxShadow: `0 0 8px ${color}`,
                  }}/>
                </div>
              </div>
            ))}
            {payments.sin > 0 && (
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: 'Poppins,sans-serif', marginTop: 4 }}>
                ❓ {payments.sin} sin registrar
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 18,
        padding: '20px 22px',
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'Poppins,sans-serif', marginBottom: 16 }}>
          ⚡ Acciones Rápidas
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {quickActions.map(({ label, icon, view, color }) => (
            <button key={view}
              onClick={() => onNavigateToView && onNavigateToView(view)}
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '11px 20px',
                borderRadius: 12,
                border: `1px solid ${color}33`,
                background: `${color}12`,
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'Poppins,sans-serif',
                cursor: 'pointer',
                transition: 'background 0.18s, transform 0.18s, box-shadow 0.18s',
                width: 'auto',
                margin: 0,
                boxShadow: 'none',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = `${color}28`;
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 6px 20px ${color}30`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = `${color}12`;
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
              <span style={{ color }}>{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}