// src/components/admin/NominaManager.jsx
import { useState, useEffect } from 'react';
import { fetchWithSucursal } from '../../services/apiHelper.js';

const NominaManager = () => {
  const [reporteNomina, setReporteNomina] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fechaInicio, setFechaInicio] = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    cargarReporte();
  }, [fechaInicio, fechaFin]);

  const cargarReporte = async () => {
    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || '';
      const res = await fetchWithSucursal(`${API_URL}/api/nomina?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
      const data = await res.json();
      setReporteNomina(data);
    } catch (error) {
      console.error('Error al cargar reporte:', error);
      alert('Error al cargar el reporte de nómina');
    } finally {
      setLoading(false);
    }
  };

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor);
  };

  const exportarExcel = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const url = `${API_URL}/api/nomina/exportar-excel?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
      
      const response = await fetchWithSucursal(url);
      const blob = await response.blob();
      
      // Crear un enlace temporal para descargar el archivo
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `Nomina_${fechaInicio}_a_${fechaFin}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
    } catch (error) {
      console.error('Error al exportar Excel:', error);
      alert('Error al exportar el archivo Excel');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ 
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #EB0463',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          animation: 'spin 1s linear infinite',
          margin: '0 auto'
        }}></div>
        <p style={{ marginTop: '20px', color: '#666' }}>Cargando reporte financiero...</p>
      </div>
    );
  }

  if (!reporteNomina) {
    return <div>No hay datos disponibles</div>;
  }

  const { resumen, lavadores, servicios } = reporteNomina;
  const totalIngresosCliente = resumen.total_ingresos_cliente ?? resumen.total_ingresos ?? 0;
  const totalIngresosComisionBase = resumen.total_ingresos_comision_base ?? resumen.total_ingresos ?? 0;

  return (
    <div style={{ padding: '20px' }}>
      {/* Filtros */}
      <div style={{ 
        background: 'rgba(255,255,255,0.03)',
        padding: '20px',
        borderRadius: '14px',
        marginBottom: '24px',
        border: '1px solid rgba(255,255,255,0.07)'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', fontFamily:'Inter,sans-serif', textTransform:'uppercase', letterSpacing:'0.06em' }}>Rango de fechas</h3>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontWeight: '600', fontSize: 13, color: 'rgba(255,255,255,0.5)', fontFamily:'Inter,sans-serif' }}>Desde:</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              style={{
                padding: '9px 12px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.1)',
                fontSize: '13px',
                fontWeight: '500',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                cursor: 'pointer',
                outline: 'none',
                fontFamily:'Inter,sans-serif',
                colorScheme: 'dark',
              }}
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontWeight: '600', fontSize: 13, color: 'rgba(255,255,255,0.5)', fontFamily:'Inter,sans-serif' }}>Hasta:</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              style={{
                padding: '9px 12px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.1)',
                fontSize: '13px',
                fontWeight: '500',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                cursor: 'pointer',
                outline: 'none',
                fontFamily:'Inter,sans-serif',
                colorScheme: 'dark',
              }}
            />
          </div>

          <button
            onClick={exportarExcel}
            style={{
              marginLeft: 'auto', display:'flex', alignItems:'center', gap:6,
              padding: '9px 18px', borderRadius: 10,
              border: '1px solid rgba(16,185,129,0.35)', background: 'rgba(16,185,129,0.1)',
              color: '#10b981', fontWeight: 700, fontSize: 13, cursor: 'pointer',
              fontFamily:'Inter,sans-serif', whiteSpace: 'nowrap', width:'auto', margin:'0 0 0 auto',
            }}
          >
            📊 Exportar Excel
          </button>
        </div>
      </div>

      {/* Dashboard de Resumen */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '16px',
        marginBottom: '32px'
      }}>
        {[
          { label: 'Ingreso real del cliente', value: formatearMoneda(totalIngresosCliente), sub: `${resumen.total_servicios} servicios · Base: ${formatearMoneda(totalIngresosComisionBase)}`, color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
          { label: 'Total Nómina', value: formatearMoneda(resumen.total_nomina), sub: 'A pagar a lavadores', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
          { label: 'Ganancia Neta', value: formatearMoneda(resumen.ganancia_neta), sub: `Margen: ${resumen.margen_porcentaje}%`, color: '#EB0463', bg: 'rgba(235,4,99,0.08)', border: 'rgba(235,4,99,0.2)' },
        ].map(k => (
          <div key={k.label} style={{ background: k.bg, border: `1px solid ${k.border}`, borderRadius: 14, padding: '20px 22px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: k.color, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8, fontFamily:'Inter,sans-serif' }}>{k.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', fontFamily:'Inter,sans-serif', letterSpacing: '-0.02em', marginBottom: 6 }}>{k.value}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily:'Inter,sans-serif' }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Métodos de Pago */}
      <div style={{
        background: 'rgba(255,255,255,0.025)',
        borderRadius: '14px',
        padding: '22px',
        marginBottom: '24px',
        border: '1px solid rgba(255,255,255,0.07)'
      }}>
        <h2 style={{ margin: '0 0 18px 0', fontSize: '15px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', fontFamily:'Inter,sans-serif', textTransform:'uppercase', letterSpacing:'0.06em' }}>
          Métodos de Pago · {fechaInicio} – {fechaFin}
        </h2>

        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px'}}>
          {(() => {
            // Fallback seguros si el backend aún no tiene estos campos
            const metodos = resumen.metodos_pago || { codigo_qr: 0, efectivo: 0, tarjeta: 0 };
            const ingresos = resumen.ingresos_metodos || { codigo_qr: 0, efectivo: 0, tarjeta: 0 };
            return (
              <>
                <div style={{padding: '16px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)', textAlign: 'center'}}>
                  <div style={{fontSize: '28px', marginBottom: '8px'}}>📱</div>
                  <div style={{fontSize: '22px', fontWeight: 'bold', color: '#3b82f6'}}>{metodos.codigo_qr}</div>
                  <div style={{fontSize: '12px', color: '#6b7280', marginTop: '4px'}}>Código QR</div>
                  <div style={{fontSize: '12px', color: '#3b82f6', fontWeight: '600', marginTop: '8px'}}>{formatearMoneda(ingresos.codigo_qr)}</div>
                </div>
                <div style={{padding: '16px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)', textAlign: 'center'}}>
                  <div style={{fontSize: '28px', marginBottom: '8px'}}>💵</div>
                  <div style={{fontSize: '22px', fontWeight: 'bold', color: '#10b981'}}>{metodos.efectivo}</div>
                  <div style={{fontSize: '12px', color: '#6b7280', marginTop: '4px'}}>Efectivo</div>
                  <div style={{fontSize: '12px', color: '#10b981', fontWeight: '600', marginTop: '8px'}}>{formatearMoneda(ingresos.efectivo)}</div>
                </div>
                <div style={{padding: '16px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.2)', textAlign: 'center'}}>
                  <div style={{fontSize: '28px', marginBottom: '8px'}}>💳</div>
                  <div style={{fontSize: '22px', fontWeight: 'bold', color: '#8b5cf6'}}>{metodos.tarjeta}</div>
                  <div style={{fontSize: '12px', color: '#6b7280', marginTop: '4px'}}>Tarjeta</div>
                  <div style={{fontSize: '12px', color: '#8b5cf6', fontWeight: '600', marginTop: '8px'}}>{formatearMoneda(ingresos.tarjeta)}</div>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Tabla de Nómina por Lavador */}
      <div style={{
        background: 'rgba(255,255,255,0.025)',
        borderRadius: '14px',
        padding: '22px',
        marginBottom: '24px',
        border: '1px solid rgba(255,255,255,0.07)'
      }}>
        <h2 style={{ margin: '0 0 18px 0', fontSize: '15px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', fontFamily:'Inter,sans-serif', textTransform:'uppercase', letterSpacing:'0.06em' }}>
          Reporte de Nómina · {fechaInicio} – {fechaFin}
        </h2>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily:'Inter,sans-serif' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.07em' }}>Lavador</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.07em' }}>Cédula</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.07em' }}>Servicios</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.07em' }}>Ingreso cliente</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.07em' }}>Base comisión</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.07em' }}>% Comisión</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.07em' }}>A Pagar</th>
              </tr>
            </thead>
            <tbody>
              {lavadores.map((lavador, idx) => (
                <tr key={lavador.lavador_id} style={{
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}
                >
                  <td style={{ padding: '12px', fontWeight: '600', color: '#fff', fontSize: 13, fontFamily:'Inter,sans-serif' }}>{lavador.nombre}</td>
                  <td style={{ padding: '12px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{lavador.cedula || 'N/A'}</td>
                  <td style={{ padding: '12px', textAlign: 'center', color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>{lavador.cantidad_servicios}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: '500', color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
                    {formatearMoneda(lavador.ingreso_cliente)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: '500', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                    {formatearMoneda(lavador.total_generado)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', color: '#10b981', fontWeight: 'bold', fontSize: 13 }}>
                    {lavador.comision_porcentaje}%
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontSize: '15px', fontWeight: 'bold', color: '#EB0463' }}>
                    {formatearMoneda(lavador.comision_a_pagar)}
                  </td>
                </tr>
              ))}
              <tr style={{ borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(235,4,99,0.06)', fontWeight: 'bold', fontSize: '14px' }}>
                <td colSpan="2" style={{ padding: '14px 12px', color: '#fff', fontFamily:'Inter,sans-serif', fontWeight: 800 }}>TOTAL</td>
                <td style={{ padding: '14px 12px', textAlign: 'center', color: '#fff' }}>{resumen.total_servicios}</td>
                <td style={{ padding: '14px 12px', textAlign: 'right', color: '#fff' }}>{formatearMoneda(totalIngresosCliente)}</td>
                <td style={{ padding: '14px 12px', textAlign: 'right', color: 'rgba(255,255,255,0.4)' }}>{formatearMoneda(totalIngresosComisionBase)}</td>
                <td style={{ padding: '14px 12px' }}></td>
                <td style={{ padding: '14px 12px', textAlign: 'right', color: '#EB0463', fontSize: 16 }}>{formatearMoneda(resumen.total_nomina)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Servicios */}
      <div style={{
        background: 'rgba(255,255,255,0.025)',
        borderRadius: '14px',
        padding: '22px',
        border: '1px solid rgba(255,255,255,0.07)'
      }}>
        <h2 style={{ margin: '0 0 18px 0', fontSize: '15px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', fontFamily:'Inter,sans-serif', textTransform:'uppercase', letterSpacing:'0.06em' }}>
          Ingresos por Tipo de Servicio
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          {servicios.map((servicio, idx) => (
            <div key={idx} style={{
              background: 'rgba(235,4,99,0.06)',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid rgba(235,4,99,0.15)'
            }}>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginBottom: '6px', fontFamily:'Inter,sans-serif', textTransform:'uppercase', letterSpacing:'0.05em' }}>{servicio.servicio}</div>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#fff', fontFamily:'Inter,sans-serif', letterSpacing:'-0.01em' }}>
                {formatearMoneda(servicio.ingreso_total)}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '6px', fontFamily:'Inter,sans-serif' }}>
                {servicio.cantidad} servicios ({servicio.porcentaje}%)
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NominaManager;
