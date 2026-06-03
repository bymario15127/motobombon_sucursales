// backend/database/initLavadores.js
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initLavadores() {
  try {
    const db = await open({
      filename: path.join(__dirname, "database.sqlite"),
      driver: sqlite3.Database,
    });

    // Crear tabla lavadores
    await db.exec(`
      CREATE TABLE IF NOT EXISTS lavadores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        cedula TEXT,
        activo INTEGER DEFAULT 1,
        comision_porcentaje REAL DEFAULT 30.0,
        eliminado INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("✅ Tabla lavadores creada exitosamente");

    // Insertar algunos lavadores de ejemplo si la tabla está vacía
    const count = await db.get("SELECT COUNT(*) as total FROM lavadores");
    
    if (count.total === 0) {
      await db.run(
        "INSERT INTO lavadores (nombre, cedula, activo, comision_porcentaje) VALUES (?, ?, ?, ?)",
        ["Juan Pérez", "1234567890", 1, 30.0]
      );
      
      await db.run(
        "INSERT INTO lavadores (nombre, cedula, activo, comision_porcentaje) VALUES (?, ?, ?, ?)",
        ["María García", "9876543210", 1, 30.0]
      );
      
      console.log("✅ Lavadores de ejemplo insertados");
    } else {
      console.log(`ℹ️ La tabla lavadores ya tiene ${count.total} registro(s)`);
    }

    await db.close();
  } catch (error) {
    console.error("❌ Error al inicializar tabla lavadores:", error);
    process.exit(1);
  }
}

initLavadores();
