// Frontend/src/components/admin/FinanzasManager.jsx
import { useState, useEffect } from "react";
import { getDashboard, getGastos, crearGasto, actualizarGasto, eliminarGasto, getMovimientos } from "../../services/finanzasService";
import { fetchWithSucursal, getHeaders } from "../../services/apiHelper.js";
import "./FinanzasManager.css";

export default function FinanzasManager() {
  const [dashboard, setDashboard] = useState(null);
  const [gastos, setGastos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabActiva, setTabActiva] = useState("dashboard");
  
  // Formulario
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formData, setFormData] = useState({
    tipo: "fijo",
    categoria: "alquiler",
    descripcion: "",
    monto: "",
    fecha: new Date().toISOString().split('T')[0],
    metodo_pago: "efectivo",
    estado: "completado",
    notas: ""
  });

  // Filtros (mes/año o rango)
  const [mes, setMes] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [anio, setAnio] = useState(new Date().getFullYear().toString());
  const todayStr = new Date().toISOString().split('T')[0];
  const firstOfMonthStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const [desde, setDesde] = useState(firstOfMonthStr);
  const [hasta, setHasta] = useState(todayStr);

  // Efecto para actualizar desde/hasta cuando cambia mes/anio
  useEffect(() => {
    const mesNum = parseInt(mes, 10);
    const anioNum = parseInt(anio, 10);
    
    // Primer día del mes seleccionado
    const primerDia = new Date(anioNum, mesNum - 1, 1).toISOString().split('T')[0];
    
    // Último día del mes seleccionado
    const ultimoDia = new Date(anioNum, mesNum, 0).toISOString().split('T')[0];
    
    setDesde(primerDia);
    setHasta(ultimoDia);
  }, [mes, anio]);

  useEffect(() => {
    cargarDatos();
  }, [mes, anio, desde, hasta]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [dashData, gastosData, movData] = await Promise.all([
        getDashboard(mes, anio, desde, hasta),
        getGastos({ desde, hasta }),
        getMovimientos(mes, anio, desde, hasta)
      ]);
      setDashboard(dashData);
      setGastos(gastosData);
      setMovimientos(movData);
    } catch (error) {
      console.error("Error cargando datos:", error);
      alert("Error cargando datos financieros");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editandoId) {
        await actualizarGasto(editandoId, formData);
      } else {
        await crearGasto(formData);
      }
      setMostrarForm(false);
      setEditandoId(null);
      resetForm();
      cargarDatos();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleEditar = (gasto) => {
    setFormData({
      tipo: gasto.tipo,
      categoria: gasto.categoria,
      descripcion: gasto.descripcion,
      monto: gasto.monto,
      fecha: gasto.fecha,
      metodo_pago: gasto.metodo_pago || "efectivo",
      estado: gasto.estado,
      notas: gasto.notas || ""
    });
    setEditandoId(gasto.id);
    setMostrarForm(true);
  };

  const handleEliminar = async (id) => {
    if (!confirm("¿Eliminar este gasto?")) return;
    try {
      await eliminarGasto(id);
      cargarDatos();
    } catch (error) {
      alert(error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      tipo: "fijo",
      categoria: "alquiler",
      descripcion: "",
      monto: "",
      fecha: new Date().toISOString().split('T')[0],
      metodo_pago: "efectivo",
      estado: "completado",
      notas: ""
    });
  };

  const exportarExcel = async () => {
    try {
      const params = new URLSearchParams({ mes, anio, desde, hasta });
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetchWithSucursal(`${baseUrl}/api/finanzas/exportar-excel?${params}`, {
        method: 'GET',
        headers: getHeaders()
      });
      if (!response.ok) throw new Error('Error descargando archivo');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finanzas_${anio}-${mes.padStart(2, '0')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      alert('Error descargando archivo: ' + error.message);
    }
  };

  const formatMoney = (value) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
  };

  if (loading) return <div style={{padding: "2rem", color: "#fff"}}>Cargando...</div>;

  return (
    <div className="finanzas-container">
      <h1>💰 Finanzas</h1>

      {/* Selector de periodo */}
      <div className="periodo-selector">
        <select value={mes} onChange={(e) => setMes(e.target.value)}>
          {Array.from({length: 12}, (_, i) => i + 1).map(m => (
            <option key={m} value={m.toString().padStart(2, '0')}>{m.toString().padStart(2, '0')}</option>
          ))}
        </select>
        <select value={anio} onChange={(e) => setAnio(e.target.value)}>
          {[2024, 2025, 2026, 2027].map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        <button className="btn-actualizar" onClick={cargarDatos}>Actualizar</button>
        <button className="btn-exportar" onClick={exportarExcel}>📊 Exportar</button>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button className={`tab-button ${tabActiva === "dashboard" ? "active" : ""}`} onClick={() => setTabActiva("dashboard")}>
          Dashboard
        </button>
        <button className={`tab-button ${tabActiva === "gastos" ? "active" : ""}`} onClick={() => setTabActiva("gastos")}>
          Gastos
        </button>
        <button className={`tab-button ${tabActiva === "movimientos" ? "active" : ""}`} onClick={() => setTabActiva("movimientos")}>
          Movimientos
        </button>
      </div>

      {/* TAB DASHBOARD */}
      {tabActiva === "dashboard" && dashboard && (
        <div>
          <div className="dashboard-grid">
            <div className="dashboard-card card-ingresos">
              <h3>Total Ingresos</h3>
              <p>{formatMoney(dashboard.ingresos.total)}</p>
              <small>Servicios: {formatMoney(dashboard.ingresos.servicios)}</small>
              <small>Productos: {formatMoney(dashboard.ingresos.productos)}</small>
            </div>
            <div className="dashboard-card card-gastos">
              <h3>Total Gastos</h3>
              <p>{formatMoney(dashboard.gastos.total)}</p>
              <small>Manuales: {formatMoney(dashboard.gastos.manuales)}</small>
              <small>Comisiones: {formatMoney(dashboard.gastos.comisiones)}</small>
            </div>
            <div className={`dashboard-card ${dashboard.utilidadNeta >= 0 ? "card-utilidad" : "card-utilidad negative"}`}>
              <h3>Utilidad Neta (Acumulada)</h3>
              <p>{formatMoney(dashboard.utilidadNeta)}</p>
              <small>Mes actual: {formatMoney(dashboard.utilidadMesActual || 0)}</small>
              <small>Meses anteriores: {formatMoney(dashboard.utilidadMesAnterior || 0)}</small>
            </div>
          </div>

          {/* Gastos por categoría */}
          {dashboard.gastos.porCategoria.length > 0 && (
            <div className="gastos-categoria">
              <h3>Gastos por Categoría</h3>
              {dashboard.gastos.porCategoria.map(cat => (
                <div key={cat.categoria} className="gastos-categoria-item">
                  <span>{cat.categoria}</span>
                  <span>{formatMoney(cat.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB GASTOS */}
      {tabActiva === "gastos" && (
        <div>
          <button onClick={() => { setMostrarForm(!mostrarForm); setEditandoId(null); resetForm(); }} style={{padding: "0.75rem 1.5rem", background: "#43e97b", color: "#000", border: "none", borderRadius: "4px", cursor: "pointer", marginBottom: "1rem", fontWeight: "bold"}}>
            {mostrarForm ? "Cancelar" : "+ Nuevo Gasto"}
          </button>

          {/* Formulario */}
          {mostrarForm && (
            <form onSubmit={handleSubmit} style={{background: "#1a1a1a", padding: "1.5rem", borderRadius: "8px", marginBottom: "1.5rem"}}>
              <h3 style={{color: "#fff", marginTop: 0}}>{editandoId ? "Editar Gasto" : "Nuevo Gasto"}</h3>
              <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem"}}>
                <div>
                  <label style={{color: "#fff", display: "block", marginBottom: "0.5rem"}}>Tipo</label>
                  <select value={formData.tipo} onChange={(e) => setFormData({...formData, tipo: e.target.value})} style={{width: "100%", padding: "0.5rem", background: "#0a0a0a", color: "#fff", border: "1px solid #333", borderRadius: "4px"}} required>
                    <option value="fijo">Fijo</option>
                    <option value="variable">Variable</option>
                    <option value="nomina">Nómina</option>
                    <option value="dotacion">Dotación</option>
                    <option value="prestamo">Préstamo</option>
                    <option value="compra">Compra Inventario</option>
                  </select>
                </div>
                <div>
                  <label style={{color: "#fff", display: "block", marginBottom: "0.5rem"}}>Categoría</label>
                  <select value={formData.categoria} onChange={(e) => setFormData({...formData, categoria: e.target.value})} style={{width: "100%", padding: "0.5rem", background: "#0a0a0a", color: "#fff", border: "1px solid #333", borderRadius: "4px"}} required>
                    <option value="alquiler">Alquiler</option>
                    <option value="servicios">Servicios (agua, luz, internet)</option>
                    <option value="salarios">Salarios</option>
                    <option value="comisiones">Comisiones</option>
                    <option value="mantenimiento">Mantenimiento</option>
                    <option value="publicidad">Publicidad</option>
                    <option value="dotacion">Dotación</option>
                    <option value="prestamo">Préstamo</option>
                    <option value="productos">Productos</option>
                    <option value="insumos">Insumos</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label style={{color: "#fff", display: "block", marginBottom: "0.5rem"}}>Monto</label>
                  <input type="number" value={formData.monto} onChange={(e) => setFormData({...formData, monto: e.target.value})} style={{width: "100%", padding: "0.5rem", background: "#0a0a0a", color: "#fff", border: "1px solid #333", borderRadius: "4px"}} required />
                </div>
                <div>
                  <label style={{color: "#fff", display: "block", marginBottom: "0.5rem"}}>Fecha</label>
                  <input type="date" value={formData.fecha} onChange={(e) => setFormData({...formData, fecha: e.target.value})} style={{width: "100%", padding: "0.5rem", background: "#0a0a0a", color: "#fff", border: "1px solid #333", borderRadius: "4px"}} required />
                </div>
                <div>
                  <label style={{color: "#fff", display: "block", marginBottom: "0.5rem"}}>Método Pago</label>
                  <select value={formData.metodo_pago} onChange={(e) => setFormData({...formData, metodo_pago: e.target.value})} style={{width: "100%", padding: "0.5rem", background: "#0a0a0a", color: "#fff", border: "1px solid #333", borderRadius: "4px"}}>
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="tarjeta">Tarjeta</option>
                  </select>
                </div>
                <div>
                  <label style={{color: "#fff", display: "block", marginBottom: "0.5rem"}}>Estado</label>
                  <select value={formData.estado} onChange={(e) => setFormData({...formData, estado: e.target.value})} style={{width: "100%", padding: "0.5rem", background: "#0a0a0a", color: "#fff", border: "1px solid #333", borderRadius: "4px"}}>
                    <option value="completado">Completado</option>
                    <option value="pendiente">Pendiente</option>
                  </select>
                </div>
              </div>
              <div style={{marginTop: "1rem"}}>
                <label style={{color: "#fff", display: "block", marginBottom: "0.5rem"}}>Descripción</label>
                <input type="text" value={formData.descripcion} onChange={(e) => setFormData({...formData, descripcion: e.target.value})} style={{width: "100%", padding: "0.5rem", background: "#0a0a0a", color: "#fff", border: "1px solid #333", borderRadius: "4px"}} required />
              </div>
              <div style={{marginTop: "1rem"}}>
                <label style={{color: "#fff", display: "block", marginBottom: "0.5rem"}}>Notas</label>
                <textarea value={formData.notas} onChange={(e) => setFormData({...formData, notas: e.target.value})} style={{width: "100%", padding: "0.5rem", background: "#0a0a0a", color: "#fff", border: "1px solid #333", borderRadius: "4px", minHeight: "60px"}} />
              </div>
              <button type="submit" style={{marginTop: "1rem", padding: "0.75rem 1.5rem", background: "#EB0463", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold"}}>
                {editandoId ? "Actualizar" : "Guardar"}
              </button>
            </form>
          )}

          {/* Tabla de gastos */}
          <div style={{overflowX: "auto"}}>
            <table style={{width: "100%", borderCollapse: "collapse", background: "#1a1a1a"}}>
              <thead>
                <tr style={{borderBottom: "2px solid #333"}}>
                  <th style={{padding: "1rem", textAlign: "left", color: "#fff"}}>Fecha</th>
                  <th style={{padding: "1rem", textAlign: "left", color: "#fff"}}>Tipo</th>
                  <th style={{padding: "1rem", textAlign: "left", color: "#fff"}}>Categoría</th>
                  <th style={{padding: "1rem", textAlign: "left", color: "#fff"}}>Descripción</th>
                  <th style={{padding: "1rem", textAlign: "right", color: "#fff"}}>Monto</th>
                  <th style={{padding: "1rem", textAlign: "center", color: "#fff"}}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {gastos.map(gasto => (
                  <tr key={gasto.id} style={{borderBottom: "1px solid #333"}}>
                    <td style={{padding: "1rem", color: "#fff"}}>{gasto.fecha}</td>
                    <td style={{padding: "1rem", color: "#fff"}}>{gasto.tipo}</td>
                    <td style={{padding: "1rem", color: "#fff"}}>{gasto.categoria}</td>
                    <td style={{padding: "1rem", color: "#fff"}}>{gasto.descripcion}</td>
                    <td style={{padding: "1rem", textAlign: "right", color: "#f5576c", fontWeight: "bold"}}>{formatMoney(gasto.monto)}</td>
                    <td style={{padding: "1rem", textAlign: "center"}}>
                      <button onClick={() => handleEditar(gasto)} style={{padding: "0.25rem 0.5rem", background: "#43e97b", color: "#000", border: "none", borderRadius: "3px", cursor: "pointer", marginRight: "0.5rem", fontSize: "10px"}}>Editar</button>
                      <button onClick={() => handleEliminar(gasto.id)} style={{padding: "0.25rem 0.5rem", background: "#f5576c", color: "#fff", border: "none", borderRadius: "3px", cursor: "pointer", fontSize: "10px"}}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB MOVIMIENTOS */}
      {tabActiva === "movimientos" && (
        <div style={{overflowX: "auto"}}>
          <table style={{width: "100%", borderCollapse: "collapse", background: "#1a1a1a"}}>
            <thead>
              <tr style={{borderBottom: "2px solid #333"}}>
                <th style={{padding: "1rem", textAlign: "left", color: "#fff"}}>Fecha</th>
                <th style={{padding: "1rem", textAlign: "left", color: "#fff"}}>Tipo</th>
                <th style={{padding: "1rem", textAlign: "left", color: "#fff"}}>Categoría</th>
                <th style={{padding: "1rem", textAlign: "left", color: "#fff"}}>Descripción</th>
                <th style={{padding: "1rem", textAlign: "right", color: "#fff"}}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map((mov, idx) => (
                <tr key={idx} style={{borderBottom: "1px solid #333"}}>
                  <td style={{padding: "1rem", color: "#fff"}}>{mov.fecha}</td>
                  <td style={{padding: "1rem", color: mov.tipo === 'ingreso' ? "#43e97b" : "#f5576c", fontWeight: "bold"}}>{mov.tipo}</td>
                  <td style={{padding: "1rem", color: "#fff"}}>{mov.categoria}</td>
                  <td style={{padding: "1rem", color: "#fff"}}>{mov.descripcion}</td>
                  <td style={{padding: "1rem", textAlign: "right", color: mov.tipo === 'ingreso' ? "#43e97b" : "#f5576c", fontWeight: "bold"}}>
                    {mov.tipo === 'ingreso' ? '+' : '-'}{formatMoney(mov.monto)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
