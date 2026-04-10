import { useState, useEffect } from 'react';
import logo from '../../assets/motobombon.ico';

export default function Sidebar({ activeView, onNavigateToView, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const [userRole, setUserRole] = useState('admin');
  const [userName, setUserName] = useState('Admin');

  useEffect(() => {
    // Obtener el rol del usuario desde localStorage
    const role = localStorage.getItem('motobombon_user_role') || 'admin';
    const name = localStorage.getItem('motobombon_user_name') || 'Admin';
    setUserRole(role);
    setUserName(name);
  }, []);

  // Items del menú agrupados por sección
  const operacionItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard', roles: ['admin', 'supervisor'] },
    { id: 'calendar', icon: '📅', label: 'Calendario', roles: ['admin', 'supervisor'] },
    { id: 'appointments', icon: '📋', label: 'Citas', roles: ['admin', 'supervisor'] },
    { id: 'clientes', icon: '🎁', label: 'Clientes', roles: ['admin', 'supervisor'] },
  ];
  const configuracionItems = [
    { id: 'services', icon: '🏍️', label: 'Servicios', roles: ['admin'] },
    { id: 'talleres', icon: '🏢', label: 'Talleres Aliados', roles: ['admin'] },
    { id: 'lavadores', icon: '👤', label: 'Lavadores', roles: ['admin'] },
    { id: 'nomina', icon: '💰', label: 'Nómina', roles: ['admin'] },
    { id: 'productos', icon: '📦', label: 'Productos', roles: ['admin', 'supervisor'] },
    { id: 'finanzas', icon: '🏦', label: 'Finanzas', roles: ['admin'] },
    { id: 'settings', icon: '⚙️', label: 'Ajustes', roles: ['admin'] },
  ];

  const filterByRole = (items) => items.filter((item) => item.roles.includes(userRole));
  const menuOperacion = filterByRole(operacionItems);
  const menuConfiguracion = filterByRole(configuracionItems);

  const handleItemClick = (id) => {
    onNavigateToView(id);
    setIsOpen(false);
  };

  return (
    <>
      <button className="hamburger-btn" onClick={() => setIsOpen(true)}>
        ☰
      </button>

      {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />}

      <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sb-wrap">
          <div className="sb-header">
            <div className="sb-logo">
              <img
                src={logo}
                alt="MOTOBOMBON"
                loading="lazy"
                decoding="async"
                style={{width: '32px', height: '32px', borderRadius: '50%'}}
              />
            </div>
            <div className="sb-brand">MOTOBOMBON</div>
            <button className="sidebar-close" onClick={() => setIsOpen(false)}>
              ✕
            </button>
          </div>

          <nav className="sb-nav">
            {menuOperacion.length > 0 && (
              <>
                <div className="sb-section-title">Operación</div>
                <ul className="sb-list">
                  {menuOperacion.map((item) => (
                    <li key={item.id} className="sb-li">
                      <button
                        className={`sb-item ${activeView === item.id ? 'active' : ''}`}
                        onClick={() => handleItemClick(item.id)}
                      >
                        <span className="sb-ic">{item.icon}</span>
                        <span className="sb-tx">{item.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {menuConfiguracion.length > 0 && (
              <>
                <div className="sb-section-title">Configuración</div>
                <ul className="sb-list">
                  {menuConfiguracion.map((item) => (
                    <li key={item.id} className="sb-li">
                      <button
                        className={`sb-item ${activeView === item.id ? 'active' : ''}`}
                        onClick={() => handleItemClick(item.id)}
                      >
                        <span className="sb-ic">{item.icon}</span>
                        <span className="sb-tx">{item.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </nav>

          <div className="sb-footer">
            <div className="sb-user">
              <div className="sb-avatar">{userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}</div>
              <div className="sb-user-txt">
                <div className="sb-user-name">{userName}</div>
                <div className="sb-user-role" style={{fontSize: '12px', color: '#999'}}>
                  {userRole === 'admin' ? 'Administrador' : 'Supervisor'}
                </div>
              </div>
            </div>
            <button className="sb-logout" onClick={onLogout}>
               Cerrar sesión
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
