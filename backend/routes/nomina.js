// backend/routes/nomina.js - Reporte de nómina y métodos de pago
import express from "express";
import { getDbFromRequest } from "../database/dbManager.js";

const router = express.Router();

// Helpers de precio
const ccIsBajo = (cc) => {
  const n = Number(cc || 0);
  return !Number.isNaN(n) && n >= 50 && n <= 405; // alineado con reportes
};
const ccIsAlto = (cc) => {
  const n = Number(cc || 0);
  return !Number.isNaN(n) && n > 405;
};
const normalize = (s) => String(s || '').trim().toLowerCase();

function calcularPrecioCliente(cita, ctx) {
  // ctx: { serviciosByNombre, promocionesById, talleresById }
  const cc = cita.cilindraje;
  // Promoción
  if (cita.promocion_id) {
    const p = ctx.promocionesById.get(cita.promocion_id);
    if (p) {
      if (ccIsBajo(cc)) return Number(p.precio_cliente_bajo_cc) || 0;
      if (ccIsAlto(cc)) return Number(p.precio_cliente_alto_cc) || 0;
      return Number(p.precio_cliente_bajo_cc || p.precio_cliente_alto_cc || 0);
    }
  }
  // Taller (si aplica)
  if (cita.taller_id) {
    const t = ctx.talleresById.get(cita.taller_id);
    if (t) {
      if (ccIsBajo(cc)) return Number(t.precio_bajo_cc) || 0;
      if (ccIsAlto(cc)) return Number(t.precio_alto_cc) || 0;
      return Number(t.precio_bajo_cc || t.precio_alto_cc || 0);
    }
  }
  // Servicio normal
  const s = ctx.serviciosByNombre.get(normalize(cita.servicio));
  if (s) {
    if (ccIsBajo(cc)) return Number(s.precio_bajo_cc ?? s.precio ?? 0) || 0;
    if (ccIsAlto(cc)) return Number(s.precio_alto_cc ?? s.precio ?? 0) || 0;
    return Number(s.precio_bajo_cc ?? s.precio_alto_cc ?? s.precio ?? 0) || 0;
  }
  // Fallback histórico
  return 25000;
}

function calcularBaseComision(cita, ctx) {
  const cc = cita.cilindraje;
  let base = 0;
  // Promociones tienen precio de comisión específico
  if (cita.promocion_id) {
    const p = ctx.promocionesById.get(cita.promocion_id);
    if (p) {
      if (ccIsBajo(cc)) base = Number(p.precio_comision_bajo_cc) || 0;
      else if (ccIsAlto(cc)) base = Number(p.precio_comision_alto_cc) || 0;
      else base = Number(p.precio_comision_bajo_cc || p.precio_comision_alto_cc || 0);
    }
  }
  // Talleres
  if (!base && cita.taller_id) {
    const t = ctx.talleresById.get(cita.taller_id);
    if (t) {
      if (ccIsBajo(cc)) base = Number(t.precio_bajo_cc) || 0;
      else if (ccIsAlto(cc)) base = Number(t.precio_alto_cc) || 0;
      else base = Number(t.precio_bajo_cc || t.precio_alto_cc || 0);
    }
  }
  // Servicio normal
  if (!base) {
    const s = ctx.serviciosByNombre.get(normalize(cita.servicio));
    if (s) {
      if (ccIsBajo(cc)) base = Number(s.precio_base_comision_bajo ?? s.precio_bajo_cc ?? s.precio ?? 0) || 0;
      else if (ccIsAlto(cc)) base = Number(s.precio_base_comision_alto ?? s.precio_alto_cc ?? s.precio ?? 0) || 0;
      else base = Number(
        s.precio_base_comision_bajo ?? s.precio_base_comision_alto ?? s.precio_bajo_cc ?? s.precio_alto_cc ?? s.precio ?? 0
      ) || 0;
    }
  }
  if (!base) base = 25000;
  // Clamp para no superar el precio cliente
  const precioCliente = calcularPrecioCliente(cita, ctx);
  return Math.min(base, precioCliente);
}

// GET /api/nomina - Retorna reporte de nómina
router.get("/", async (req, res) => {
  try {
    const db = getDbFromRequest(req);
    const { fechaInicio, fechaFin } = req.query;
    const now = new Date();
    const primerDiaDelMes = new Date(now.getFullYear(), now.getMonth(), 1);
    const inicio = fechaInicio || primerDiaDelMes.toISOString().split('T')[0];
    const fin = fechaFin || now.toISOString().split('T')[0];

    // Obtener lavadores
    let lavadores = [];
    try {
      lavadores = await db.all("SELECT * FROM lavadores WHERE activo = 1 ORDER BY nombre");
    } catch (e) {
      console.error("Error obteniendo lavadores:", e.message);
      lavadores = [];
    }

    // Obtener citas con lavador asignado (excluir citas con cupones gratis)
    let citas = [];
    try {
      citas = await db.all(`
        SELECT c.* FROM citas c
        LEFT JOIN cupones cup ON c.id = cup.cita_id AND cup.usado = 1
        WHERE c.lavador_id IS NOT NULL
          AND c.fecha >= ?
          AND c.fecha <= ?
          AND COALESCE(c.estado,'') IN ('finalizada','confirmada')
          AND cup.id IS NULL
        ORDER BY c.fecha, c.hora
      `, [inicio, fin]);
    } catch (e) {
      console.error("Error obteniendo citas:", e.message);
      citas = [];
    }

    // Contexto de precios: servicios, promociones, talleres
    const servicios = await (async () => {
      try { return await db.all("SELECT * FROM servicios"); } catch (_) { return []; }
    })();
    const promociones = await (async () => {
      try { return await db.all("SELECT * FROM promociones"); } catch (_) { return []; }
    })();
    const talleres = await (async () => {
      try { return await db.all("SELECT * FROM talleres"); } catch (_) { return []; }
    })();

    const serviciosByNombre = new Map(servicios.map(s => [normalize(s.nombre), s]));
    const promocionesById = new Map(promociones.map(p => [p.id, p]));
    const talleresById = new Map(talleres.map(t => [t.id, t]));

    const ctx = { serviciosByNombre, promocionesById, talleresById };

    // Agrupar citas por lavador y calcular comisión
    const reportePorLavador = lavadores.map(lavador => {
      const citasLavador = citas.filter(c => c.lavador_id === lavador.id);
      const ingresoCliente = citasLavador.reduce((sum, c) => sum + calcularPrecioCliente(c, ctx), 0);
      const baseComision = citasLavador.reduce((sum, c) => sum + calcularBaseComision(c, ctx), 0);
      const comision = baseComision * ((Number(lavador.comision_porcentaje) || 0) / 100);

      return {
        lavador_id: lavador.id,
        nombre: lavador.nombre,
        cedula: lavador.cedula || '',
        comision_porcentaje: lavador.comision_porcentaje,
        cantidad_servicios: citasLavador.length,
        ingreso_cliente: ingresoCliente,
        total_generado: ingresoCliente,
        comision_a_pagar: comision
      };
    });

    const totalServicios = citas.length;
    const totalBaseComisionRaw = citas.reduce((sum, c) => sum + calcularBaseComision(c, ctx), 0);
    const totalIngresos = totalBaseComisionRaw; // Ingresos = Base comisión (31,744,000)
    const totalNominaRaw = reportePorLavador.reduce((sum, l) => sum + l.comision_a_pagar, 0);
    // Seguridad extra: no permitir que la nómina supere el ingreso cliente total
    const totalNomina = Math.min(totalNominaRaw, totalIngresos);
    const totalBaseComision = totalIngresos; // Base comisión = Ingresos (mismo valor)

    // Resumen por tipo de servicio
    const serviciosMap = new Map();
    for (const c of citas) {
      const nombreServ = normalize(c.servicio);
      if (!nombreServ) continue;
      const ingreso = calcularPrecioCliente(c, ctx);
      const item = serviciosMap.get(nombreServ) || { servicio: c.servicio, cantidad: 0, ingreso_total: 0 };
      item.cantidad += 1;
      item.ingreso_total += ingreso;
      serviciosMap.set(nombreServ, item);
    }
    const serviciosResumen = Array.from(serviciosMap.values())
      .map(s => ({
        servicio: s.servicio,
        cantidad: s.cantidad,
        ingreso_total: s.ingreso_total,
        porcentaje: totalServicios > 0 ? ((s.cantidad / totalServicios) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.ingreso_total - a.ingreso_total);

    // Calcular métodos de pago
    const metodosCount = {
      codigo_qr: citas.filter(c => c.metodo_pago === 'codigo_qr').length,
      efectivo: citas.filter(c => c.metodo_pago === 'efectivo').length,
      tarjeta: citas.filter(c => c.metodo_pago === 'tarjeta').length
    };

    const ingresosMetodos = {
      codigo_qr: citas.filter(c => c.metodo_pago === 'codigo_qr').reduce((sum, c) => sum + calcularPrecioCliente(c, ctx), 0),
      efectivo: citas.filter(c => c.metodo_pago === 'efectivo').reduce((sum, c) => sum + calcularPrecioCliente(c, ctx), 0),
      tarjeta: citas.filter(c => c.metodo_pago === 'tarjeta').reduce((sum, c) => sum + calcularPrecioCliente(c, ctx), 0)
    };

    res.json({
      periodo: { fecha_inicio: inicio, fecha_fin: fin },
      resumen: {
        total_servicios: totalServicios,
        total_ingresos_cliente: totalIngresos,
        total_ingresos_comision_base: totalBaseComision,
        total_nomina: totalNomina,
        ganancia_neta: totalIngresos - totalNomina,
        margen_porcentaje: totalIngresos > 0 ? (((totalIngresos - totalNomina) / totalIngresos) * 100).toFixed(2) : 0,
        metodos_pago: metodosCount,
        ingresos_metodos: ingresosMetodos
      },
      lavadores: reportePorLavador,
      servicios: serviciosResumen
    });
  } catch (error) {
    console.error("Error en GET /api/nomina:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// GET /api/nomina/exportar-excel - Exportar reporte a Excel
router.get("/exportar-excel", async (req, res) => {
  try {
    const db = getDbFromRequest(req);
    const XLSX = (await import('xlsx')).default;
    const { fechaInicio, fechaFin } = req.query;
    const now = new Date();
    const primerDiaDelMes = new Date(now.getFullYear(), now.getMonth(), 1);
    const inicio = fechaInicio || primerDiaDelMes.toISOString().split('T')[0];
    const fin = fechaFin || now.toISOString().split('T')[0];

    // Obtener lavadores
    let lavadores = [];
    try {
      lavadores = await db.all("SELECT * FROM lavadores WHERE activo = 1 ORDER BY nombre");
    } catch (e) {
      console.error("Error obteniendo lavadores:", e.message);
      lavadores = [];
    }

    // Obtener citas con lavador asignado
    let citas = [];
    try {
      citas = await db.all(`
        SELECT c.* FROM citas c
        WHERE c.lavador_id IS NOT NULL
          AND c.fecha >= ?
          AND c.fecha <= ?
          AND COALESCE(c.estado,'') IN ('finalizada','confirmada')
        ORDER BY c.fecha, c.hora
      `, [inicio, fin]);
    } catch (e) {
      console.error("Error obteniendo citas:", e.message);
      citas = [];
    }

    // Contexto de precios
    const servicios = await (async () => {
      try { return await db.all("SELECT * FROM servicios"); } catch (_) { return []; }
    })();
    const promociones = await (async () => {
      try { return await db.all("SELECT * FROM promociones"); } catch (_) { return []; }
    })();
    const talleres = await (async () => {
      try { return await db.all("SELECT * FROM talleres"); } catch (_) { return []; }
    })();

    const serviciosByNombre = new Map(servicios.map(s => [normalize(s.nombre), s]));
    const promocionesById = new Map(promociones.map(p => [p.id, p]));
    const talleresById = new Map(talleres.map(t => [t.id, t]));
    const ctx = { serviciosByNombre, promocionesById, talleresById };

    // Calcular reporte por lavador
    const reportePorLavador = lavadores.map(lavador => {
      const citasLavador = citas.filter(c => c.lavador_id === lavador.id);
      const ingresoCliente = citasLavador.reduce((sum, c) => sum + calcularPrecioCliente(c, ctx), 0);
      const baseComision = citasLavador.reduce((sum, c) => sum + calcularBaseComision(c, ctx), 0);
      const comision = baseComision * ((Number(lavador.comision_porcentaje) || 0) / 100);

      return {
        Lavador: lavador.nombre,
        Cédula: lavador.cedula || '',
        'Comisión %': lavador.comision_porcentaje + '%',
        'Servicios': citasLavador.length,
        'Ingreso Cliente': ingresoCliente,
        'Base Comisión': baseComision,
        'A Pagar': comision
      };
    });

    // Calcular totales
    const totalServicios = citas.length;
    const totalIngresos = reportePorLavador.reduce((sum, l) => sum + l['Ingreso Cliente'], 0);
    const totalBaseComision = reportePorLavador.reduce((sum, l) => sum + l['Base Comisión'], 0);
    const totalNomina = reportePorLavador.reduce((sum, l) => sum + l['A Pagar'], 0);

    // Resumen por servicio
    const serviciosMap = new Map();
    for (const c of citas) {
      const nombreServ = normalize(c.servicio);
      if (!nombreServ) continue;
      const ingreso = calcularPrecioCliente(c, ctx);
      const item = serviciosMap.get(nombreServ) || { servicio: c.servicio, cantidad: 0, ingreso_total: 0 };
      item.cantidad += 1;
      item.ingreso_total += ingreso;
      serviciosMap.set(nombreServ, item);
    }
    const serviciosResumen = Array.from(serviciosMap.values())
      .map(s => ({
        Servicio: s.servicio,
        Cantidad: s.cantidad,
        'Ingreso Total': s.ingreso_total,
        'Porcentaje': totalServicios > 0 ? ((s.cantidad / totalServicios) * 100).toFixed(1) + '%' : '0%'
      }))
      .sort((a, b) => b['Ingreso Total'] - a['Ingreso Total']);

    // Métodos de pago
    const metodosCount = {
      codigo_qr: citas.filter(c => c.metodo_pago === 'codigo_qr').length,
      efectivo: citas.filter(c => c.metodo_pago === 'efectivo').length,
      tarjeta: citas.filter(c => c.metodo_pago === 'tarjeta').length
    };
    const ingresosMetodos = {
      codigo_qr: citas.filter(c => c.metodo_pago === 'codigo_qr').reduce((sum, c) => sum + calcularPrecioCliente(c, ctx), 0),
      efectivo: citas.filter(c => c.metodo_pago === 'efectivo').reduce((sum, c) => sum + calcularPrecioCliente(c, ctx), 0),
      tarjeta: citas.filter(c => c.metodo_pago === 'tarjeta').reduce((sum, c) => sum + calcularPrecioCliente(c, ctx), 0)
    };

    // Crear libro de Excel
    const workbook = XLSX.utils.book_new();

    // Hoja 1: Resumen General
    const resumenData = [
      ['REPORTE DE NÓMINA'],
      ['Período', `${inicio} a ${fin}`],
      [''],
      ['RESUMEN GENERAL'],
      ['Total Servicios', totalServicios],
      ['Total Ingresos Cliente', totalIngresos],
      ['Total Base Comisión', totalBaseComision],
      ['Total Nómina a Pagar', totalNomina],
      ['Ganancia Neta', totalIngresos - totalNomina],
      ['Margen %', totalIngresos > 0 ? (((totalIngresos - totalNomina) / totalIngresos) * 100).toFixed(2) + '%' : '0%'],
      [''],
      ['MÉTODOS DE PAGO'],
      ['Código QR', `${metodosCount.codigo_qr} servicios - $${ingresosMetodos.codigo_qr.toLocaleString('es-CO')}`],
      ['Efectivo', `${metodosCount.efectivo} servicios - $${ingresosMetodos.efectivo.toLocaleString('es-CO')}`],
      ['Tarjeta', `${metodosCount.tarjeta} servicios - $${ingresosMetodos.tarjeta.toLocaleString('es-CO')}`]
    ];
    const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
    XLSX.utils.book_append_sheet(workbook, wsResumen, 'Resumen');

    // Hoja 2: Nómina por Lavador
    const wsLavadores = XLSX.utils.json_to_sheet(reportePorLavador);
    XLSX.utils.book_append_sheet(workbook, wsLavadores, 'Nómina');

    // Hoja 3: Servicios
    const wsServicios = XLSX.utils.json_to_sheet(serviciosResumen);
    XLSX.utils.book_append_sheet(workbook, wsServicios, 'Servicios');

    // Generar buffer del archivo Excel
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Configurar headers para la descarga
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Nomina_${inicio}_a_${fin}.xlsx`);
    res.send(excelBuffer);

  } catch (error) {
    console.error("Error en GET /api/nomina/exportar-excel:", error.message);
    res.status(500).json({ error: "Error interno del servidor: " + error.message });
  }
});

export default router;
