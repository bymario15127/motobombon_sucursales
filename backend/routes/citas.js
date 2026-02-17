// backend/routes/citas.js
import express from "express";
import { getDbFromRequest } from "../database/dbManager.js";
import { procesarLavadaCliente } from "./clientes.js";

const router = express.Router();

// GET all (solo del día actual por defecto)
router.get("/", async (req, res) => {
  try {
    const db = getDbFromRequest(req);
    // Obtener fecha actual en formato YYYY-MM-DD en zona horaria de Colombia (UTC-5)
    const today = () => {
      const d = new Date();
      // Convertir a hora de Colombia (UTC-5)
      const colombiaTime = new Date(d.toLocaleString('en-US', { timeZone: 'America/Bogota' }));
      const yyyy = colombiaTime.getFullYear();
      const mm = String(colombiaTime.getMonth() + 1).padStart(2, "0");
      const dd = String(colombiaTime.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };
    
    const todayStr = today();
    
    // Si se pasa ?all=true, devuelve todas las citas
    const incluirTodas = req.query.all === 'true';
    
    // Construir query evitando fallar si no existe tabla lavadores
    let joinLavadores = '';
    try {
      const colsLav = await db.all("PRAGMA table_info(lavadores)");
      if (Array.isArray(colsLav) && colsLav.length > 0) {
        joinLavadores = ' LEFT JOIN lavadores l ON c.lavador_id = l.id ';
      }
    } catch (_) { /* ignore */ }

    // Verificar si existe columna deleted_at para filtrar citas eliminadas
    let filtroEliminadas = '';
    try {
      const columns = await db.all("PRAGMA table_info(citas)");
      if (columns.some((c) => c.name === "deleted_at")) {
        filtroEliminadas = ' AND c.deleted_at IS NULL';
      }
    } catch (_) { /* ignore */ }

    let query = `SELECT c.*${joinLavadores ? ', l.nombre as lavador_nombre' : ''} FROM citas c${joinLavadores}`;
    
    if (!incluirTodas) {
      query += ` WHERE c.fecha = ?${filtroEliminadas}`;
    } else {
      query += filtroEliminadas ? ` WHERE c.deleted_at IS NULL` : '';
    }
    
    query += ` ORDER BY c.fecha ASC, c.hora ASC`;
    
    const citas = incluirTodas 
      ? await db.all(query)
      : await db.all(query, [todayStr]);
    
    res.json(citas);
  } catch (error) {
    console.error("Error al obtener citas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// GET horarios ocupados para una fecha específica
router.get("/ocupados/:fecha", async (req, res) => {
  try {
    const db = getDbFromRequest(req);
    const { fecha } = req.params;
    
    if (!fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return res.status(400).json({ error: "Formato de fecha inválido" });
    }
    
    const horariosOcupados = await db.all(
      "SELECT hora FROM citas WHERE fecha = ? AND estado != 'cancelada'",
      [fecha]
    );
    
    res.json(horariosOcupados.map(cita => cita.hora));
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
});
// Helpers
const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(":").map(n => parseInt(n, 10));
  return h * 60 + m;
};

// POST create (hora y fecha opcionales; si no se envían, se registra para HOY y sin hora)
router.post("/", async (req, res) => {
  try {
    const db = getDbFromRequest(req);
    console.log("📥 [POST /api/citas] Payload recibido:", req.body);
    const { cliente, servicio, fecha, hora, telefono, email, comentarios, estado, placa, marca, modelo, cilindraje, metodo_pago, lavador_id, tipo_cliente, taller_id, promocion_id } = req.body;
    
    if (!cliente || !servicio) {
      return res.status(400).json({ error: "Campos obligatorios: cliente, servicio" });
    }
    
    // Calcular fecha por defecto (hoy en Colombia) si no se envía
    const todayStr = () => {
      const d = new Date();
      // Convertir a hora de Colombia (UTC-5)
      const colombiaTime = new Date(d.toLocaleString('en-US', { timeZone: 'America/Bogota' }));
      const yyyy = colombiaTime.getFullYear();
      const mm = String(colombiaTime.getMonth() + 1).padStart(2, "0");
      const dd = String(colombiaTime.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };
    const fechaFinal = (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) ? fecha : todayStr();
    
    // Validar hora solo si viene
    let horaFinal = null;
    if (hora) {
      if (!/^\d{2}:\d{2}$/.test(hora)) {
        return res.status(400).json({ error: "Formato de hora inválido. Use HH:MM" });
      }
      horaFinal = hora;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Correo electrónico inválido" });
    }
    
    // Validar cilindraje si se proporciona
    if (cilindraje) {
      const cc = Number(cilindraje);
      if (isNaN(cc) || cc < 50 || cc > 2000) {
        return res.status(400).json({ error: "Cilindraje inválido. Debe estar entre 50 y 2000 cc" });
      }
    }
    
    // Validar método de pago
    const metodosValidos = ["codigo_qr", "efectivo", "tarjeta", null, "", undefined];
    if (!metodosValidos.includes(metodo_pago)) {
      return res.status(400).json({ error: "Método de pago inválido. Use 'codigo_qr', 'efectivo' o 'tarjeta'" });
    }

    // Si no se envía hora, no aplicamos verificación de traslapes
    if (horaFinal) {
      // Regla simplificada: solo bloqueamos misma hora exacta en la fecha (evita falsos positivos por duración)
      const yaTomada = await db.get(
        "SELECT id FROM citas WHERE fecha = ? AND hora = ? AND (estado IS NULL OR estado != 'cancelada') LIMIT 1",
        [fechaFinal, horaFinal]
      );

      if (yaTomada) {
        return res.status(409).json({
          error: "El horario seleccionado se traslapa con otra cita. Elige otra hora."
        });
      }
    }
    
    try {
      const result = await db.run(
        "INSERT INTO citas (cliente, servicio, fecha, hora, telefono, email, comentarios, estado, placa, marca, modelo, cilindraje, metodo_pago, lavador_id, tipo_cliente, taller_id, promocion_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [cliente, servicio, fechaFinal, horaFinal, telefono || "", email || "", comentarios || "", estado || "pendiente", placa || "", marca || "", modelo || "", cilindraje || null, metodo_pago || null, lavador_id || null, tipo_cliente || "cliente", taller_id || null, promocion_id || null]
      );
      console.log("✅ Cita insertada ID=", result.lastID, promocion_id ? `(Promoción ID: ${promocion_id})` : "");
      return res.status(201).json({ id: result.lastID, message: "Cita creada exitosamente" });
    } catch (dbError) {
      console.error("❌ Error ejecutando INSERT en citas:", dbError);
      if (dbError.message?.includes("NOT NULL") || dbError.code === 'SQLITE_CONSTRAINT') {
        return res.status(400).json({ error: "Error de datos: " + dbError.message });
      }
      return res.status(500).json({ error: "Error guardando la cita" });
    }
  } catch (error) {
    console.error("🔥 Error inesperado en POST /api/citas:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

// PUT update
router.put("/:id", async (req, res) => {
  try {
    const db = getDbFromRequest(req);
    const { id } = req.params;
    const fields = req.body;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: "ID de cita inválido" });
    }
    
    const updates = [];
    const values = [];
    const allowedFields = ['cliente', 'servicio', 'fecha', 'hora', 'telefono', 'email', 'comentarios', 'estado', 'placa', 'marca', 'modelo', 'cilindraje', 'metodo_pago', 'lavador_id', 'promocion_id'];
    
    for (const key of Object.keys(fields)) {
      if (!allowedFields.includes(key)) {
        return res.status(400).json({ error: `Campo no permitido: ${key}` });
      }

      let value = fields[key];
      
      // Validar cilindraje si se está actualizando
      if (key === 'cilindraje' && value) {
        const cc = Number(value);
        if (isNaN(cc) || cc < 50 || cc > 2000) {
          return res.status(400).json({ error: "Cilindraje inválido. Debe estar entre 50 y 2000 cc" });
        }
      }

      // Validar método de pago si se actualiza (solo rol admin)
      if (key === 'metodo_pago') {
        const rol = (
          req.headers['x-user-role'] ||
          req.body?.userRole ||
          req.body?.role ||
          ''
        ).trim().toLowerCase();
        if (rol !== 'admin') {
          return res.status(403).json({ error: "Solo un administrador puede cambiar el método de pago" });
        }

        const normalizado = typeof value === 'string' ? value.trim().toLowerCase() : value;
        const metodosValidosUpdate = ["codigo_qr", "efectivo", "tarjeta", null, ""];
        if (normalizado && !metodosValidosUpdate.includes(normalizado)) {
          return res.status(400).json({ error: "Método de pago inválido. Use 'codigo_qr', 'efectivo' o 'tarjeta'" });
        }
        value = normalizado || null; // Guardamos valor limpio (null para vaciar)
      }
      
      updates.push(`${key} = ?`);
      values.push(value);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: "Nada para actualizar" });
    }
    
    // Obtener la cita antes de actualizar para verificar cambios de estado
    const citaAnterior = await db.get("SELECT * FROM citas WHERE id = ?", id);
    
    if (!citaAnterior) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }
    
    values.push(id);
    const result = await db.run(`UPDATE citas SET ${updates.join(", ")} WHERE id = ?`, values);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }
    
    // Si el estado cambió a "completada" o "finalizada", registrar la lavada para el cliente
    // Solo contar citas normales (taller_id IS NULL), no talleres aliados
    const estadoNuevo = fields.estado?.toLowerCase();
    const estadoAnterior = citaAnterior.estado?.toLowerCase();
    
    if ((estadoNuevo === 'completada' || estadoNuevo === 'finalizada') && 
        estadoAnterior !== 'completada' && estadoAnterior !== 'finalizada' &&
        citaAnterior.taller_id === null) {
      console.log(`🎯 Cita ${id} (normal) marcada como ${estadoNuevo}. Procesando lavada del cliente...`);
      
      // Verificar que tenga email
      const email = fields.email || citaAnterior.email;
      const cliente = fields.cliente || citaAnterior.cliente;
      const telefono = fields.telefono || citaAnterior.telefono;
      
      if (email && cliente) {
        const resultado = await procesarLavadaCliente(db, email, cliente, telefono);
        
        if (resultado.success && resultado.cuponGenerado) {
          console.log(`🎉 ¡Cupón generado para ${email}!`);
          return res.json({ 
            message: "Cita actualizada exitosamente", 
            cuponGenerado: true,
            codigoCupon: resultado.codigoCupon,
            lavadas: resultado.lavadas,
            mensajeFidelizacion: resultado.mensaje
          });
        } else if (resultado.success) {
          console.log(`📊 Lavada registrada para ${email}. Total: ${resultado.lavadas}`);
          return res.json({ 
            message: "Cita actualizada exitosamente",
            lavadas: resultado.lavadas,
            mensajeFidelizacion: resultado.mensaje
          });
        } else {
          console.warn(`⚠️ No se pudo procesar lavada: ${resultado.error}`);
        }
      } else {
        console.warn(`⚠️ Cita completada sin email o nombre de cliente. No se puede rastrear lavadas.`);
      }
    }
    
    res.json({ message: "Cita actualizada exitosamente" });
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// DELETE (soft delete - marca como eliminada, no borra)
router.delete("/:id", async (req, res) => {
  try {
    const db = getDbFromRequest(req);
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: "ID de cita inválido" });
    }
    
    // Verificar que la columna deleted_at existe
    const columns = await db.all("PRAGMA table_info(citas)");
    const tieneDeletedAt = columns.some((c) => c.name === "deleted_at");
    
    let result;
    if (tieneDeletedAt) {
      // Soft delete: marcar como eliminada
      const citaActual = await db.get("SELECT * FROM citas WHERE id = ? AND deleted_at IS NULL", id);
      if (!citaActual) {
        return res.status(404).json({ error: "Cita no encontrada o ya fue eliminada" });
      }
      
      result = await db.run(
        "UPDATE citas SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL",
        id
      );
    } else {
      // Fallback: eliminación física si la columna no existe
      result = await db.run("DELETE FROM citas WHERE id = ?", id);
    }
    
    if (result.changes === 0) {
      return res.status(404).json({ 
        error: tieneDeletedAt ? "Cita no encontrada o ya fue eliminada" : "Cita no encontrada" 
      });
    }
    
    res.json({ 
      message: "Cita eliminada exitosamente",
      recoverable: tieneDeletedAt ? true : false
    });
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;

// ============================================
// ENDPOINT DE ADMINISTRACIÓN - PAPELERA
// ============================================

// GET /citas/papelera - Ver citas eliminadas
router.get("/papelera/ver", async (req, res) => {
  try {
    const db = getDbFromRequest(req);
    const columns = await db.all("PRAGMA table_info(citas)");
    const tieneDeletedAt = columns.some((c) => c.name === "deleted_at");

    if (!tieneDeletedAt) {
      return res.status(400).json({
        error: "La función de papelera no está habilitada. Ejecutar: node scripts/recuperarCitas.js",
      });
    }

    const citasEliminadas = await db.all(
      `SELECT id, cliente, fecha, hora, servicio, telefono, cedula, email, deleted_at 
       FROM citas 
       WHERE deleted_at IS NOT NULL 
       ORDER BY deleted_at DESC`
    );

    res.json({
      total: citasEliminadas.length,
      citas: citasEliminadas,
    });
  } catch (error) {
    console.error("Error al obtener papelera:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// POST /citas/papelera/recuperar/:id - Recuperar una cita
router.post("/papelera/recuperar/:id", async (req, res) => {
  try {
    const db = getDbFromRequest(req);
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ error: "ID de cita inválido" });
    }

    const columns = await db.all("PRAGMA table_info(citas)");
    const tieneDeletedAt = columns.some((c) => c.name === "deleted_at");

    if (!tieneDeletedAt) {
      return res.status(400).json({
        error: "La función de papelera no está habilitada",
      });
    }

    const cita = await db.get(
      "SELECT * FROM citas WHERE id = ? AND deleted_at IS NOT NULL",
      id
    );

    if (!cita) {
      return res.status(404).json({
        error: "Cita no encontrada en papelera o ya fue recuperada",
      });
    }

    await db.run("UPDATE citas SET deleted_at = NULL WHERE id = ?", id);

    res.json({
      message: "Cita recuperada exitosamente",
      cita: cita,
    });
  } catch (error) {
    console.error("Error al recuperar cita:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// DELETE /citas/papelera/permanente/:id - Eliminar permanentemente
router.delete("/papelera/permanente/:id", async (req, res) => {
  try {
    const db = getDbFromRequest(req);
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ error: "ID de cita inválido" });
    }

    const cita = await db.get(
      "SELECT * FROM citas WHERE id = ? AND deleted_at IS NOT NULL",
      id
    );

    if (!cita) {
      return res.status(404).json({
        error: "Cita no encontrada en papelera o ya fue recuperada",
      });
    }

    await db.run("DELETE FROM citas WHERE id = ?", id);

    res.json({
      message: "Cita eliminada permanentemente",
      cita: cita,
    });
  } catch (error) {
    console.error("Error al eliminar permanentemente:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});
