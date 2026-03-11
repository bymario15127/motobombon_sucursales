// src/components/admin/Dashboard.jsx
import { useState, useEffect } from "react";
import { format } from 'date-fns';
import { getCitas } from "../../services/citasService";
import serviciosService from "../../services/serviciosService";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, Label } from 'recharts';

export default function Dashboard({ setActiveView }) {
  const [citas, setCitas] = useState([]);
  const [serviciosCount, setServiciosCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    nuevas: 0,
    confirmadas: 0,
    enCurso: 0,
    finalizadas: 0,
    hoy: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [data, servicios] = await Promise.all([
        getCitas().catch(() => []),
        serviciosService.getServicios().catch(() => [])
      ]);

      setCitas(Array.isArray(data) ? data : []);
      setServiciosCount(servicios.length || 0);

      const hoyKey = format(new Date(), 'yyyy-MM-dd');
      const citasArray = Array.isArray(data) ? data : [];
      const stats = {
        total: citasArray.length,
        nuevas: citasArray.filter(c => c.estado === 'pendiente').length,
        confirmadas: citasArray.filter(c => c.estado === 'confirmada').length,
        enCurso: citasArray.filter(c => c.estado === 'en curso').length,
        finalizadas: citasArray.filter(c => c.estado === 'finalizada').length,
        hoy: citasArray.filter(c => c.fecha === hoyKey).length
      };

      setStats(stats);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (fecha, hora) => {
    try {
      const d = fecha?.split('-');
      if (!d || d.length !== 3) return `${fecha} ${hora || ''}`.trim();
      const date = new Date(Number(d[0]), Number(d[1]) - 1, Number(d[2]));
      const diaMes = format(date, 'dd/MM');
      return `${diaMes} ${hora || ''}`.trim();
    } catch {
      return `${fecha} ${hora || ''}`.trim();
    }
  };

  const citasRecientes = citas.slice(0, 5);

  // Datos para gráfico de torta (distribución por estado)
  const chartData = [
    { name: 'Pendiente', key: 'pendiente', value: stats.nuevas },
    { name: 'Confirmada', key: 'confirmada', value: stats.confirmadas },
    { name: 'En curso', key: 'en curso', value: stats.enCurso },
    { name: 'Finalizada', key: 'finalizada', value: stats.finalizadas },
    { name: 'Cancelada', key: 'cancelada', value: citas.filter(c => c.estado === 'cancelada').length },
  ].filter(d => d.value > 0);

  // Datos para gráfico de métodos de pago
  const paymentMethodStats = {
    qr: citas.filter(c => c.metodo_pago === 'codigo_qr').length,
    efectivo: citas.filter(c => c.metodo_pago === 'efectivo').length,
    tarjeta: citas.filter(c => c.metodo_pago === 'tarjeta').length,
    sinRegistrar: citas.filter(c => !c.metodo_pago).length
  };

  const paymentChartData = [
    { name: 'Código QR', value: paymentMethodStats.qr, icon: '📱' },
    { name: 'Efectivo', value: paymentMethodStats.efectivo, icon: '💵' },
    { name: 'Tarjeta', value: paymentMethodStats.tarjeta, icon: '💳' }
  ].filter(d => d.value > 0);

  const COLORS = {
    pendiente: '#f59e0b', // amarillo
    confirmada: '#10b981', // verde
    'en curso': '#3b82f6', // azul
    finalizada: '#8b5cf6', // morado
    cancelada: '#ef4444', // rojo
  };

  const pieColors = chartData.map(d => COLORS[d.key]);

  return (
    <div className="space-y-6">
      {/* Único bloque: Gráfico de torta bonito + chips */}
      <div className="card" style={{ marginTop: 16 }}>
        <h3 className="admin-card-title" style={{ textAlign: 'left', marginBottom: 16 }}>Distribución por estado</h3>
        {stats.total === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h3>No hay datos suficientes</h3>
            <p>Cuando registres citas, verás la distribución aquí</p>
          </div>
        ) : (
          <div style={{ width: '100%', height: 360 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart width={400} height={360}>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="45%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={2}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index]} />
                  ))}
                  <Label value={`${stats.total}`} position="center" fill="#ffffff" fontSize={22} fontWeight={700} />
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} />
                <Legend verticalAlign="middle" align="right" layout="vertical" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Chips de conteo por estado debajo del gráfico */}
        <div className="chips">
          <span className="chip chip-yellow">Pendientes: {stats.nuevas}</span>
          <span className="chip chip-green">Confirmadas: {stats.confirmadas}</span>
          <span className="chip chip-blue">En curso: {stats.enCurso}</span>
          <span className="chip chip-purple">Finalizadas: {stats.finalizadas}</span>
          <span className="chip chip-red">Canceladas: {citas.filter(c => c.estado === 'cancelada').length}</span>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="card">
        <h3 className="card-title" style={{ textAlign: 'left', marginBottom: 16 }}>💰 Métodos de Pago</h3>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px'}}>
          <div style={{padding: '16px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)', textAlign: 'center'}}>
            <div style={{fontSize: '28px', marginBottom: '8px'}}>📱</div>
            <div style={{fontSize: '24px', fontWeight: 'bold', color: '#3b82f6'}}>{paymentMethodStats.qr}</div>
            <div style={{fontSize: '12px', color: '#6b7280', marginTop: '4px'}}>Código QR</div>
          </div>
          <div style={{padding: '16px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)', textAlign: 'center'}}>
            <div style={{fontSize: '28px', marginBottom: '8px'}}>💵</div>
            <div style={{fontSize: '24px', fontWeight: 'bold', color: '#10b981'}}>{paymentMethodStats.efectivo}</div>
            <div style={{fontSize: '12px', color: '#6b7280', marginTop: '4px'}}>Efectivo</div>
          </div>
          <div style={{padding: '16px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.2)', textAlign: 'center'}}>
            <div style={{fontSize: '28px', marginBottom: '8px'}}>💳</div>
            <div style={{fontSize: '24px', fontWeight: 'bold', color: '#8b5cf6'}}>{paymentMethodStats.tarjeta}</div>
            <div style={{fontSize: '12px', color: '#6b7280', marginTop: '4px'}}>Tarjeta</div>
          </div>
          {paymentMethodStats.sinRegistrar > 0 && (
            <div style={{padding: '16px', background: 'linear-gradient(135deg, rgba(107, 114, 128, 0.1) 0%, rgba(107, 114, 128, 0.05) 100%)', borderRadius: '12px', border: '1px solid rgba(107, 114, 128, 0.2)', textAlign: 'center'}}>
              <div style={{fontSize: '28px', marginBottom: '8px'}}>❓</div>
              <div style={{fontSize: '24px', fontWeight: 'bold', color: '#6b7280'}}>{paymentMethodStats.sinRegistrar}</div>
              <div style={{fontSize: '12px', color: '#6b7280', marginTop: '4px'}}>Sin registrar</div>
            </div>
          )}
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="card">
        <h3 className="admin-card-title" style={{ textAlign: 'left', marginBottom: 16 }}>⚡ Acciones Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center space-x-3 p-4 bg-gradient-to-r from-[#EB0463] to-[#ff1a75] text-white rounded-lg hover:shadow-lg transition-all"
            onClick={() => setActiveView && setActiveView('appointments')}>
            <span className="text-2xl">➕</span>
            <span className="font-medium">Nueva Cita</span>
          </button>
          
          <button className="flex items-center space-x-3 p-4 bg-gradient-to-r from-[#EB0463] to-[#ff1a75] text-white rounded-lg hover:shadow-lg transition-all"
            onClick={() => setActiveView && setActiveView('calendar')}>
            <span className="text-2xl">📅</span>
            <span className="font-medium">Ver Calendario</span>
          </button>
          
          <button className="flex items-center space-x-3 p-4 bg-gradient-to-r from-[#EB0463] to-[#ff1a75] text-white rounded-lg hover:shadow-lg transition-all"
            onClick={() => setActiveView && setActiveView('services')}>
            <span className="text-2xl">🏍️</span>
            <span className="font-medium">Gestionar Servicios</span>
          </button>
        </div>
      </div>
    </div>
  );
}