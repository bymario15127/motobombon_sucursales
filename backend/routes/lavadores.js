// backend/routes/lavadores.js
import express from "express";
import { getDbFromRequest } from "../database/dbManager.js";

const router = express.Router();

// GET todos los lavadores
router.get("/", async (req, res) => {
  try {
    const db = getDbFromRequest(req);
    const lavadores = await db.all("SELECT * FROM lavadores ORDER BY nombre");
    res.json(lavadores);
  } catch (error) {
    console.error("Error al obtener lavadores:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// GET solo lavadores activos
router.get("/activos", async (req, res) => {
  try {
    const db = getDbFromRequest(req);
    const lavadores = await db.all("SELECT * FROM lavadores WHERE activo = 1 ORDER BY nombre");
    res.json(lavadores);
  } catch (error) {
    console.error("Error al obtener lavadores activos:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// POST crear lavador
router.post("/", async (req, res) => {
  try {
    const db = getDbFromRequest(req);
    const { nombre, cedula, activo, comision_porcentaje } = req.body;
    
    if (!nombre) {
      return res.status(400).json({ error: "El nombre es obligatorio" });
    }
    
    const result = await db.run(
      "INSERT INTO lavadores (nombre, cedula, activo, comision_porcentaje) VALUES (?, ?, ?, ?)",
      [nombre, cedula || null, activo !== undefined ? activo : 1, comision_porcentaje || 30.0]
    );
    
    res.status(201).json({ id: result.lastID, message: "Lavador creado exitosamente" });
  } catch (error) {
    console.error("Error al crear lavador:", error.message);
    res.status(500).json({ error: error.message || "Error interno del servidor" });
  }
});

// PUT actualizar lavador
router.put("/:id", async (req, res) => {
  try {
    const db = getDbFromRequest(req);
    const { id } = req.params;
    const { nombre, cedula, activo, comision_porcentaje } = req.body;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: "ID de lavador inválido" });
    }
    
    if (!nombre) {
      return res.status(400).json({ error: "El nombre es obligatorio" });
    }
    
    const result = await db.run(
      "UPDATE lavadores SET nombre = ?, cedula = ?, activo = ?, comision_porcentaje = ? WHERE id = ?",
      [nombre, cedula || null, activo !== undefined ? activo : 1, comision_porcentaje || 30.0, id]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: "Lavador no encontrado" });
    }
    
    res.json({ message: "Lavador actualizado exitosamente" });
  } catch (error) {
    console.error("Error al actualizar lavador:", error.message);
    res.status(500).json({ error: error.message || "Error interno del servidor" });
  }
});

// DELETE lavador (eliminación lógica, marcarlo como inactivo)
router.delete("/:id", async (req, res) => {
  try {
    const db = getDbFromRequest(req);
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: "ID de lavador inválido" });
    }
    
    // Marcarlo como inactivo en lugar de eliminarlo
    const result = await db.run("UPDATE lavadores SET activo = 0 WHERE id = ?", id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: "Lavador no encontrado" });
    }
    
    res.json({ message: "Lavador desactivado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar lavador:", error.message);
    res.status(500).json({ error: error.message || "Error interno del servidor" });
  }
});

export default router;
