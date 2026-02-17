// Frontend/src/components/admin/ProductosManagement.jsx
import { useState, useEffect } from 'react';
import { 
  obtenerProductos, 
  crearProducto, 
  actualizarProducto, 
  eliminarProducto,
  registrarVenta,
  obtenerReporteDiario,
  eliminarVenta,
  obtenerReporteGanancias 
} from '../../services/productosService';
import './ProductosManagement.css';

export default function ProductosManagement() {
  const [productos, setProductos] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [activeTab, setActiveTab] = useState('ventas');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [loadingReporte, setLoadingReporte] = useState(false);
  
  // Form para crear/editar producto
  const [formProducto, setFormProducto] = useState({
    nombre: '',
    precio_compra: '',
    precio_venta: '',
    stock: 0
  });
  const [editingId, setEditingId] = useState(null);

  // Form para registrar venta
  const [formVenta, setFormVenta] = useState({
    producto_id: '',
    cantidad: 1,
    metodo_pago: 'efectivo'
  });

  // Obtener fecha actual en Colombia de forma SIMPLE
  const obtenerFechaColombia = () => {
    const hoy = new Date();
    const opciones = { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' };
    const fechaFormateada = hoy.toLocaleDateString('en-CA', opciones); // en-CA da formato YYYY-MM-DD
    console.log('📅 Fecha Colombia:', fechaFormateada, 'Hora local:', hoy.toLocaleString('es-CO', opciones));
    return fechaFormateada;
  };

  // Filtro de fecha para reportes (fecha de Colombia)
  const [filtroFecha, setFiltroFecha] = useState(obtenerFechaColombia());

  // Filtro de rango para reportes agregados
  const todayStr = new Date().toISOString().split('T')[0];
  const firstOfMonthStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const [desde, setDesde] = useState(firstOfMonthStr);
  const [hasta, setHasta] = useState(todayStr);
  const [reporteGanancias, setReporteGanancias] = useState([]);

  // Debug: mostrar token en consola
  useEffect(() => {
    const token = localStorage.getItem("motobombon_token");
    const isAdmin = localStorage.getItem("motobombon_is_admin");
    console.log("🔐 Token:", token ? "✅ Existe" : "❌ NO EXISTE");
    console.log("👤 Is Admin:", isAdmin);
    if (!token) {
      setMessage("⚠️ No hay sesión activa. Por favor, vuelve a hacer login.");
    } else {
      cargarProductos();
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'ventas') {
      cargarVentas();
    }
    if (activeTab === 'reportes') {
      cargarReporteGanancias();
    }
  }, [activeTab, filtroFecha]);

  const cargarProductos = async () => {
    try {
      setLoading(true);
      const data = await obtenerProductos();
      setProductos(data);
      setMessage('');
    } catch (error) {
      setMessage(`❌ Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const cargarVentas = async () => {
    try {
      setLoading(true);
      const data = await obtenerReporteDiario(filtroFecha);
      setVentas(data.ventas || []);
      setMessage('');
    } catch (error) {
      setMessage(`❌ Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitProducto = async (e) => {
    e.preventDefault();

    if (!formProducto.nombre || !formProducto.precio_compra || !formProducto.precio_venta) {
      setMessage('❌ Completa todos los campos');
      return;
    }

    if (parseFloat(formProducto.precio_venta) < parseFloat(formProducto.precio_compra)) {
      setMessage('❌ El precio de venta debe ser mayor o igual al de compra');
      return;
    }

    try {
      setLoading(true);
      
      if (editingId) {
        await actualizarProducto(editingId, formProducto);
        setMessage('✅ Producto actualizado');
        setEditingId(null);
      } else {
        await crearProducto(formProducto);
        setMessage('✅ Producto creado');
      }

      setFormProducto({
        nombre: '',
        precio_compra: '',
        precio_venta: '',
        stock: 0
      });
      
      await cargarProductos();
    } catch (error) {
      setMessage(`❌ Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditarProducto = (producto) => {
    setFormProducto({
      nombre: producto.nombre,
      precio_compra: producto.precio_compra,
      precio_venta: producto.precio_venta,
      stock: producto.stock
    });
    setEditingId(producto.id);
  };

  const handleEliminarProducto = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este producto?')) return;

    try {
      setLoading(true);
      await eliminarProducto(id);
      setMessage('✅ Producto eliminado');
      await cargarProductos();
    } catch (error) {
      setMessage(`❌ Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrarVenta = async (e) => {
    e.preventDefault();

    if (!formVenta.producto_id || !formVenta.cantidad || formVenta.cantidad <= 0) {
      setMessage('❌ Selecciona producto y cantidad válida');
      return;
    }

    try {
      setLoading(true);
      const producto = productos.find(p => p.id === parseInt(formVenta.producto_id));
      
      if (producto.stock < formVenta.cantidad) {
        setMessage(`❌ Stock insuficiente. Stock disponible: ${producto.stock}`);
        return;
      }

      await registrarVenta(formVenta.producto_id, formVenta.cantidad, formVenta.metodo_pago);
      setMessage('✅ Venta registrada');
      setFormVenta({ producto_id: '', cantidad: 1, metodo_pago: 'efectivo' });
      await cargarProductos();
      await cargarVentas();
    } catch (error) {
      setMessage(`❌ Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelarEdicion = () => {
    setEditingId(null);
    setFormProducto({
      nombre: '',
      precio_compra: '',
      precio_venta: '',
      stock: 0
    });
  };

  const calcularGanancia = (venta) => {
    return (venta.precio_unitario - venta.precio_compra) * venta.cantidad;
  };

  const calcularGananciaTotal = () => {
    return ventas.reduce((sum, v) => sum + calcularGanancia(v), 0);
  };

  const calcularVentasTotal = () => {
    return ventas.reduce((sum, v) => sum + v.total, 0);
  };

  const cargarReporteGanancias = async () => {
    try {
      setLoadingReporte(true);
      const data = await obtenerReporteGanancias(desde, hasta);
      setReporteGanancias(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage(`❌ Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoadingReporte(false);
    }
  };

  const totalesRango = () => {
    const totalVentasRango = reporteGanancias.reduce((sum, r) => sum + (Number(r.total_ventas) || 0), 0);
    const gananciaNetaRango = reporteGanancias.reduce((sum, r) => sum + (Number(r.ganancia_neta) || 0), 0);
    const cantidadVentasRango = reporteGanancias.reduce((sum, r) => sum + (Number(r.cantidad_ventas) || 0), 0);
    return { totalVentasRango, gananciaNetaRango, cantidadVentasRango };
  };

  const formatearFechaLegible = (fechaISO) => {
    // Convierte YYYY-MM-DD a DD/MM/YYYY
    const [year, month, day] = fechaISO.split('-');
    return `${day}/${month}/${year}`;
  };

  const handleEliminarVenta = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta venta?')) return;

    try {
      setLoading(true);
      await eliminarVenta(id);
      setMessage('✅ Venta eliminada');
      await cargarProductos();
      await cargarVentas();
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatearFechaHora = (fechaString) => {
    // El servidor ahora está en zona horaria Colombia, las fechas vienen correctas
    const fecha = new Date(fechaString);
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const anio = fecha.getFullYear();
    const horas = fecha.getHours().toString().padStart(2, '0');
    const minutos = fecha.getMinutes().toString().padStart(2, '0');
    const segundos = fecha.getSeconds().toString().padStart(2, '0');
    
    return `${dia}/${mes}/${anio} ${horas}:${minutos}:${segundos}`;
  };

  return (
    <div className="productos-management">
      <h2>📦 Gestión de Productos y Ventas</h2>

      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'ventas' ? 'active' : ''}`}
          onClick={() => setActiveTab('ventas')}
        >
          💰 Registrar Venta
        </button>
        <button 
          className={`tab ${activeTab === 'productos' ? 'active' : ''}`}
          onClick={() => setActiveTab('productos')}
        >
          📦 Productos
        </button>
        <button 
          className={`tab ${activeTab === 'reportes' ? 'active' : ''}`}
          onClick={() => setActiveTab('reportes')}
        >
          📊 Reportes
        </button>
      </div>

      {loading && <p className="loading">Cargando...</p>}

      {/* TAB: PRODUCTOS */}
      {activeTab === 'productos' && (
        <div className="tab-content">
          <div className="form-section">
            <h3>{editingId ? '✏️ Editar Producto' : '➕ Nuevo Producto'}</h3>
            <form onSubmit={handleSubmitProducto}>
              <input
                type="text"
                placeholder="Nombre del producto"
                value={formProducto.nombre}
                onChange={(e) => setFormProducto({...formProducto, nombre: e.target.value})}
                disabled={editingId !== null}
              />
              
              <div className="input-group">
                <input
                  type="number"
                  placeholder="Precio de compra"
                  value={formProducto.precio_compra}
                  onChange={(e) => setFormProducto({...formProducto, precio_compra: e.target.value})}
                  step="0.01"
                />
                <input
                  type="number"
                  placeholder="Precio de venta"
                  value={formProducto.precio_venta}
                  onChange={(e) => setFormProducto({...formProducto, precio_venta: e.target.value})}
                  step="0.01"
                />
              </div>

              <input
                type="number"
                placeholder="Stock"
                value={formProducto.stock}
                onChange={(e) => setFormProducto({...formProducto, stock: e.target.value})}
              />

              <div className="button-group">
                <button type="submit" className="btn-primary">
                  {editingId ? 'Actualizar' : 'Crear'}
                </button>
                {editingId && (
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={handleCancelarEdicion}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="products-list">
            <h3>Productos registrados</h3>
            {productos.length === 0 ? (
              <p>No hay productos registrados</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Precio Compra</th>
                    <th>Precio Venta</th>
                    <th>Margen</th>
                    <th>Stock</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map(producto => (
                    <tr key={producto.id}>
                      <td>{producto.nombre}</td>
                      <td>
                        {producto.precio_compra != null
                          ? `$${Number(producto.precio_compra).toLocaleString()}`
                          : '—'}
                      </td>
                      <td>
                        {producto.precio_venta != null
                          ? `$${Number(producto.precio_venta).toLocaleString()}`
                          : '—'}
                      </td>
                      <td>
                        {(producto.precio_compra != null && Number(producto.precio_compra) > 0 && producto.precio_venta != null)
                          ? `${(((Number(producto.precio_venta) - Number(producto.precio_compra)) / Number(producto.precio_compra)) * 100).toFixed(1)}%`
                          : '—'}
                      </td>
                      <td>{producto.stock}</td>
                      <td>
                        <button 
                          className="btn-edit"
                          onClick={() => handleEditarProducto(producto)}
                        >
                          ✏️
                        </button>
                        <button 
                          className="btn-delete"
                          onClick={() => handleEliminarProducto(producto.id)}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB: REGISTRAR VENTA */}
      {activeTab === 'ventas' && (
        <div className="tab-content">
          <div className="form-section">
            <h3>💳 Registrar Nueva Venta</h3>
            <form onSubmit={handleRegistrarVenta}>
              <select
                value={formVenta.producto_id}
                onChange={(e) => setFormVenta({...formVenta, producto_id: e.target.value})}
              >
                <option value="">Selecciona un producto</option>
                {productos.map(producto => (
                  <option key={producto.id} value={producto.id}>
                    {producto.nombre} - Stock: {producto.stock}
                  </option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Cantidad"
                value={formVenta.cantidad}
                onChange={(e) => setFormVenta({...formVenta, cantidad: parseInt(e.target.value) || 0})}
                min="1"
              />

              <select
                value={formVenta.metodo_pago}
                onChange={(e) => setFormVenta({...formVenta, metodo_pago: e.target.value})}
              >
                <option value="efectivo">💵 Efectivo</option>
                <option value="qr">📱 Código QR</option>
              </select>

              <button type="submit" className="btn-primary">
                Registrar Venta
              </button>
            </form>
          </div>

          <div className="sales-list">
            <h3>Ventas del día {formatearFechaLegible(filtroFecha)}</h3>
            <input 
              type="date" 
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              className="date-filter"
            />
            
            {ventas.length === 0 ? (
              <p>No hay ventas registradas para este día</p>
            ) : (
              <>
                <table>
                  <thead>
                    <tr>
                      <th>Hora</th>
                      <th>Producto</th>
                      <th>Cantidad</th>
                      <th>Precio Unitario</th>
                      <th>Total</th>
                      <th>Método Pago</th>
                      <th>Ganancia</th>
                      <th>Registrado por</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventas.map(venta => (
                      <tr key={venta.id}>
                        <td>{formatearFechaHora(venta.created_at)}</td>
                        <td>{venta.producto}</td>
                        <td>{venta.cantidad}</td>
                        <td>${venta.precio_unitario.toLocaleString()}</td>
                        <td>${venta.total.toLocaleString()}</td>
                        <td>{venta.metodo_pago === 'qr' ? '📱 QR' : '💵 Efectivo'}</td>
                        <td className="ganancia">${calcularGanancia(venta).toLocaleString()}</td>
                        <td>{venta.registrado_por}</td>
                        <td>
                          <button 
                            className="btn-delete"
                            onClick={() => handleEliminarVenta(venta.id)}
                            title="Eliminar venta"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <div className="resumen">
                  <div className="resumen-item">
                    <strong>Total Ventas:</strong> ${calcularVentasTotal().toLocaleString()}
                  </div>
                  <div className="resumen-item">
                    <strong>Ganancia Neta:</strong> ${calcularGananciaTotal().toLocaleString()}
                  </div>
                  <div className="resumen-item">
                    <strong>Cantidad de ventas:</strong> {ventas.length}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB: REPORTES */}
      {activeTab === 'reportes' && (
        <div className="tab-content">
          <h3>📊 Reportes de Ventas</h3>
          <p className="info-text">
            Usa el rango para ver totales que cuadran con Finanzas.
          </p>

          <div className="form-section" style={{marginBottom: '1rem'}}>
            <div className="input-group">
              <input
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
              />
              <input
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
              />
              <button className="btn-primary" type="button" onClick={cargarReporteGanancias}>
                Actualizar
              </button>
            </div>
          </div>

          {loadingReporte ? (
            <p className="loading">Cargando reporte...</p>
          ) : (
            <>
              <div className="resumen" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '1rem'}}>
                {(() => {
                  const { totalVentasRango, gananciaNetaRango, cantidadVentasRango } = totalesRango();
                  return (
                    <>
                      <div className="resumen-item"><strong>Total Ventas (rango):</strong> ${totalVentasRango.toLocaleString()}</div>
                      <div className="resumen-item"><strong>Ganancia Neta (rango):</strong> ${gananciaNetaRango.toLocaleString()}</div>
                      <div className="resumen-item"><strong>Cantidad de ventas:</strong> {cantidadVentasRango}</div>
                    </>
                  );
                })()}
              </div>

              {reporteGanancias.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Cantidad Ventas</th>
                      <th>Total Ventas</th>
                      <th>Ganancia Neta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reporteGanancias.map((r, idx) => (
                      <tr key={idx}>
                        <td>{r.fecha}</td>
                        <td>{r.cantidad_ventas}</td>
                        <td>${Number(r.total_ventas || 0).toLocaleString()}</td>
                        <td className="ganancia">${Number(r.ganancia_neta || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No hay ventas en el rango seleccionado</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
