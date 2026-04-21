// Frontend/src/components/admin/ClientesManager.jsx
import { useState, useEffect } from "react";
import { getClientes, verificarCupon, usarCupon, exportarClientesExcel } from "../../services/clientesService";
import { fetchWithSucursal, getHeaders } from "../../services/apiHelper.js";

export default function ClientesManager() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [ordenarPor, setOrdenarPor] = useState("lavadas");
  const [mostrarCupon, setMostrarCupon] = useState(false);
  const [codigoCupon, setCodigoCupon] = useState("");
  const [resultadoCupon, setResultadoCupon] = useState(null);
  const [mostrarFusionar, setMostrarFusionar] = useState(false);
  const [emailPrincipal, setEmailPrincipal] = useState("");
  const [emailDuplicado, setEmailDuplicado] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const CLIENTES_POR_PAGINA = 30;

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    try {
      setLoading(true);
      const data = await getClientes();
      setClientes(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verificarCuponHandler = async () => {
    if (!codigoCupon.trim()) {
      alert("Por favor ingresa un código de cupón");
      return;
    }
    try {
      const resultado = await verificarCupon(codigoCupon.trim());
      setResultadoCupon(resultado);
    } catch (err) {
      alert("Error al verificar cupón: " + err.message);
    }
  };

  const usarCuponHandler = async () => {
    if (!codigoCupon.trim()) {
      alert("Por favor ingresa un código de cupón");
      return;
    }
    
    // Solicitar email del cliente para buscar su cita
    const emailCliente = prompt("Ingresa el email del cliente que va a usar el cupón:");
    if (!emailCliente) {
      return;
    }
    
    if (!confirm("¿Estás seguro de marcar este cupón como usado y ligarlo a la cita del cliente?")) {
      return;
    }
    
    try {
      // Buscar la cita más reciente del cliente de hoy
      const response = await fetchWithSucursal('/api/citas');
      const todasCitas = await response.json();
      
      const hoy = new Date();
      const fechaHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
      
      const citasCliente = todasCitas
        .filter(c => c.email?.toLowerCase() === emailCliente.toLowerCase() && c.fecha === fechaHoy)
        .sort((a, b) => b.id - a.id);
      
      if (citasCliente.length === 0) {
        alert("⚠️ No se encontró ninguna cita de hoy para este email. Crea la cita primero.");
        return;
      }
      
      const citaId = citasCliente[0].id;
      
      await usarCupon(codigoCupon.trim(), citaId);
      alert(`✅ Cupón usado exitosamente y ligado a la cita #${citaId}`);
      setCodigoCupon("");
      setResultadoCupon(null);
      setMostrarCupon(false);
      cargarClientes(); // Recargar para actualizar contadores
    } catch (err) {
      alert("Error al usar cupón: " + err.message);
    }
  };

  const clientesFiltrados = clientes
    .filter((cliente) => {
      const searchLower = busqueda.toLowerCase();
      return (
        cliente.nombre.toLowerCase().includes(searchLower) ||
        cliente.email.toLowerCase().includes(searchLower) ||
        (cliente.telefono && cliente.telefono.includes(busqueda))
      );
    })
    .sort((a, b) => {
      if (ordenarPor === "lavadas") {
        return b.lavadas_completadas - a.lavadas_completadas;
      } else {
        return a.nombre.localeCompare(b.nombre);
      }
    });

  const totalPaginas = Math.ceil(clientesFiltrados.length / CLIENTES_POR_PAGINA);
  const clientesPagina = clientesFiltrados.slice(
    (paginaActual - 1) * CLIENTES_POR_PAGINA,
    paginaActual * CLIENTES_POR_PAGINA
  );

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, ordenarPor]);

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#00d4ff" }}>
        <p>⏳ Cargando clientes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "2rem" }}>
        <p style={{ color: "#ff6b6b" }}>❌ Error: {error}</p>
        <ActionButton label="🔄 Reintentar" color="#8b5cf6" onClick={cargarClientes} />
      </div>
    );
  }

  return (
    <div style={{ padding: "1rem", maxWidth: "1400px", margin: "0 auto" }}>
      <h1 className="admin-section-title" style={{ marginBottom: "2rem" }}>
        🎁 Gestión de Clientes y Fidelización
      </h1>

        {/* Estadísticas */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem"
        }}>
          <StatCard titulo="Total Clientes" valor={clientes.length} color="#3b82f6" />
          <StatCard titulo="Total Lavadas (Histórico)" valor={clientes.reduce((sum, c) => sum + (c.total_lavadas_historico || c.lavadas_completadas), 0)} color="#a855f7" />
          <StatCard titulo="Cupones Disponibles" valor={clientes.reduce((sum, c) => sum + c.lavadas_gratis_pendientes, 0)} color="#06b6d4" />
          <StatCard titulo="Clientes VIP (10+)" valor={clientes.filter((c) => c.lavadas_completadas >= 10).length} color="#f59e0b" />
        </div>

        {/* Controles */}
        <div style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "2rem",
          flexWrap: "wrap",
          alignItems: "center"
        }}>
          <input
            type="text"
            placeholder="Buscar por nombre, email o teléfono..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              flex: "1 1 100%",
              minWidth: "200px",
              padding: "10px 14px",
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.03)",
              color: "#fff",
              fontSize: "13px",
              fontFamily: "Inter,sans-serif",
              outline: "none",
            }}
            onFocus={e => e.target.style.borderColor='rgba(235,4,99,0.5)'}
            onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'}
          />

          <select
            value={ordenarPor}
            onChange={(e) => setOrdenarPor(e.target.value)}
            style={{
              flex: "1 1 100%",
              minWidth: "200px",
              padding: "10px 14px",
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.03)",
              color: "#fff",
              fontSize: "13px",
              fontFamily: "Inter,sans-serif",
              outline: "none",
              colorScheme: "dark",
              cursor: "pointer",
            }}
          >
            <option value="lavadas">Ordenar por Lavadas</option>
            <option value="nombre">Ordenar por Nombre</option>
          </select>

          <ActionButton label="Fusionar"       color="#ef4444" onClick={() => setMostrarFusionar(!mostrarFusionar)} />
          <ActionButton label="Cupón"          color="#8b5cf6" onClick={() => setMostrarCupon(!mostrarCupon)} />
          <ActionButton label="Exportar Excel" color="#f59e0b" onClick={() => exportarClientesExcel(clientes).catch(err => alert(err.message))} />
          <ActionButton label="Actualizar"     color="#10b981" onClick={cargarClientes} />
        </div>

        {/* Panel Fusionar */}
        {mostrarFusionar && (
          <div style={{
            background: "linear-gradient(135deg, #ff6b6b 0%, #ff8c42 100%)",
            borderRadius: "15px",
            padding: "clamp(1rem, 3vw, 2rem)",
            marginBottom: "2rem",
            boxShadow: "0 8px 32px rgba(255,107,107,0.3)",
            border: "1px solid rgba(255,255,255,0.1)"
          }}>
            <h3 style={{ marginTop: 0, color: "white", fontSize: "clamp(1.2rem, 3vw, 1.5rem)" }}>🔗 Fusionar Clientes Duplicados</h3>
            <p style={{ color: "rgba(255,255,255,0.9)" }}>Combina dos registros. Las lavadas se sumarán y cupones se transferirán.</p>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "1rem",
              marginBottom: "1rem"
            }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold", color: "white" }}>Email Principal:</label>
                <select value={emailPrincipal} onChange={(e) => setEmailPrincipal(e.target.value)} style={{
                  width: "100%", padding: "0.75rem", borderRadius: "8px", border: "2px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.1)", color: "white", fontSize: "13px"
                }}>
                  <option value="">Seleccionar...</option>
                  {clientes.map(c => (<option key={c.email} value={c.email}>{c.email} ({c.total_lavadas_historico || c.lavadas_completadas})</option>))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold", color: "white" }}>Email Duplicado:</label>
                <select value={emailDuplicado} onChange={(e) => setEmailDuplicado(e.target.value)} style={{
                  width: "100%", padding: "0.75rem", borderRadius: "8px", border: "2px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.1)", color: "white", fontSize: "13px"
                }}>
                  <option value="">Seleccionar...</option>
                  {clientes.map(c => (<option key={c.email} value={c.email}>{c.email} ({c.total_lavadas_historico || c.lavadas_completadas})</option>))}
                </select>
              </div>
            </div>

            <button onClick={async () => {
              if (!emailPrincipal || !emailDuplicado) { alert("Selecciona ambos emails"); return; }
              if (emailPrincipal === emailDuplicado) { alert("Emails deben ser diferentes"); return; }
              if (!confirm(`¿Fusionar ${emailDuplicado} en ${emailPrincipal}?`)) return;
              try {
                const response = await fetchWithSucursal("/api/clientes/fusionar", {
                  method: "POST",
                  headers: getHeaders(),
                  body: JSON.stringify({ emailPrincipal, emailDuplicado })
                });
                const data = await response.json();
                if (response.ok) {
                  alert(`✅ Fusionado!\n${data.mensaje}`);
                  setMostrarFusionar(false);
                  setEmailPrincipal("");
                  setEmailDuplicado("");
                  cargarClientes();
                } else {
                  alert("❌ " + data.error);
                }
              } catch (err) {
                alert("Error: " + err.message);
              }
            }} style={{
              width: "100%",
              padding: "0.75rem",
              background: "rgba(255,255,255,0.2)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "clamp(0.9rem, 2vw, 1rem)"
            }}>
              ✅ Fusionar Ahora
            </button>
          </div>
        )}

        {/* Panel Cupón */}
        {mostrarCupon && (
          <div style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: "15px",
            padding: "clamp(1rem, 3vw, 2rem)",
            marginBottom: "2rem",
            boxShadow: "0 8px 32px rgba(102,126,234,0.3)",
            border: "1px solid rgba(255,255,255,0.1)"
          }}>
            <h3 style={{ marginTop: 0, color: "white", fontSize: "clamp(1.2rem, 3vw, 1.5rem)" }}>🎫 Verificar Cupón</h3>
            
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "1rem",
              marginBottom: "1rem"
            }}>
              <input
                type="text"
                placeholder="Ingresa código de cupón"
                value={codigoCupon}
                onChange={(e) => setCodigoCupon(e.target.value)}
                style={{
                  padding: "0.75rem",
                  borderRadius: "8px",
                  border: "2px solid rgba(255,255,255,0.3)",
                  background: "rgba(255,255,255,0.1)",
                  color: "white",
                  fontSize: "13px"
                }}
              />
              <ActionButton label="🔍 Verificar" color="#10b981" onClick={verificarCuponHandler} />
              <ActionButton label="✅ Usar Cupón" color="#4facfe" onClick={usarCuponHandler} />
            </div>

            {resultadoCupon && (
              <div style={{
                background: "rgba(255,255,255,0.1)",
                borderRadius: "8px",
                padding: "1rem",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "white"
              }}>
                <p><strong>Email:</strong> {resultadoCupon.email_cliente || resultadoCupon.email || "N/A"}</p>
                <p><strong>Estado:</strong> {resultadoCupon.valido ? "🔄 Disponible" : (resultadoCupon.usado ? "✅ Usado" : "❌ Inválido")}</p>
                {!resultadoCupon.valido && resultadoCupon.fecha_uso && <p><strong>Usado en:</strong> {new Date(resultadoCupon.fecha_uso).toLocaleString()}</p>}
                <p><strong>Mensaje:</strong> {resultadoCupon.mensaje}</p>
              </div>
            )}
          </div>
        )}

        {/* Lista Clientes */}
        {clientesFiltrados.length > 0 ? (
          <>
          <p style={{ color: "#9ca3af", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
            Mostrando {(paginaActual - 1) * CLIENTES_POR_PAGINA + 1}–{Math.min(paginaActual * CLIENTES_POR_PAGINA, clientesFiltrados.length)} de {clientesFiltrados.length}
          </p>
          <div style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))"
          }}>
            {clientesPagina.map((cliente) => (
              <div key={cliente.email} style={{
                background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                borderRadius: "12px",
                padding: "1.5rem",
                border: "1px solid #00d4ff",
                boxShadow: "0 4px 15px rgba(0,0,0,0.3)"
              }}>
                <h4 style={{ marginTop: 0, color: "#00d4ff", fontSize: "clamp(1rem, 2vw, 1.3rem)" }}>{cliente.nombre}</h4>
                <p style={{ color: "#aaa", margin: "0.5rem 0", fontSize: "0.9rem" }}>📧 {cliente.email}</p>
                {cliente.telefono && <p style={{ color: "#aaa", margin: "0.5rem 0", fontSize: "0.9rem" }}>📱 {cliente.telefono}</p>}

                <div style={{ margin: "1rem 0", padding: "1rem", background: "rgba(0,212,255,0.1)", borderRadius: "8px", border: "1px solid rgba(0,212,255,0.3)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", color: "#00d4ff" }}>
                    <span>Ciclo Actual: {`${cliente.lavadas_completadas}/10`}</span>
                    <span>{10 - cliente.lavadas_completadas} para próximo</span>
                  </div>
                  <div style={{
                    width: "100%",
                    height: "8px",
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: "4px",
                    overflow: "hidden"
                  }}>
                    <div style={{
                      width: `${(cliente.lavadas_completadas / 10) * 100}%`,
                      height: "100%",
                      background: "linear-gradient(90deg, #00d4ff 0%, #667eea 100%)",
                      transition: "width 0.3s ease"
                    }}></div>
                  </div>
                </div>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.5rem",
                  fontSize: "0.9rem"
                }}>
                  <div style={{ background: "rgba(240,147,251,0.2)", padding: "0.5rem", borderRadius: "6px", textAlign: "center", color: "#f093fb" }}>
                    <strong>{cliente.total_lavadas_historico || cliente.lavadas_completadas}</strong><br />Total
                  </div>
                  <div style={{ background: "rgba(79,172,254,0.2)", padding: "0.5rem", borderRadius: "6px", textAlign: "center", color: "#4facfe" }}>
                    <strong>{cliente.lavadas_gratis_pendientes || 0}</strong><br />Cupones
                  </div>
                </div>

                {/* Cupones disponibles */}
                {cliente.cupones?.filter(c => !c.usado).length > 0 && (
                  <div style={{
                    marginTop: "1rem",
                    padding: "0.75rem",
                    background: "rgba(67,226,123,0.1)",
                    borderRadius: "8px",
                    border: "1px solid rgba(67,226,123,0.3)"
                  }}>
                    <p style={{ color: "#43e97b", fontWeight: "bold", margin: "0 0 0.5rem 0", fontSize: "0.9rem" }}>
                      🎫 Cupones Disponibles:
                    </p>
                    {cliente.cupones.filter(c => !c.usado).map(cupon => (
                      <div key={cupon.codigo} style={{
                        background: "rgba(0,212,255,0.2)",
                        padding: "0.5rem",
                        borderRadius: "6px",
                        marginBottom: "0.5rem",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}>
                        <code style={{
                          color: "#00d4ff",
                          fontSize: "0.85rem",
                          fontWeight: "bold",
                          userSelect: "all"
                        }}>
                          {cupon.codigo}
                        </code>
                        <span style={{ color: "#aaa", fontSize: "0.75rem" }}>
                          {new Date(cupon.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {totalPaginas > 1 && (
            <div style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "0.5rem",
              marginTop: "1.5rem",
              flexWrap: "wrap"
            }}>
              <button
                disabled={paginaActual <= 1}
                onClick={() => setPaginaActual(p => p - 1)}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "6px",
                  border: "1px solid #333",
                  background: paginaActual <= 1 ? "#1a1a1a" : "#0f1419",
                  color: paginaActual <= 1 ? "#555" : "#fff",
                  cursor: paginaActual <= 1 ? "default" : "pointer",
                }}
              >← Anterior</button>
              <span style={{ color: "#9ca3af", fontSize: "0.9rem" }}>
                Página {paginaActual} / {totalPaginas}
              </span>
              <button
                disabled={paginaActual >= totalPaginas}
                onClick={() => setPaginaActual(p => p + 1)}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "6px",
                  border: "1px solid #333",
                  background: paginaActual >= totalPaginas ? "#1a1a1a" : "#0f1419",
                  color: paginaActual >= totalPaginas ? "#555" : "#fff",
                  cursor: paginaActual >= totalPaginas ? "default" : "pointer",
                }}
              >Siguiente →</button>
            </div>
          )}
          </>
        ) : (
          <div style={{
            textAlign: "center",
            padding: "3rem",
            color: "#999",
            fontSize: "1.1rem"
          }}>
            ❌ No se encontraron clientes
          </div>
        )}
    </div>
  );
}

function StatCard({ titulo, valor, color }) {
  return (
    <div style={{
      background: `${color}12`,
      border: `1px solid ${color}30`,
      padding: "20px 22px",
      borderRadius: "14px",
      transition: "transform 0.2s",
      cursor: "default",
    }}
    onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; }}
    onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8, fontFamily:'Inter,sans-serif' }}>{titulo}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color: '#fff', fontFamily:'Inter,sans-serif', letterSpacing: '-0.02em' }}>{valor}</div>
    </div>
  );
}

function ActionButton({ label, color, onClick }) {
  // Map color to rgba equivalent for ghost style
  return (
    <button onClick={onClick} style={{
      flex: "1 1 auto",
      minWidth: "100px",
      padding: "9px 16px",
      background: `${color}14`,
      color: color,
      border: `1px solid ${color}40`,
      borderRadius: "9px",
      cursor: "pointer",
      fontWeight: "700",
      fontSize: "12.5px",
      fontFamily: "Inter,sans-serif",
      transition: "all 0.18s",
      width: "auto",
      margin: 0,
    }}
    onMouseOver={(e) => { e.currentTarget.style.background = `${color}22`; e.currentTarget.style.transform = "translateY(-1px)"; }}
    onMouseOut={(e) => { e.currentTarget.style.background = `${color}14`; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {label}
    </button>
  );
}
