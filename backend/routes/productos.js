// backend/routes/productos.js
import express from "express";
import { getDbFromRequest } from "../database/dbManager.js";
import { verifyToken, requireAdminOrSupervisor } from "../middleware/auth.js";

const router = express.Router();

// GET - Listar todos los productos
router.get("/", verifyToken, requireAdminOrSupervisor, async (req, res) => {
  try {
    const db = getDbFromRequest(req);
    const productos = await db.all("SELECT * FROM productos ORDER BY nombre");
    res.json(productos);
  } catch (error) {
    console.error("❌ Error obteniendo productos:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST - Crear nuevo producto
router.post("/", verifyToken, requireAdminOrSupervisor, async (req, res) => {
  try {
    const db = getDbFromRequest(req);
    const { nombre, precio_compra, precio_venta, stock = 0 } = req.body;

    if (!nombre || !precio_compra || !precio_venta) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    if (precio_venta < precio_compra) {
      return res.status(400).json({ error: "El precio de venta debe ser mayor o igual al de compra" });
    }

    const result = await db.run(
      "INSERT INTO productos (nombre, precio_compra, precio_venta, stock) VALUES (?, ?, ?, ?)",
      [nombre, precio_compra, precio_venta, stock]
    );

    res.json({
      id: result.lastID,
      nombre,
      precio_compra,
      precio_venta,
      stock
    });
  } catch (error) {
    console.error("❌ Error creando producto:", error);
    if (error.message.includes("UNIQUE")) {
      return res.status(400).json({ error: "El producto ya existe" });
    }
    res.status(500).json({ error: error.message });
  }
});

// PUT - Actualizar producto
router.put("/:id", verifyToken, requireAdminOrSupervisor, async (req, res) => {
  try {
    const db = getDbFromRequest(req);
    const { id } = req.params;
    const { nombre, precio_compra, precio_venta, stock } = req.body;

    if (!nombre || !precio_compra || !precio_venta) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    if (precio_venta < precio_compra) {
      return res.status(400).json({ error: "El precio de venta debe ser mayor o igual al de compra" });
    }

    await db.run(
      "UPDATE productos SET nombre = ?, precio_compra = ?, precio_venta = ?, stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [nombre, precio_compra, precio_venta, stock, id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("❌ Error actualizando producto:", error);
    if (error.message.includes("UNIQUE")) {
      return res.status(400).json({ error: "El nombre del producto ya existe" });
    }
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Eliminar producto
router.delete("/:id", verifyToken, requireAdminOrSupervisor, async (req, res) => {
  try {
    const db = getDbFromRequest(req);
    const { id } = req.params;

    await db.run("DELETE FROM productos WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (error) {
    console.error("❌ Error eliminando producto:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST - Registrar venta
router.post("/venta/registrar", verifyToken, requireAdminOrSupervisor, async (req, res) => {
  try {
    const db = getDbFromRequest(req);
    const { producto_id, cantidad, metodo_pago = 'efectivo' } = req.body;
    const registrado_por = req.user.username;

    if (!producto_id || !cantidad) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    if (cantidad <= 0) {
      return res.status(400).json({ error: "La cantidad debe ser mayor a 0" });
    }

    // Obtener producto
    const producto = await db.get("SELECT * FROM productos WHERE id = ?", [producto_id]);
    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    // Validar stock
    if (producto.stock < cantidad) {
      return res.status(400).json({ error: "Stock insuficiente" });
    }

    const precioUnitario = producto.precio_venta ?? producto.precio;

    if (precioUnitario == null || Number(precioUnitario) <= 0) {
      return res.status(400).json({ error: "Producto sin precio de venta. Actualiza el producto." });
    }

    const total = cantidad * Number(precioUnitario);

    // Obtener fecha/hora actual del sistema (ya configurado en zona horaria Colombia)
    const ahora = new Date();
    const year = ahora.getFullYear();
    const month = String(ahora.getMonth() + 1).padStart(2, '0');
    const day = String(ahora.getDate()).padStart(2, '0');
    const hours = String(ahora.getHours()).padStart(2, '0');
    const minutes = String(ahora.getMinutes()).padStart(2, '0');
    const seconds = String(ahora.getSeconds()).padStart(2, '0');
    const fechaHoraColombia = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    // Registrar venta con fecha/hora de Colombia
    const result = await db.run(
      "INSERT INTO ventas (producto_id, cantidad, precio_unitario, total, metodo_pago, registrado_por, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [producto_id, cantidad, Number(precioUnitario), total, metodo_pago, registrado_por, fechaHoraColombia]
    );

    // Actualizar stock
    await db.run(
      "UPDATE productos SET stock = stock - ? WHERE id = ?",
      [cantidad, producto_id]
    );

    res.json({
      id: result.lastID,
      producto_id,
      cantidad,
      precio_unitario: Number(precioUnitario),
      total,
      registrado_por
    });
  } catch (error) {
    console.error("❌ Error registrando venta:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET - Reportes de ventas
router.get("/reportes/diarias", verifyToken, requireAdminOrSupervisor, async (req, res) => {
  try {
    const db = getDbFromRequest(req);
    const { fecha } = req.query;

    let query = `
      SELECT 
        v.id,
        p.nombre as producto,
        v.cantidad,
        v.precio_unitario,
        v.total,
        v.metodo_pago,
        p.precio_compra,
        (v.precio_unitario - p.precio_compra) * v.cantidad as ganancia,
        v.registrado_por,
        v.created_at
      FROM ventas v
      JOIN productos p ON v.producto_id = p.id
    `;

    let params = [];

    if (fecha) {
      // Ahora que el servidor está en zona horaria Colombia, simplemente buscar por DATE
      query += " WHERE DATE(v.created_at) = ?";
      params.push(fecha);
    }

    query += " ORDER BY v.created_at DESC";

    const ventas = await db.all(query, params);

    // Calcular totales
    const totalVentas = ventas.reduce((sum, v) => sum + v.total, 0);
    const totalGanancia = ventas.reduce((sum, v) => sum + v.ganancia, 0);

    res.json({
      ventas,
      resumen: {
        totalVentas,
        totalGanancia,
        cantidadVentas: ventas.length
      }
    });
  } catch (error) {
    console.error("❌ Error obteniendo reportes:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET - Resumen de ganancias por período
router.get("/reportes/ganancias", verifyToken, requireAdminOrSupervisor, async (req, res) => {
  try {
    const db = getDbFromRequest(req);
    const { desde, hasta } = req.query;

    let query = `
      SELECT 
        DATE(v.created_at) as fecha,
        COUNT(*) as cantidad_ventas,
        SUM(v.total) as total_ventas,
        SUM((v.precio_unitario - p.precio_compra) * v.cantidad) as ganancia_neta
      FROM ventas v
      JOIN productos p ON v.producto_id = p.id
    `;

    let params = [];
    const conditions = [];

    if (desde) {
      conditions.push("DATE(v.created_at) >= ?");
      params.push(desde);
    }

    if (hasta) {
      conditions.push("DATE(v.created_at) <= ?");
      params.push(hasta);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " GROUP BY DATE(v.created_at) ORDER BY fecha DESC";

    const reportes = await db.all(query, params);
    res.json(reportes);
  } catch (error) {
    console.error("❌ Error obteniendo reportes:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Eliminar venta
router.delete("/venta/:id", verifyToken, requireAdminOrSupervisor, async (req, res) => {
  try {
    const db = getDbFromRequest(req);
    const { id } = req.params;

    // Obtener la venta antes de eliminarla para devolver el stock
    const venta = await db.get(
      "SELECT producto_id, cantidad FROM ventas WHERE id = ?",
      [id]
    );

    if (!venta) {
      return res.status(404).json({ error: "Venta no encontrada" });
    }

    // Devolver el stock al producto
    await db.run(
      "UPDATE productos SET stock = stock + ? WHERE id = ?",
      [venta.cantidad, venta.producto_id]
    );

    // Eliminar la venta
    await db.run("DELETE FROM ventas WHERE id = ?", [id]);

    res.json({ success: true, message: "Venta eliminada y stock restaurado" });
  } catch (error) {
    console.error("❌ Error eliminando venta:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
