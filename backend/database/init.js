// backend/database/init.js
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function init() {
  try {
    const db = await open({
      filename: path.join(__dirname, "database.sqlite"),
      driver: sqlite3.Database,
    });

    // Crear tabla citas con todas las columnas necesarias
    await db.exec(`
      CREATE TABLE IF NOT EXISTS citas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente TEXT NOT NULL,
        fecha TEXT NOT NULL,
        hora TEXT NOT NULL,
        servicio TEXT NOT NULL,
        telefono TEXT,
        email TEXT,
        comentarios TEXT,
        estado TEXT DEFAULT 'pendiente',
        deleted_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear tabla servicios
    await db.exec(`
      CREATE TABLE IF NOT EXISTS servicios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        duracion INTEGER NOT NULL,
        precio REAL NOT NULL,
        descripcion TEXT,
        imagen TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("✅ Base de datos y tablas creadas exitosamente");
    await db.close();
  } catch (error) {
    console.error("❌ Error al inicializar base de datos:", error);
  }
}

init();
