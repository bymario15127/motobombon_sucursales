import { useState, useEffect } from 'react';
import logo from '../../assets/motobombon.ico';

// ── SVG Icon Components ──────────────────────────────────────────────────────
const Icon = ({ d, size = 18, strokeWidth = 1.75 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const icons = {
  dashboard: () => (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  calendar: () => (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  appointments: () => (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
    </svg>
  ),
  clientes: () => (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  services: () => (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M12 2v2M12 20v2M20 12h2M2 12h2M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41"/>
    </svg>
  ),
  talleres: () => (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  lavadores: () => (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  nomina: () => (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
    </svg>
  ),
  productos: () => (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  finanzas: () => (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  settings: () => (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  ),
  logout: () => (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  menu: () => (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  close: () => (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
};

export default function Sidebar({ activeView, onNavigateToView, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const [userRole, setUserRole] = useState('admin');
  const [userName, setUserName] = useState('Admin');

  useEffect(() => {
    const role = localStorage.getItem('motobombon_user_role') || 'admin';
    const name = localStorage.getItem('motobombon_user_name') || 'Admin';
    setUserRole(role);
    setUserName(name);
  }, []);

  const operacionItems = [
    { id: 'dashboard',    IconComp: icons.dashboard,    label: 'Dashboard',    roles: ['admin', 'supervisor'] },
    { id: 'calendar',     IconComp: icons.calendar,     label: 'Calendario',   roles: ['admin', 'supervisor'] },
    { id: 'appointments', IconComp: icons.appointments, label: 'Citas',        roles: ['admin', 'supervisor'] },
    { id: 'clientes',     IconComp: icons.clientes,     label: 'Clientes',     roles: ['admin', 'supervisor'] },
  ];

  const configuracionItems = [
    { id: 'services',  IconComp: icons.services,  label: 'Servicios',       roles: ['admin'] },
    { id: 'talleres',  IconComp: icons.talleres,  label: 'Talleres Aliados',roles: ['admin'] },
    { id: 'lavadores', IconComp: icons.lavadores, label: 'Lavadores',       roles: ['admin'] },
    { id: 'nomina',    IconComp: icons.nomina,    label: 'Nómina',          roles: ['admin'] },
    { id: 'productos', IconComp: icons.productos, label: 'Productos',       roles: ['admin', 'supervisor'] },
    { id: 'finanzas',  IconComp: icons.finanzas,  label: 'Finanzas',        roles: ['admin'] },
    { id: 'settings',  IconComp: icons.settings,  label: 'Ajustes',         roles: ['admin'] },
  ];

  const filterByRole = (items) => items.filter(item => item.roles.includes(userRole));
  const menuOperacion = filterByRole(operacionItems);
  const menuConfiguracion = filterByRole(configuracionItems);

  const handleItemClick = (id) => {
    onNavigateToView(id);
    setIsOpen(false);
  };

  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const roleLabel = userRole === 'admin' ? 'Administrador' : 'Supervisor';

  return (
    <>
      {/* Hamburger */}
      <button className="hamburger-btn" onClick={() => setIsOpen(true)} aria-label="Abrir menú">
        <icons.menu />
      </button>

      {/* Overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />}

      <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sb-wrap">

          {/* Header */}
          <div className="sb-header">
            <div className="sb-logo-wrap">
              <img src={logo} alt="MOTOBOMBON" loading="lazy" decoding="async" className="sb-logo-img" />
            </div>
            <div className="sb-brand-block">
              <span className="sb-brand">MOTOBOMBON</span>
              <span className="sb-brand-sub">Panel de Control</span>
            </div>
            <button className="sidebar-close" onClick={() => setIsOpen(false)} aria-label="Cerrar menú">
              <icons.close />
            </button>
          </div>

          {/* Nav */}
          <nav className="sb-nav">
            {menuOperacion.length > 0 && (
              <div className="sb-group">
                <div className="sb-section-title">Operación</div>
                <ul className="sb-list">
                  {menuOperacion.map(({ id, IconComp, label }) => (
                    <li key={id} className="sb-li">
                      <button
                        className={`sb-item ${activeView === id ? 'active' : ''}`}
                        onClick={() => handleItemClick(id)}
                      >
                        <span className="sb-ic"><IconComp /></span>
                        <span className="sb-tx">{label}</span>
                        {activeView === id && <span className="sb-active-dot" />}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {menuConfiguracion.length > 0 && (
              <div className="sb-group">
                <div className="sb-section-title">Configuración</div>
                <ul className="sb-list">
                  {menuConfiguracion.map(({ id, IconComp, label }) => (
                    <li key={id} className="sb-li">
                      <button
                        className={`sb-item ${activeView === id ? 'active' : ''}`}
                        onClick={() => handleItemClick(id)}
                      >
                        <span className="sb-ic"><IconComp /></span>
                        <span className="sb-tx">{label}</span>
                        {activeView === id && <span className="sb-active-dot" />}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </nav>

          {/* Footer */}
          <div className="sb-footer">
            <div className="sb-user-card">
              <div className="sb-avatar">{initials}</div>
              <div className="sb-user-info">
                <span className="sb-user-name">{userName}</span>
                <span className="sb-user-role-badge">{roleLabel}</span>
              </div>
            </div>
            <button className="sb-logout" onClick={onLogout}>
              <icons.logout />
              <span>Cerrar sesión</span>
            </button>
          </div>

        </div>
      </aside>
    </>
  );
}
