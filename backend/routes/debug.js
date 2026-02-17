// backend/routes/debug.js - Endpoint temporal para debug de diferencias
import express from "express";
import { getDbFromRequest } from "../database/dbManager.js";

const router = express.Router();

const ccIsBajo = (cc) => {
  const n = Number(cc || 0);
  return !Number.isNaN(n) && n >= 50 && n <= 405;
};
const ccIsAlto = (cc) => {
  const n = Number(cc || 0);
  return !Number.isNaN(n) && n > 405;
};
const normalize = (s) => String(s || '').trim().toLowerCase();

function calcularPrecioCliente(cita, ctx) {
  const cc = cita.cilindraje;
  if (cita.promocion_id) {
    const p = ctx.promocionesById.get(cita.promocion_id);
    if (p) {
      if (ccIsBajo(cc)) return Number(p.precio_cliente_bajo_cc) || 0;
      if (ccIsAlto(cc)) return Number(p.precio_cliente_alto_cc) || 0;
      return Number(p.precio_cliente_bajo_cc || p.precio_cliente_alto_cc || 0);
    }
  }
  if (cita.taller_id) {
    const t = ctx.talleresById.get(cita.taller_id);
    if (t) {
      if (ccIsBajo(cc)) return Number(t.precio_bajo_cc) || 0;
      if (ccIsAlto(cc)) return Number(t.precio_alto_cc) || 0;
      return Number(t.precio_bajo_cc || t.precio_alto_cc || 0);
    }
  }
  const s = ctx.serviciosByNombre.get(normalize(cita.servicio));
  if (s) {
    if (ccIsBajo(cc)) return Number(s.precio_bajo_cc ?? s.precio ?? 0) || 0;
    if (ccIsAlto(cc)) return Number(s.precio_alto_cc ?? s.precio ?? 0) || 0;
    return Number(s.precio_bajo_cc ?? s.precio_alto_cc ?? s.precio ?? 0) || 0;
  }
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

router.get("/comparar-ingresos", async (req, res) => {
  try {
    const db = getDbFromRequest(req);
    const { desde, hasta } = req.query;
    if (!desde || !hasta) {
      return res.status(400).json({ error: "Faltan parámetros desde/hasta" });
    }

    // Contexto
    const servicios = await db.all("SELECT * FROM servicios").catch(() => []);
    const promociones = await db.all("SELECT * FROM promociones").catch(() => []);
    const talleres = await db.all("SELECT * FROM talleres").catch(() => []);
    
    const serviciosByNombre = new Map(servicios.map(s => [normalize(s.nombre), s]));
    const promocionesById = new Map(promociones.map(p => [p.id, p]));
    const talleresById = new Map(talleres.map(t => [t.id, t]));
    const ctx = { serviciosByNombre, promocionesById, talleresById };

    // Query NÓMINA (con COALESCE)
    const citasNomina = await db.all(`
      SELECT c.* FROM citas c
      WHERE c.lavador_id IS NOT NULL
        AND c.fecha >= ?
        AND c.fecha <= ?
        AND COALESCE(c.estado,'') IN ('finalizada','confirmada')
      ORDER BY c.fecha, c.hora
    `, [desde, hasta]);

    // Query FINANZAS (con COALESCE también)
    const citasFinanzas = await db.all(`
      SELECT c.* FROM citas c 
      WHERE c.lavador_id IS NOT NULL 
        AND c.fecha >= ? 
        AND c.fecha <= ? 
        AND COALESCE(c.estado,'') IN ('finalizada','confirmada') 
      ORDER BY c.fecha, c.hora
    `, [desde, hasta]);

    const ingresoNomina = citasNomina.reduce((sum, c) => sum + calcularBaseComision(c, ctx), 0);
    const ingresoFinanzas = citasFinanzas.reduce((sum, c) => sum + calcularPrecioCliente(c, ctx), 0);

    // Detalle por cita
    const detalleNomina = citasNomina.map(c => ({
      id: c.id,
      fecha: c.fecha,
      hora: c.hora,
      cliente: c.cliente,
      servicio: c.servicio,
      cilindraje: c.cilindraje,
      estado: c.estado,
      lavador_id: c.lavador_id,
      promocion_id: c.promocion_id,
      taller_id: c.taller_id,
      precio_calculado: calcularBaseComision(c, ctx)
    }));

    const detalleFinanzas = citasFinanzas.map(c => ({
      id: c.id,
      fecha: c.fecha,
      hora: c.hora,
      cliente: c.cliente,
      servicio: c.servicio,
      cilindraje: c.cilindraje,
      estado: c.estado,
      lavador_id: c.lavador_id,
      promocion_id: c.promocion_id,
      taller_id: c.taller_id,
      precio_calculado: calcularPrecioCliente(c, ctx)
    }));

    res.json({
      periodo: { desde, hasta },
      nomina: {
        cantidad_citas: citasNomina.length,
        ingreso_total: ingresoNomina,
        detalle: detalleNomina
      },
      finanzas: {
        cantidad_citas: citasFinanzas.length,
        ingreso_total: ingresoFinanzas,
        detalle: detalleFinanzas
      },
      diferencia: {
        cantidad: citasNomina.length - citasFinanzas.length,
        monto: ingresoNomina - ingresoFinanzas
      }
    });
  } catch (error) {
    console.error("Error en debug:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
