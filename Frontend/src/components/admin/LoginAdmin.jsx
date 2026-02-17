// src/components/Admin/LoginAdmin.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { sucursales } from "../../config/sucursales";

export default function LoginAdmin() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [sucursalId, setSucursalId] = useState("");
  const [err, setErr] = useState("");
  const nav = useNavigate();

  // Si ya está autenticado, redirigir al panel
  useEffect(() => {
    if (localStorage.getItem("motobombon_is_admin") === "true") {
      nav("/admin", { replace: true });
    }
    
    // Obtener sucursal guardada si existe
    const savedSucursal = localStorage.getItem("motobombon_sucursal");
    if (savedSucursal) {
      setSucursalId(savedSucursal);
    }
  }, [nav]);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!sucursalId) {
      setErr("Por favor selecciona una sucursal");
      setTimeout(() => setErr(""), 3000);
      return;
    }
    
    try {
      setErr("");
      
      console.log("🔑 Intentando login con:", user, "en sucursal:", sucursalId);
      
      // Hacer petición al backend para obtener token real
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: user, 
          password: pass,
          sucursalId: sucursalId 
        })
      });

      console.log("📡 Respuesta del servidor:", response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error("❌ Error del servidor:", error);
        throw new Error(error.error || "Error al autenticar");
      }

      const data = await response.json();
      console.log("✅ Login exitoso, datos recibidos:", data);
      
      // Guardar token y datos en localStorage
      console.log("💾 Guardando token:", data.token);
      localStorage.setItem("motobombon_token", data.token);
      localStorage.setItem("motobombon_is_admin", "true");
      localStorage.setItem("motobombon_user_role", data.user.role);
      localStorage.setItem("motobombon_user_name", data.user.name);
      localStorage.setItem("motobombon_sucursal", data.user.sucursalId);
      
      // Obtener nombre de sucursal
      const sucursal = sucursales.find(s => s.id === data.user.sucursalId);
      if (sucursal) {
        localStorage.setItem("motobombon_sucursal_nombre", sucursal.nombre);
      }
      
      console.log("✅ Token guardado en localStorage");
      nav("/admin");
    } catch (error) {
      console.error("❌ Error en login:", error);
      setErr(error.message || "Error al autenticar");
      setTimeout(() => setErr(""), 3000);
    }
  };

  return (
    <div className="centered-page" style={{ background: '#000' }}>
      <div className="container" style={{ maxWidth: 560 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ 
            fontFamily: 'Yeseva One, serif', 
            fontSize: '2.5rem', 
            color: '#ffffff',
            textShadow: '0 0 20px #EB0463',
            marginBottom: '0.5rem'
          }}>
            MOTOBOMBON
          </h1>
          <h2 style={{ color: '#EB0463', fontSize: '1.3rem', marginBottom: '0' }}>
            Login Administrador
          </h2>
        </div>
        
        <form onSubmit={handleLogin} className="form-container" style={{ boxShadow: "none", padding: 0 }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              color: '#fff', 
              display: 'block', 
              marginBottom: '0.5rem',
              fontSize: '0.9rem'
            }}>
              Sucursal
            </label>
            <select 
              value={sucursalId} 
              onChange={(e) => setSucursalId(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.8rem',
                fontSize: '1rem',
                borderRadius: '8px',
                border: '2px solid #EB0463',
                background: '#1a1a1a',
                color: '#fff'
              }}
            >
              <option value="">Selecciona sucursal...</option>
              {sucursales.map(sucursal => (
                <option key={sucursal.id} value={sucursal.id}>
                  {sucursal.nombre}
                </option>
              ))}
            </select>
          </div>
          
          <input 
            placeholder="Usuario" 
            value={user} 
            onChange={(e) => setUser(e.target.value)} 
            required 
            style={{ marginBottom: '1rem' }}
          />
          
          <input 
            type="password" 
            placeholder="Contraseña" 
            value={pass} 
            onChange={(e) => setPass(e.target.value)} 
            required 
            style={{ marginBottom: '1rem' }}
          />
          
          <button type="submit" style={{
            background: 'linear-gradient(135deg, #EB0463, #ff1a75)',
            border: 'none',
            color: '#fff',
            padding: '1rem',
            fontSize: '1.1rem',
            fontWeight: '600',
            borderRadius: '8px',
            cursor: 'pointer',
            width: '100%'
          }}>
            Entrar
          </button>
          
          {err && (
            <p style={{ 
              color: "#ff4444", 
              background: 'rgba(255,68,68,0.1)',
              padding: '0.8rem',
              borderRadius: '6px',
              marginTop: '1rem',
              textAlign: 'center'
            }}>
              {err}
            </p>
          )}
        </form>
        
        <div style={{ 
          textAlign: 'center', 
          marginTop: '2rem',
          padding: '1rem',
          background: 'rgba(235,4,99,0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(235,4,99,0.3)'
        }}>
          <p style={{ color: '#ccc', fontSize: '0.85rem', margin: '0.3rem 0' }}>
            <strong style={{ color: '#EB0463' }}>Sucursal Centro:</strong><br/>
            admin_centro / centro123
          </p>
          <p style={{ color: '#ccc', fontSize: '0.85rem', margin: '0.3rem 0' }}>
            <strong style={{ color: '#EB0463' }}>Sucursal Sur:</strong><br/>
            admin_sur / sur123
          </p>
        </div>
        
        <button
          onClick={() => nav('/')}
          style={{
            marginTop: '1rem',
            background: 'transparent',
            border: '1px solid #666',
            color: '#999',
            padding: '0.6rem',
            borderRadius: '6px',
            cursor: 'pointer',
            width: '100%',
            fontSize: '0.9rem'
          }}
          onMouseEnter={(e) => {
            e.target.style.borderColor = '#EB0463';
            e.target.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = '#666';
            e.target.style.color = '#999';
          }}
        >
          ← Volver al inicio
        </button>
      </div>
    </div>
  );
}
