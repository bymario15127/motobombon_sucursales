// backend/routes/finanzas.js
import express from "express";
import { getDbFromRequest } from "../database/dbManager.js";
import { verifyToken, requireAdminOrSupervisor } from "../middleware/auth.js";
import ExcelJS from "exceljs";

const router = express.Router();

// GET - Dashboard financiero (resumen general)
router.get("/dashboard", verifyToken, requireAdminOrSupervisor, async (req, res) => {
  try {
    const db = getDbFromRequest(req);
    const { mes, anio, desde, hasta } = req.query;
    
    // Si no se especifica mes/año, usar el actual
    const fecha = new Date();
    const mesActual = mes || (fecha.getMonth() + 1).toString().padStart(2, '0');
    const anioActual = anio || fecha.getFullYear().toString();
    
    // Ingresos por productos
    let ingresosProductos;
    if (desde && hasta) {
      ingresosProductos = await db.get(
        `SELECT COALESCE(SUM(total), 0) as total FROM ventas WHERE DATE(created_at) >= ? AND DATE(created_at) <= ?`,
        [desde, hasta]
      );
    } else {
      ingresosProductos = await db.get(
        `SELECT COALESCE(SUM(total), 0) as total FROM ventas WHERE strftime('%Y-%m', created_at) = ?`,
        [`${anioActual}-${mesActual}`]
      );
    }

    // Gastos del mes (solo gastos manuales)
    let totalGastos;
    if (desde && hasta) {
      totalGastos = await db.get(
        `SELECT COALESCE(SUM(monto), 0) as total FROM gastos WHERE fecha >= ? AND fecha <= ?`,
        [desde, hasta]
      );
    } else {
      totalGastos = await db.get(
        `SELECT COALESCE(SUM(monto), 0) as total FROM gastos WHERE strftime('%Y-%m', fecha) = ?`,
        [`${anioActual}-${mesActual}`]
      );
    }

    // Gastos por categoría
    let gastosPorCategoria;
    if (desde && hasta) {
      gastosPorCategoria = await db.all(
        `SELECT categoria, SUM(monto) as total FROM gastos WHERE fecha >= ? AND fecha <= ? GROUP BY categoria ORDER BY total DESC`,
        [desde, hasta]
      );
    } else {
      gastosPorCategoria = await db.all(
        `SELECT categoria, SUM(monto) as total FROM gastos WHERE strftime('%Y-%m', fecha) = ? GROUP BY categoria ORDER BY total DESC`,
        [`${anioActual}-${mesActual}`]
      );
    }

    // Calcular comisiones de lavadores automáticamente
    const servicios = await db.all("SELECT * FROM servicios");
    const promociones = await db.all("SELECT * FROM promociones").catch(() => []);
    const talleres = await db.all("SELECT * FROM talleres").catch(() => []);
    const lavadores = await db.all("SELECT * FROM lavadores WHERE activo = 1");
    let citas;
    if (desde && hasta) {
      citas = await db.all(
        `SELECT c.* FROM citas c 
         LEFT JOIN cupones cup ON c.id = cup.cita_id AND cup.usado = 1
         WHERE c.lavador_id IS NOT NULL 
           AND c.fecha >= ? AND c.fecha <= ? 
           AND COALESCE(c.estado,'') IN ('finalizada','confirmada')
           AND cup.id IS NULL
         ORDER BY c.fecha, c.hora`,
        [desde, hasta]
      );
    } else {
      citas = await db.all(
        `SELECT c.* FROM citas c 
         LEFT JOIN cupones cup ON c.id = cup.cita_id AND cup.usado = 1
         WHERE c.lavador_id IS NOT NULL 
           AND strftime('%Y-%m', c.fecha) = ? 
           AND COALESCE(c.estado,'') IN ('finalizada', 'confirmada')
           AND cup.id IS NULL
         ORDER BY c.fecha, c.hora`,
        [`${anioActual}-${mesActual}`]
      );
    }

    const serviciosByNombre = new Map(servicios.map(s => [String(s.nombre || '').trim().toLowerCase(), s]));
    const promocionesById = new Map(promociones.map(p => [p.id, p]));
    const talleresById = new Map(talleres.map(t => [t.id, t]));

    const ccIsBajo = (cc) => {
      const n = Number(cc || 0);
      return !Number.isNaN(n) && n >= 50 && n <= 405;
    };
    const ccIsAlto = (cc) => {
      const n = Number(cc || 0);
      return !Number.isNaN(n) && n > 405;
    };
    const normalize = (s) => String(s || '').trim().toLowerCase();

    // Función para calcular precio cliente (mismo cálculo que nómina)
    const calcularPrecioCliente = (cita) => {
      const cc = cita.cilindraje;
      if (cita.promocion_id) {
        const p = promocionesById.get(cita.promocion_id);
        if (p) {
          if (ccIsBajo(cc)) return Number(p.precio_cliente_bajo_cc) || 0;
          if (ccIsAlto(cc)) return Number(p.precio_cliente_alto_cc) || 0;
          return Number(p.precio_cliente_bajo_cc || p.precio_cliente_alto_cc || 0);
        }
      }
      if (cita.taller_id) {
        const t = talleresById.get(cita.taller_id);
        if (t) {
          if (ccIsBajo(cc)) return Number(t.precio_bajo_cc) || 0;
          if (ccIsAlto(cc)) return Number(t.precio_alto_cc) || 0;
          return Number(t.precio_bajo_cc || t.precio_alto_cc || 0);
        }
      }
      const s = serviciosByNombre.get(normalize(cita.servicio));
      if (s) {
        if (ccIsBajo(cc)) return Number(s.precio_bajo_cc ?? s.precio ?? 0) || 0;
        if (ccIsAlto(cc)) return Number(s.precio_alto_cc ?? s.precio ?? 0) || 0;
        return Number(s.precio_bajo_cc ?? s.precio_alto_cc ?? s.precio ?? 0) || 0;
      }
      return 25000;
    };

    // Función para calcular base de comisión
    const calcularBaseComision = (cita) => {
          const cc = cita.cilindraje;
          let base = 0;
          if (cita.promocion_id) {
            const p = promocionesById.get(cita.promocion_id);
            if (p) {
              if (ccIsBajo(cc)) base = Number(p.precio_comision_bajo_cc) || 0;
              else if (ccIsAlto(cc)) base = Number(p.precio_comision_alto_cc) || 0;
              else base = Number(p.precio_comision_bajo_cc || p.precio_comision_alto_cc || 0);
            }
          }
          if (!base && cita.taller_id) {
            const t = talleresById.get(cita.taller_id);
            if (t) {
              if (ccIsBajo(cc)) base = Number(t.precio_bajo_cc) || 0;
              else if (ccIsAlto(cc)) base = Number(t.precio_alto_cc) || 0;
              else base = Number(t.precio_bajo_cc || t.precio_alto_cc || 0);
            }
          }
          if (!base) {
            const s = serviciosByNombre.get(normalize(cita.servicio));
            if (s) {
              if (ccIsBajo(cc)) base = Number(s.precio_base_comision_bajo ?? s.precio_bajo_cc ?? s.precio ?? 0) || 0;
              else if (ccIsAlto(cc)) base = Number(s.precio_base_comision_alto ?? s.precio_alto_cc ?? s.precio ?? 0) || 0;
              else base = Number(s.precio_base_comision_bajo ?? s.precio_base_comision_alto ?? s.precio_bajo_cc ?? s.precio_alto_cc ?? s.precio ?? 0) || 0;
            }
          }
          if (!base) base = 25000;
          const precioCliente = calcularPrecioCliente(cita);
          return Math.min(base, precioCliente);
    };

    // Calcular total de comisiones
    let totalComisiones = 0;
    for (const cita of citas) {
      const lavador = lavadores.find(l => l.id === cita.lavador_id);
      if (lavador) {
        const baseComision = calcularBaseComision(cita);
        const comision = baseComision * ((Number(lavador.comision_porcentaje) || 0) / 100);
        totalComisiones += comision;
      }
    }

    // Calcular ingresos por servicios usando el mismo cálculo de precio cliente que nómina
    const ingresosServiciosTotal = citas.reduce((sum, c) => sum + calcularPrecioCliente(c), 0);
    // Seguridad extra: no permitir que las comisiones superen el ingreso cliente total
    totalComisiones = Math.min(totalComisiones, ingresosServiciosTotal);

    // Calcular totales
    const totalIngresos = ingresosServiciosTotal + (ingresosProductos?.total || 0);
    const gastosManualesTotales = totalGastos?.total || 0;
    const totalGastosCompleto = gastosManualesTotales + totalComisiones;
    const utilidadDelMes = totalIngresos - totalGastosCompleto;

    // Obtener utilidad del mes anterior para acumular (tolerante a errores si tabla no existe)
    let utilidadMesAnteriorValue = 0;
    try {
      let mesAnterior = parseInt(mesActual) - 1;
      let anioAnterior = parseInt(anioActual);
      if (mesAnterior < 1) {
        mesAnterior = 12;
        anioAnterior = anioAnterior - 1;
      }
      
      const utilidadMesAnterior = await db.get(
        `SELECT COALESCE(utilidad_neta, 0) as utilidad_acumulada FROM utilidades_mensuales 
         WHERE mes = ? AND anio = ? 
         ORDER BY updated_at DESC LIMIT 1`,
        [mesAnterior, anioAnterior]
      );
      
      utilidadMesAnteriorValue = utilidadMesAnterior?.utilidad_acumulada || 0;
    } catch (error) {
      // La tabla utilidades_mensuales podría no existir aún
      console.warn("⚠️ Tabla utilidades_mensuales no existe o error consultándola:", error.message);
      utilidadMesAnteriorValue = 0;
    }

    const utilidadNeta = utilidadDelMes + utilidadMesAnteriorValue;

    // CIERRE AUTOMÁTICO: Si el mes anterior no está cerrado, cerrarlo automáticamente
    try {
      let mesAnterior = parseInt(mesActual) - 1;
      let anioAnterior = parseInt(anioActual);
      if (mesAnterior < 1) {
        mesAnterior = 12;
        anioAnterior = anioAnterior - 1;
      }

      const mesAnteriorCerrado = await db.get(
        `SELECT id FROM utilidades_mensuales WHERE mes = ? AND anio = ?`,
        [mesAnterior, anioAnterior]
      );

      // Si el mes anterior no está cerrado, calcularlo y cerrarlo automáticamente
      if (!mesAnteriorCerrado) {
        console.log(`⏰ Cerrando automáticamente mes ${mesAnterior}/${anioAnterior}...`);
        
        // Obtener datos del mes anterior
        const ingresosProdAnt = await db.get(
          `SELECT COALESCE(SUM(total), 0) as total FROM ventas WHERE strftime('%Y-%m', created_at) = ?`,
          [`${anioAnterior}-${mesAnterior.toString().padStart(2, '0')}`]
        );

        const gastosAnt = await db.get(
          `SELECT COALESCE(SUM(monto), 0) as total FROM gastos WHERE strftime('%Y-%m', fecha) = ?`,
          [`${anioAnterior}-${mesAnterior.toString().padStart(2, '0')}`]
        );

        const citasAnt = await db.all(
          `SELECT c.* FROM citas c 
           LEFT JOIN cupones cup ON c.id = cup.cita_id AND cup.usado = 1
           WHERE c.lavador_id IS NOT NULL 
             AND strftime('%Y-%m', c.fecha) = ? 
             AND COALESCE(c.estado,'') IN ('finalizada', 'confirmada')
             AND cup.id IS NULL
           ORDER BY c.fecha, c.hora`,
          [`${anioAnterior}-${mesAnterior.toString().padStart(2, '0')}`]
        );

        // Calcular comisiones del mes anterior
        let totalComisionesAnt = 0;
        for (const cita of citasAnt) {
          const lavador = lavadores.find(l => l.id === cita.lavador_id);
          if (lavador) {
            const baseComision = calcularBaseComision(cita);
            const comision = baseComision * ((Number(lavador.comision_porcentaje) || 0) / 100);
            totalComisionesAnt += comision;
          }
        }

        const ingresosServAnt = citasAnt.reduce((sum, c) => sum + calcularPrecioCliente(c), 0);
        totalComisionesAnt = Math.min(totalComisionesAnt, ingresosServAnt);

        const ingresosAnt = ingresosServAnt + (ingresosProdAnt?.total || 0);
        const gastosAnt_total = (gastosAnt?.total || 0) + totalComisionesAnt;
        const utilidadDelMesAnt = ingresosAnt - gastosAnt_total;

        // Obtener la utilidad acumulada del mes anterior al anterior
        let utilidadMesesAnteriores = 0;
        try {
          let mesAntAnterior = mesAnterior - 1;
          let anioAntAnterior = anioAnterior;
          if (mesAntAnterior < 1) {
            mesAntAnterior = 12;
            anioAntAnterior = anioAntAnterior - 1;
          }
          
          const utilidadAntAnt = await db.get(
            `SELECT COALESCE(utilidad_neta, 0) as utilidad_acumulada FROM utilidades_mensuales 
             WHERE mes = ? AND anio = ?`,
            [mesAntAnterior, anioAntAnterior]
          );
          
          utilidadMesesAnteriores = utilidadAntAnt?.utilidad_acumulada || 0;
        } catch (e) {
          utilidadMesesAnteriores = 0;
        }

        const utilidadTotalAnt = utilidadDelMesAnt + utilidadMesesAnteriores;

        // Guardar el cierre automático
        await db.run(
          `INSERT INTO utilidades_mensuales (mes, anio, utilidad_neta, ingresos_totales, gastos_totales)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(mes, anio) DO UPDATE SET
           utilidad_neta = ?,
           ingresos_totales = ?,
           gastos_totales = ?,
           updated_at = CURRENT_TIMESTAMP`,
          [
            mesAnterior,
            anioAnterior,
            utilidadTotalAnt,
            ingresosAnt,
            gastosAnt_total,
            utilidadTotalAnt,
            ingresosAnt,
            gastosAnt_total
          ]
        );

        console.log(`✅ Mes ${mesAnterior}/${anioAnterior} cerrado automáticamente con utilidad: ${utilidadTotalAnt}`);
      }
    } catch (error) {
      console.warn("⚠️ Error en cierre automático de mes anterior:", error.message);
      // No interrumpir si hay error en cierre automático
    }

    res.json({
      ingresos: {
        servicios: ingresosServiciosTotal,
        productos: ingresosProductos?.total || 0,
        total: totalIngresos
      },
      gastos: {
        manuales: gastosManualesTotales,
        comisiones: totalComisiones,
        total: totalGastosCompleto,
        porCategoria: gastosPorCategoria
      },
      utilidadMesActual: utilidadDelMes,
      utilidadMesAnterior: utilidadMesAnteriorValue,
      utilidadNeta,
      mes: mesActual,
      anio: anioActual
    });
  } catch (error) {
    console.error("❌ Error obteniendo dashboard:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET - Listar todos los gastos con filtros
router.get("/gastos", verifyToken, requireAdminOrSupervisor, async (req, res) => {
  try {
    const db = getDbFromRequest(req);
    const { tipo, categoria, desde, hasta } = req.query;
    
    let query = "SELECT * FROM gastos WHERE 1=1";
    const params = [];

    if (tipo) {
      query += " AND tipo = ?";
      params.push(tipo);
    }

    if (categoria) {
      query += " AND categoria = ?";
      params.push(categoria);
    }

    if (desde) {
      query += " AND fecha >= ?";
      params.push(desde);
    }

    if (hasta) {
      query += " AND fecha <= ?";
      params.push(hasta);
    }

    query += " ORDER BY fecha DESC, id DESC";

    const gastos = await db.all(query, params);
    res.json(gastos);
  } catch (error) {
    console.error("❌ Error obteniendo gastos:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST - Crear gasto
router.post("/gastos", verifyToken, requireAdminOrSupervisor, async (req, res) => {
  try {
    const db = getDbFromRequest(req);
    const { tipo, categoria, descripcion, monto, fecha, empleado_id, metodo_pago, estado, notas } = req.body;
    const registrado_por = req.user.username;

    if (!tipo || !categoria || !descripcion || !monto || !fecha) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    if (monto <= 0) {
      return res.status(400).json({ error: "El monto debe ser mayor a 0" });
    }

    const result = await db.run(
      `INSERT INTO gastos (tipo, categoria, descripcion, monto, fecha, empleado_id, metodo_pago, estado, notas, registrado_por) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tipo, categoria, descripcion, monto, fecha, empleado_id || null, metodo_pago || null, estado || 'completado', notas || '', registrado_por]
    );

    res.json({
      id: result.lastID,
      tipo,
      categoria,
      descripcion,
      monto,
      fecha,
      empleado_id,
      metodo_pago,
      estado,
      notas,
      registrado_por
    });
  } catch (error) {
    console.error("❌ Error creando gasto:", error);
    res.status(500).json({ error: error.message });
  }
});

// PUT - Actualizar gasto
router.put("/gastos/:id", verifyToken, requireAdminOrSupervisor, async (req, res) => {
  try {
    const db = getDbFromRequest(req);
    const { id } = req.params;
    const { tipo, categoria, descripcion, monto, fecha, empleado_id, metodo_pago, estado, notas } = req.body;

    if (!tipo || !categoria || !descripcion || !monto || !fecha) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    if (monto <= 0) {
      return res.status(400).json({ error: "El monto debe ser mayor a 0" });
    }

    await db.run(
      `UPDATE gastos 
       SET tipo = ?, categoria = ?, descripcion = ?, monto = ?, fecha = ?, empleado_id = ?, metodo_pago = ?, estado = ?, notas = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [tipo, categoria, descripcion, monto, fecha, empleado_id || null, metodo_pago || null, estado || 'completado', notas || '', id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("❌ Error actualizando gasto:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Eliminar gasto
router.delete("/gastos/:id", verifyToken, requireAdminOrSupervisor, async (req, res) => {
  try {
    const db = getDbFromRequest(req);
    const { id } = req.params;

    await db.run("DELETE FROM gastos WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (error) {
    console.error("❌ Error eliminando gasto:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET - Reporte de movimientos (ingresos y gastos combinados)
router.get("/movimientos", verifyToken, requireAdminOrSupervisor, async (req, res) => {
  try {
    const db = getDbFromRequest(req);
    const { mes, anio, desde, hasta } = req.query;
    
    const fecha = new Date();
    const mesActual = mes || (fecha.getMonth() + 1).toString().padStart(2, '0');
    const anioActual = anio || fecha.getFullYear().toString();
    
    // Determinar filtro de fechas
    let whereCondition = "";
    let params = [];
    
    if (desde && hasta) {
      whereCondition = "WHERE fecha >= ? AND fecha <= ?";
      params = [desde, hasta];
    } else {
      whereCondition = "WHERE strftime('%Y-%m', fecha) = ?";
      params = [`${anioActual}-${mesActual}`];
    }

    // Gastos del mes
    const gastos = await db.all(`
      SELECT 'gasto' as tipo, fecha, descripcion, monto, categoria, registrado_por
      FROM gastos
      ${whereCondition}
      ORDER BY fecha DESC
    `, params);

    // Ingresos de productos
    let productoCondition = "";
    let productoParams = [];
    
    if (desde && hasta) {
      productoCondition = "WHERE DATE(created_at) >= ? AND DATE(created_at) <= ?";
      productoParams = [desde, hasta];
    } else {
      productoCondition = "WHERE strftime('%Y-%m', created_at) = ?";
      productoParams = [`${anioActual}-${mesActual}`];
    }
    
    const ingresosProductos = await db.all(`
      SELECT 'ingreso' as tipo, DATE(created_at) as fecha, 
             'Venta: ' || (SELECT nombre FROM productos WHERE id = producto_id) as descripcion,
             total as monto, 'Productos' as categoria, registrado_por
      FROM ventas
      ${productoCondition}
      ORDER BY created_at DESC
    `, productoParams);

    // Contexto para calcular precio cliente igual que nómina
    const servicios = await db.all("SELECT * FROM servicios");
    const promociones = await db.all("SELECT * FROM promociones").catch(() => []);
    const talleres = await db.all("SELECT * FROM talleres").catch(() => []);
    const serviciosByNombre = new Map(servicios.map(s => [String(s.nombre || '').trim().toLowerCase(), s]));
    const promocionesById = new Map(promociones.map(p => [p.id, p]));
    const talleresById = new Map(talleres.map(t => [t.id, t]));
    const ccIsBajo = (cc) => {
      const n = Number(cc || 0);
      return !Number.isNaN(n) && n >= 50 && n <= 405;
    };
    const ccIsAlto = (cc) => {
      const n = Number(cc || 0);
      return !Number.isNaN(n) && n > 405;
    };
    const normalize = (s) => String(s || '').trim().toLowerCase();
    const calcularPrecioCliente = (cita) => {
      const cc = cita.cilindraje;
      if (cita.promocion_id) {
        const p = promocionesById.get(cita.promocion_id);
        if (p) {
          if (ccIsBajo(cc)) return Number(p.precio_cliente_bajo_cc) || 0;
          if (ccIsAlto(cc)) return Number(p.precio_cliente_alto_cc) || 0;
          return Number(p.precio_cliente_bajo_cc || p.precio_cliente_alto_cc || 0);
        }
      }
      if (cita.taller_id) {
        const t = talleresById.get(cita.taller_id);
        if (t) {
          if (ccIsBajo(cc)) return Number(t.precio_bajo_cc) || 0;
          if (ccIsAlto(cc)) return Number(t.precio_alto_cc) || 0;
          return Number(t.precio_bajo_cc || t.precio_alto_cc || 0);
        }
      }
      const s = serviciosByNombre.get(normalize(cita.servicio));
      if (s) {
        if (ccIsBajo(cc)) return Number(s.precio_bajo_cc ?? s.precio ?? 0) || 0;
        if (ccIsAlto(cc)) return Number(s.precio_alto_cc ?? s.precio ?? 0) || 0;
        return Number(s.precio_bajo_cc ?? s.precio_alto_cc ?? s.precio ?? 0) || 0;
      }
      return 25000;
    };

    // Traer citas del mes con lavador asignado y estados válidos
    let citasCondition = "";
    let citasParams = [];
    
    if (desde && hasta) {
      citasCondition = "WHERE lavador_id IS NOT NULL AND COALESCE(estado,'') IN ('finalizada', 'confirmada') AND fecha >= ? AND fecha <= ?";
      citasParams = [desde, hasta];
    } else {
      citasCondition = "WHERE lavador_id IS NOT NULL AND COALESCE(estado,'') IN ('finalizada', 'confirmada') AND strftime('%Y-%m', fecha) = ?";
      citasParams = [`${anioActual}-${mesActual}`];
    }
    
    const citasServicios = await db.all(`
      SELECT * FROM citas
      ${citasCondition}
      ORDER BY fecha DESC
    `, citasParams);

    const ingresosServicios = citasServicios.map(c => ({
      tipo: 'ingreso',
      fecha: c.fecha,
      descripcion: `Servicio: ${c.servicio} - ${c.cliente}`,
      monto: calcularPrecioCliente(c),
      categoria: 'Servicios',
      registrado_por: null
    }));

    // Combinar y ordenar todos los movimientos
    const movimientos = [...gastos, ...ingresosProductos, ...ingresosServicios].sort((a, b) => {
      return new Date(b.fecha) - new Date(a.fecha);
    });

    res.json(movimientos);
  } catch (error) {
    console.error("❌ Error obteniendo movimientos:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET - Exportar reporte detallado a Excel
router.get("/exportar-excel", verifyToken, requireAdminOrSupervisor, async (req, res) => {
  try {
    const db = getDbFromRequest(req);
    const { mes, anio, desde, hasta } = req.query;
    
    const fecha = new Date();
    const mesActual = mes || (fecha.getMonth() + 1).toString().padStart(2, '0');
    const anioActual = anio || fecha.getFullYear().toString();

    // Calcular dashboard para export sin reutilizar res
    const servicios = await db.all("SELECT * FROM servicios");
    const promociones = await db.all("SELECT * FROM promociones").catch(() => []);
    const talleres = await db.all("SELECT * FROM talleres").catch(() => []);
    const lavadores = await db.all("SELECT * FROM lavadores WHERE activo = 1");

    let ingresoProductos, totalGastos, gastosPorCategoria, citas;
    if (desde && hasta) {
      ingresoProductos = await db.get(
        `SELECT COALESCE(SUM(total), 0) as total FROM ventas WHERE DATE(created_at) >= ? AND DATE(created_at) <= ?`,
        [desde, hasta]
      );
      totalGastos = await db.get(
        `SELECT COALESCE(SUM(monto), 0) as total FROM gastos WHERE fecha >= ? AND fecha <= ?`,
        [desde, hasta]
      );
      gastosPorCategoria = await db.all(
        `SELECT categoria, SUM(monto) as total FROM gastos WHERE fecha >= ? AND fecha <= ? GROUP BY categoria ORDER BY total DESC`,
        [desde, hasta]
      );
      citas = await db.all(
        `SELECT c.* FROM citas c WHERE c.lavador_id IS NOT NULL AND c.fecha >= ? AND c.fecha <= ? AND COALESCE(c.estado,'') IN ('finalizada','confirmada') ORDER BY c.fecha, c.hora`,
        [desde, hasta]
      );
    } else {
      ingresoProductos = await db.get(
        `SELECT COALESCE(SUM(total), 0) as total FROM ventas WHERE strftime('%Y-%m', created_at) = ?`,
        [`${anioActual}-${mesActual}`]
      );
      totalGastos = await db.get(
        `SELECT COALESCE(SUM(monto), 0) as total FROM gastos WHERE strftime('%Y-%m', fecha) = ?`,
        [`${anioActual}-${mesActual}`]
      );
      gastosPorCategoria = await db.all(
        `SELECT categoria, SUM(monto) as total FROM gastos WHERE strftime('%Y-%m', fecha) = ? GROUP BY categoria ORDER BY total DESC`,
        [`${anioActual}-${mesActual}`]
      );
      citas = await db.all(
        `SELECT c.* FROM citas c WHERE c.lavador_id IS NOT NULL AND strftime('%Y-%m', c.fecha) = ? AND COALESCE(c.estado,'') IN ('finalizada', 'confirmada') ORDER BY c.fecha, c.hora`,
        [`${anioActual}-${mesActual}`]
      );
    }

    const serviciosByNombre = new Map(servicios.map(s => [String(s.nombre || '').trim().toLowerCase(), s]));
    const promocionesById = new Map(promociones.map(p => [p.id, p]));
    const talleresById = new Map(talleres.map(t => [t.id, t]));

    const ccIsBajo = (cc) => {
      const n = Number(cc || 0);
      return !Number.isNaN(n) && n >= 50 && n <= 405;
    };
    const ccIsAlto = (cc) => {
      const n = Number(cc || 0);
      return !Number.isNaN(n) && n > 405;
    };
    const normalize = (s) => String(s || '').trim().toLowerCase();

    const calcularPrecioCliente = (cita) => {
      const cc = cita.cilindraje;
      if (cita.promocion_id) {
        const p = promocionesById.get(cita.promocion_id);
        if (p) {
          if (ccIsBajo(cc)) return Number(p.precio_cliente_bajo_cc) || 0;
          if (ccIsAlto(cc)) return Number(p.precio_cliente_alto_cc) || 0;
          return Number(p.precio_cliente_bajo_cc || p.precio_cliente_alto_cc || 0);
        }
      }
      if (cita.taller_id) {
        const t = talleresById.get(cita.taller_id);
        if (t) {
          if (ccIsBajo(cc)) return Number(t.precio_bajo_cc) || 0;
          if (ccIsAlto(cc)) return Number(t.precio_alto_cc) || 0;
          return Number(t.precio_bajo_cc || t.precio_alto_cc || 0);
        }
      }
      const s = serviciosByNombre.get(normalize(cita.servicio));
      if (s) {
        if (ccIsBajo(cc)) return Number(s.precio_bajo_cc ?? s.precio ?? 0) || 0;
        if (ccIsAlto(cc)) return Number(s.precio_alto_cc ?? s.precio ?? 0) || 0;
        return Number(s.precio_bajo_cc ?? s.precio_alto_cc ?? s.precio ?? 0) || 0;
      }
      return 25000;
    };

    const calcularBaseComision = (cita) => {
      const cc = cita.cilindraje;
      let base = 0;
      if (cita.promocion_id) {
        const p = promocionesById.get(cita.promocion_id);
        if (p) {
          if (ccIsBajo(cc)) base = Number(p.precio_comision_bajo_cc) || 0;
          else if (ccIsAlto(cc)) base = Number(p.precio_comision_alto_cc) || 0;
          else base = Number(p.precio_comision_bajo_cc || p.precio_comision_alto_cc || 0);
        }
      }
      if (!base && cita.taller_id) {
        const t = talleresById.get(cita.taller_id);
        if (t) {
          if (ccIsBajo(cc)) base = Number(t.precio_bajo_cc) || 0;
          else if (ccIsAlto(cc)) base = Number(t.precio_alto_cc) || 0;
          else base = Number(t.precio_bajo_cc || t.precio_alto_cc || 0);
        }
      }
      if (!base) {
        const s = serviciosByNombre.get(normalize(cita.servicio));
        if (s) {
          if (ccIsBajo(cc)) base = Number(s.precio_base_comision_bajo ?? s.precio_bajo_cc ?? s.precio ?? 0) || 0;
          else if (ccIsAlto(cc)) base = Number(s.precio_base_comision_alto ?? s.precio_alto_cc ?? s.precio ?? 0) || 0;
          else base = Number(s.precio_base_comision_bajo ?? s.precio_base_comision_alto ?? s.precio_bajo_cc ?? s.precio_alto_cc ?? s.precio ?? 0) || 0;
        }
      }
      if (!base) base = 25000;
      const precioCliente = calcularPrecioCliente(cita);
      return Math.min(base, precioCliente);
    };

    let totalComisiones = 0;
    for (const cita of citas) {
      const lavador = lavadores.find(l => l.id === cita.lavador_id);
      if (lavador) {
        const baseComision = calcularBaseComision(cita);
        const comision = baseComision * ((Number(lavador.comision_porcentaje) || 0) / 100);
        totalComisiones += comision;
      }
    }

    const ingresosServiciosTotal = citas.reduce((sum, c) => sum + calcularPrecioCliente(c), 0);
    totalComisiones = Math.min(totalComisiones, ingresosServiciosTotal);

    const totalIngresos = ingresosServiciosTotal + (ingresoProductos?.total || 0);
    const gastosManualesTotales = totalGastos?.total || 0;
    const totalGastosCompleto = gastosManualesTotales + totalComisiones;
    const utilidadDelMes = totalIngresos - totalGastosCompleto;

    // Obtener utilidad del mes anterior para acumular (tolerante a errores si tabla no existe)
    let utilidadMesAnteriorValue = 0;
    try {
      let mesAnterior = parseInt(mesActual) - 1;
      let anioAnterior = parseInt(anioActual);
      if (mesAnterior < 1) {
        mesAnterior = 12;
        anioAnterior = anioAnterior - 1;
      }
      
      const utilidadMesAnteriorData = await db.get(
        `SELECT COALESCE(utilidad_neta, 0) as utilidad_acumulada FROM utilidades_mensuales 
         WHERE mes = ? AND anio = ? 
         ORDER BY updated_at DESC LIMIT 1`,
        [mesAnterior, anioAnterior]
      );
      
      utilidadMesAnteriorValue = utilidadMesAnteriorData?.utilidad_acumulada || 0;
    } catch (error) {
      // La tabla utilidades_mensuales podría no existir aún
      console.warn("⚠️ Tabla utilidades_mensuales no existe o error consultándola:", error.message);
      utilidadMesAnteriorValue = 0;
    }

    const utilidadNeta = utilidadDelMes + utilidadMesAnteriorValue;

    let gastosDetalle = [];
    if (desde && hasta) {
      gastosDetalle = await db.all(
        `SELECT fecha, categoria, descripcion, monto FROM gastos WHERE fecha >= ? AND fecha <= ? ORDER BY fecha DESC`,
        [desde, hasta]
      );
    } else {
      gastosDetalle = await db.all(
        `SELECT fecha, categoria, descripcion, monto FROM gastos WHERE strftime('%Y-%m', fecha) = ? ORDER BY fecha DESC`,
        [`${anioActual}-${mesActual}`]
      );
    }

    let productosDetalle = [];
    if (desde && hasta) {
      productosDetalle = await db.all(
        `SELECT DATE(created_at) as fecha, (SELECT nombre FROM productos WHERE id = producto_id) as producto, cantidad, total 
         FROM ventas WHERE DATE(created_at) >= ? AND DATE(created_at) <= ? ORDER BY created_at DESC`,
        [desde, hasta]
      );
    } else {
      productosDetalle = await db.all(
        `SELECT DATE(created_at) as fecha, (SELECT nombre FROM productos WHERE id = producto_id) as producto, cantidad, total 
         FROM ventas WHERE strftime('%Y-%m', created_at) = ? ORDER BY created_at DESC`,
        [`${anioActual}-${mesActual}`]
      );
    }

    const dashboardRes = {
      ingresos: {
        servicios: ingresosServiciosTotal,
        productos: ingresoProductos?.total || 0,
        total: totalIngresos
      },
      gastos: {
        manuales: gastosManualesTotales,
        comisiones: totalComisiones,
        total: totalGastosCompleto,
        porCategoria: gastosPorCategoria,
        detalle: gastosDetalle
      },
      productos: productosDetalle,
      utilidadMesActual: utilidadDelMes,
      utilidadMesAnterior: utilidadMesAnteriorValue,
      utilidadNeta,
      servicios: citas.length,
      mes: mesActual,
      anio: anioActual
    };

    // Crear workbook con múltiples sheets
    const workbook = new ExcelJS.Workbook();

    // Sheet 1: Resumen General
    const wsResumen = workbook.addWorksheet("Resumen");
    wsResumen.columns = [
      { header: "Concepto", key: "concepto", width: 30 },
      { header: "Monto", key: "monto", width: 18 }
    ];
    wsResumen.addRows([
      { concepto: "INGRESOS", monto: "" },
      { concepto: "Servicios", monto: dashboardRes.ingresos.servicios },
      { concepto: "Productos", monto: dashboardRes.ingresos.productos },
      { concepto: "Total Ingresos", monto: dashboardRes.ingresos.total },
      { concepto: "", monto: "" },
      { concepto: "GASTOS", monto: "" },
      { concepto: "Gastos Manuales", monto: dashboardRes.gastos.manuales },
      { concepto: "Comisiones a Lavadores", monto: dashboardRes.gastos.comisiones },
      { concepto: "Total Gastos", monto: dashboardRes.gastos.total },
      { concepto: "", monto: "" },
      { concepto: "UTILIDAD NETA", monto: dashboardRes.utilidadNeta },
      { concepto: "Margen %", monto: dashboardRes.ingresos.total > 0 ? ((dashboardRes.utilidadNeta / dashboardRes.ingresos.total) * 100).toFixed(2) + "%" : "0%" }
    ]);
    wsResumen.getCell('A1').font = { bold: true, size: 12 };
    wsResumen.getCell('A6').font = { bold: true, size: 12 };
    wsResumen.getCell('A11').font = { bold: true, size: 12 };

    // Sheet 2: Detalle de Gastos
    const wsGastos = workbook.addWorksheet("Gastos");
    wsGastos.columns = [
      { header: "Fecha", key: "fecha", width: 12 },
      { header: "Categoría", key: "categoria", width: 15 },
      { header: "Descripción", key: "descripcion", width: 35 },
      { header: "Monto", key: "monto", width: 15 }
    ];
    wsGastos.addRows(dashboardRes.gastos.detalle);

    // Sheet 3: Gastos por Categoría
    const wsGastosCategoria = workbook.addWorksheet("Gastos por Categoría");
    wsGastosCategoria.columns = [
      { header: "Categoría", key: "categoria", width: 20 },
      { header: "Total", key: "total", width: 15 },
      { header: "% del Total", key: "porcentaje", width: 18 }
    ];
    const gastosCategoriaData = dashboardRes.gastos.porCategoria.map(g => ({
      categoria: g.categoria,
      total: g.total,
      porcentaje: dashboardRes.gastos.manuales > 0 ? ((g.total / dashboardRes.gastos.manuales) * 100).toFixed(2) + "%" : "0%"
    }));
    wsGastosCategoria.addRows(gastosCategoriaData);

    // Sheet 4: Detalle de Productos
    const wsProductos = workbook.addWorksheet("Productos");
    wsProductos.columns = [
      { header: "Fecha", key: "fecha", width: 12 },
      { header: "Producto", key: "producto", width: 30 },
      { header: "Cantidad", key: "cantidad", width: 10 },
      { header: "Total", key: "total", width: 15 }
    ];
    const productosData = dashboardRes.productos.map(p => ({
      fecha: p.fecha,
      producto: p.producto || "N/A",
      cantidad: p.cantidad,
      total: p.total
    }));
    wsProductos.addRows(productosData);

    // Sheet 5: Resumen de Ingresos
    const wsIngresosResumen = workbook.addWorksheet("Ingresos Resumen");
    wsIngresosResumen.columns = [
      { header: "Concepto", key: "concepto", width: 30 },
      { header: "Cantidad", key: "cantidad", width: 12 },
      { header: "Total", key: "total", width: 15 }
    ];
    wsIngresosResumen.addRows([
      { concepto: "Ingresos por Servicios", cantidad: dashboardRes.servicios, total: dashboardRes.ingresos.servicios },
      { concepto: "Ingresos por Productos", cantidad: dashboardRes.productos.length, total: dashboardRes.ingresos.productos },
      { concepto: "TOTAL INGRESOS", cantidad: dashboardRes.servicios + dashboardRes.productos.length, total: dashboardRes.ingresos.total }
    ]);
    wsIngresosResumen.getCell('A3').font = { bold: true };

    // Generar y enviar el archivo
    const nombreArchivo = `finanzas_${dashboardRes.anio}-${dashboardRes.mes.padStart(2, '0')}.xlsx`;
    const xlsxArrayBuffer = await workbook.xlsx.writeBuffer();
    const nodeBuffer = Buffer.isBuffer(xlsxArrayBuffer)
      ? xlsxArrayBuffer
      : Buffer.from(xlsxArrayBuffer instanceof ArrayBuffer ? new Uint8Array(xlsxArrayBuffer) : xlsxArrayBuffer);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    res.send(nodeBuffer);
  } catch (error) {
    console.error("❌ Error exportando Excel:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET - Obtener historial de utilidades mensuales
router.get("/utilidades-historial", verifyToken, requireAdminOrSupervisor, async (req, res) => {
  try {
    const db = getDbFromRequest(req);
    const { anio, limite } = req.query;
    const limiteRegistros = limite ? parseInt(limite) : 12;

    let query = `SELECT * FROM utilidades_mensuales`;
    const params = [];

    if (anio) {
      query += ` WHERE anio = ?`;
      params.push(anio);
    }

    query += ` ORDER BY anio DESC, mes DESC LIMIT ?`;
    params.push(limiteRegistros);

    const utilidades = await db.all(query, params);

    res.json({
      success: true,
      data: utilidades,
      cantidad: utilidades.length
    });
  } catch (error) {
    console.error("❌ Error obteniendo historial de utilidades:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST - Guardar/Cerrar utilidad del mes (para acumular al siguiente)
router.post("/cerrar-mes", verifyToken, requireAdminOrSupervisor, async (req, res) => {
  try {
    const db = getDbFromRequest(req);
    const { mes, anio, utilidadNeta, ingresosTotales, gastosTotales } = req.body;

    if (!mes || !anio || utilidadNeta === undefined) {
      return res.status(400).json({ error: "mes, anio y utilidadNeta son requeridos" });
    }

    // Guardar o actualizar la utilidad del mes
    const result = await db.run(
      `INSERT INTO utilidades_mensuales (mes, anio, utilidad_neta, ingresos_totales, gastos_totales)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(mes, anio) DO UPDATE SET
       utilidad_neta = ?,
       ingresos_totales = ?,
       gastos_totales = ?,
       updated_at = CURRENT_TIMESTAMP`,
      [
        mes,
        anio,
        utilidadNeta,
        ingresosTotales || 0,
        gastosTotales || 0,
        utilidadNeta,
        ingresosTotales || 0,
        gastosTotales || 0
      ]
    );

    res.json({
      success: true,
      message: `Utilidad del mes ${mes}/${anio} guardada correctamente`,
      id: result.lastID
    });
  } catch (error) {
    console.error("❌ Error guardando utilidad mensual:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
