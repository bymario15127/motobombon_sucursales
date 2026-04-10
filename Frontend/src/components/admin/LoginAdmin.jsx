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

  useEffect(() => {
    if (localStorage.getItem("motobombon_is_admin") === "true") {
      nav("/admin/dashboard", { replace: true });
    }

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

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user,
          password: pass,
          sucursalId: sucursalId,
        }),
      });

      const raw = await response.text();
      let data;
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        const hint =
          raw.trim().startsWith("<") || response.status >= 502
            ? " Suele ser backend caído o Nginx con 502. VPS: pm2 status; pm2 logs; curl http://127.0.0.1:3000/api/health"
            : "";
        throw new Error(`El servidor no devolvió JSON.${hint}`);
      }

      if (!response.ok) {
        throw new Error(data.error || "Error al autenticar");
      }

      localStorage.setItem("motobombon_token", data.token);
      localStorage.setItem("motobombon_is_admin", "true");
      localStorage.setItem("motobombon_user_role", data.user.role);
      localStorage.setItem("motobombon_user_name", data.user.name);
      localStorage.setItem("motobombon_sucursal", data.user.sucursalId);

      const sucursal = sucursales.find((s) => s.id === data.user.sucursalId);
      if (sucursal) {
        localStorage.setItem("motobombon_sucursal_nombre", sucursal.nombre);
      }

      nav("/admin/dashboard");
    } catch (error) {
      console.error("Error en login:", error);
      setErr(error.message || "Error al autenticar");
      setTimeout(() => setErr(""), 3000);
    }
  };

  return (
    <div className="centered-page">
      <div className="mb-auth">
        <div className="mb-auth__card">
          <header className="mb-auth__header">
            <h1 className="mb-auth__brand">MOTOBOMBON</h1>
            <h2 className="mb-auth__subtitle">Login Administrador</h2>
          </header>

          <form className="mb-auth__form" onSubmit={handleLogin} noValidate>
          <div className="mb-auth__field">
            <label className="mb-auth__label" htmlFor="login-sucursal">
              Sucursal
            </label>
            <select
              id="login-sucursal"
              className="mb-auth__control"
              value={sucursalId}
              onChange={(e) => setSucursalId(e.target.value)}
              required
            >
              <option value="">Selecciona sucursal...</option>
              {sucursales.map((sucursal) => (
                <option key={sucursal.id} value={sucursal.id}>
                  {sucursal.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-auth__field">
            <label className="mb-auth__label" htmlFor="login-user">
              Usuario
            </label>
            <input
              id="login-user"
              className="mb-auth__control"
              placeholder="Usuario"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div className="mb-auth__field">
            <label className="mb-auth__label" htmlFor="login-pass">
              Contraseña
            </label>
            <input
              id="login-pass"
              className="mb-auth__control"
              type="password"
              placeholder="Contraseña"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="mb-auth__submit">
            Entrar
          </button>

          {err ? <p className="mb-auth__error">{err}</p> : null}
          </form>
        </div>

        <button
          type="button"
          className="mb-auth__back"
          onClick={() => nav("/")}
        >
          ← Volver al inicio
        </button>
      </div>
    </div>
  );
}
