// backend/routes/promociones.js
import express from "express";
import { getDbFromRequest } from "../database/dbManager.js";

const router = express.Router();

// GET all promociones
router.get("/", async (req, res) => {
  try {
    const db = getDbFromRequest(req);
    const promociones = await db.all(
      `SELECT * FROM promociones ORDER BY fecha_inicio DESC`
    );
    res.json(promociones);
  } catch (error) {
    console.error("Error en GET /promociones:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// GET single promocion
router.get("/:id", async (req, res) => {
  try {
    const db = getDbFromRequest(req);
    const { id } = req.params;
    const promocion = await db.get(
      "SELECT * FROM promociones WHERE id = ?",
      id
    );
    
    if (!promocion) {
      return res.status(404).json({ error: "Promoción no encontrada" });
    }
    
    res.json(promocion);
  } catch (error) {
    console.error("Error en GET /promociones/:id:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// POST create promocion
router.post("/", async (req, res) => {
  try {
    const db = getDbFromRequest(req);
    const {
      nombre,
      descripcion,
      precio_cliente_bajo_cc,
      precio_cliente_alto_cc,
      precio_comision_bajo_cc,
      precio_comision_alto_cc,
      duracion,
      activo,
      fecha_inicio,
      fecha_fin,
      imagen,
      imagen_bajo_cc,
      imagen_alto_cc,
    } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: "El nombre es obligatorio" });
    }

    if (!precio_comision_bajo_cc || !precio_comision_alto_cc) {
      return res.status(400).json({
        error: "Los precios de comisión son obligatorios",
      });
    }

    const result = await db.run(
      `INSERT INTO promociones (
        nombre,
        descripcion,
        precio_cliente_bajo_cc,
        precio_cliente_alto_cc,
        precio_comision_bajo_cc,
        precio_comision_alto_cc,
        duracion,
        activo,
        fecha_inicio,
        fecha_fin,
        imagen,
        imagen_bajo_cc,
        imagen_alto_cc
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre,
        descripcion || "",
        precio_cliente_bajo_cc || null,
        precio_cliente_alto_cc || null,
        precio_comision_bajo_cc,
        precio_comision_alto_cc,
        duracion || 60,
        activo !== undefined ? activo : 1,
        fecha_inicio || null,
        fecha_fin || null,
        imagen || null,
        imagen_bajo_cc || null,
        imagen_alto_cc || null,
      ]
    );

    res.status(201).json({
      id: result.lastID,
      message: "Promoción creada exitosamente",
    });
  } catch (error) {
    console.error("Error en POST /promociones:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// PUT update promocion
router.put("/:id", async (req, res) => {
  try {
    const db = getDbFromRequest(req);
    const { id } = req.params;
    const {
      nombre,
      descripcion,
      precio_cliente_bajo_cc,
      precio_cliente_alto_cc,
      precio_comision_bajo_cc,
      precio_comision_alto_cc,
      duracion,
      activo,
      fecha_inicio,
      fecha_fin,
      imagen,
      imagen_bajo_cc,
      imagen_alto_cc,
    } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    if (!nombre) {
      return res.status(400).json({ error: "El nombre es obligatorio" });
    }

    const result = await db.run(
      `UPDATE promociones SET
        nombre = ?,
        descripcion = ?,
        precio_cliente_bajo_cc = ?,
        precio_cliente_alto_cc = ?,
        precio_comision_bajo_cc = ?,
        precio_comision_alto_cc = ?,
        duracion = ?,
        activo = ?,
        fecha_inicio = ?,
        fecha_fin = ?,
        imagen = ?,
        imagen_bajo_cc = ?,
        imagen_alto_cc = ?
      WHERE id = ?`,
      [
        nombre,
        descripcion || "",
        precio_cliente_bajo_cc || null,
        precio_cliente_alto_cc || null,
        precio_comision_bajo_cc,
        precio_comision_alto_cc,
        duracion || 60,
        activo !== undefined ? activo : 1,
        fecha_inicio || null,
        fecha_fin || null,
        imagen || null,
        imagen_bajo_cc || null,
        imagen_alto_cc || null,
        id,
      ]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "Promoción no encontrada" });
    }

    res.json({ message: "Promoción actualizada exitosamente" });
  } catch (error) {
    console.error("Error en PUT /promociones/:id:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// DELETE promocion
router.delete("/:id", async (req, res) => {
  try {
    const db = getDbFromRequest(req);
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const result = await db.run("DELETE FROM promociones WHERE id = ?", id);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Promoción no encontrada" });
    }

    res.json({ message: "Promoción eliminada exitosamente" });
  } catch (error) {
    console.error("Error en DELETE /promociones/:id:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
