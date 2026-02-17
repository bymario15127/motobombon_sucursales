// backend/routes/talleres.js
import express from "express";
import { getDbFromRequest } from "../database/dbManager.js";

const router = express.Router();

// GET all talleres activos
router.get("/", async (req, res) => {
  try {
    const db = getDbFromRequest(req);
    const talleres = await db.all("SELECT * FROM talleres WHERE activo = 1 ORDER BY nombre");
    res.json(talleres);
  } catch (error) {
    console.error("Error al obtener talleres:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// GET all talleres (incluyendo inactivos) - solo para admin
router.get("/admin/all", async (req, res) => {
  try {
    const db = getDbFromRequest(req);
    const talleres = await db.all("SELECT * FROM talleres ORDER BY nombre");
    res.json(talleres);
  } catch (error) {
    console.error("Error al obtener talleres:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// POST create taller
router.post("/", async (req, res) => {
  try {
    const db = getDbFromRequest(req);
    const { nombre, contacto, telefono, email, precio_bajo_cc, precio_alto_cc } = req.body;
    
    if (!nombre) {
      return res.status(400).json({ error: "El nombre del taller es obligatorio" });
    }
    
    const result = await db.run(
      "INSERT INTO talleres (nombre, contacto, telefono, email, precio_bajo_cc, precio_alto_cc, activo) VALUES (?, ?, ?, ?, ?, ?, 1)",
      [nombre, contacto || "", telefono || "", email || "", precio_bajo_cc || null, precio_alto_cc || null]
    );
    
    res.status(201).json({ id: result.lastID, message: "Taller creado exitosamente" });
  } catch (error) {
    console.error("Error al crear taller:", error);
    if (error.message.includes("UNIQUE")) {
      return res.status(400).json({ error: "Ya existe un taller con ese nombre" });
    }
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// PUT update taller
router.put("/:id", async (req, res) => {
  try {
    const db = getDbFromRequest(req);
    const { id } = req.params;
    const { nombre, contacto, telefono, email, precio_bajo_cc, precio_alto_cc, activo } = req.body;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: "ID de taller inválido" });
    }
    
    const result = await db.run(
      "UPDATE talleres SET nombre = ?, contacto = ?, telefono = ?, email = ?, precio_bajo_cc = ?, precio_alto_cc = ?, activo = ? WHERE id = ?",
      [nombre, contacto || "", telefono || "", email || "", precio_bajo_cc || null, precio_alto_cc || null, activo !== undefined ? activo : 1, id]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: "Taller no encontrado" });
    }
    
    res.json({ message: "Taller actualizado exitosamente" });
  } catch (error) {
    console.error("Error al actualizar taller:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// DELETE taller (eliminación permanente)
router.delete("/:id", async (req, res) => {
  try {
    const db = getDbFromRequest(req);
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: "ID de taller inválido" });
    }
    
    const result = await db.run(
      "DELETE FROM talleres WHERE id = ?",
      [id]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: "Taller no encontrado" });
    }
    
    res.json({ message: "Taller eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar taller:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
