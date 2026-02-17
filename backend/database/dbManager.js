// backend/database/dbManager.js
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";
import { ensureFinanzasSchema } from "./ensureFinanzasSchema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache de conexiones por sucursal
const dbConnections = {};

// Configuración de sucursales
const sucursalesConfig = {
  sucursal1: {
    id: 'sucursal1',
    nombre: 'Sucursal Centro',
    dbFile: 'database_centro.sqlite'
  },
  sucursal2: {
    id: 'sucursal2',
    nombre: 'Sucursal Sur',
    dbFile: 'database_sur.sqlite'
  }
};

/**
 * Obtener conexión a la base de datos de una sucursal específica
 * @param {string} sucursalId - ID de la sucursal (sucursal1, sucursal2, etc.)
 * @returns {Promise<Database>} Conexión a la base de datos
 */
export async function getDbConnection(sucursalId) {
  // Validar que la sucursal exista
  if (!sucursalesConfig[sucursalId]) {
    throw new Error(`Sucursal no válida: ${sucursalId}`);
  }

  // Si ya existe la conexión en cache, reutilizarla
  if (dbConnections[sucursalId]) {
    return dbConnections[sucursalId];
  }

  // Crear nueva conexión
  const config = sucursalesConfig[sucursalId];
  const dbPath = path.join(__dirname, config.dbFile);
  
  console.log(`📂 Conectando a BD de ${config.nombre}: ${config.dbFile}`);
  
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  await ensureFinanzasSchema(db);

  // Guardar en cache
  dbConnections[sucursalId] = db;
  
  return db;
}

/**
 * Obtener la base de datos desde el objeto de request
 * (El middleware sucursal.js debe haberla agregado)
 */
export function getDbFromRequest(req) {
  if (!req.db) {
    throw new Error('Base de datos no disponible en request. ¿Middleware de sucursal configurado?');
  }
  return req.db;
}

/**
 * Cerrar todas las conexiones (útil para shutdown)
 */
export async function closeAllConnections() {
  console.log('🔌 Cerrando todas las conexiones a bases de datos...');
  for (const [sucursalId, db] of Object.entries(dbConnections)) {
    try {
      await db.close();
      console.log(`✅ Cerrada conexión de ${sucursalId}`);
    } catch (error) {
      console.error(`❌ Error cerrando ${sucursalId}:`, error.message);
    }
  }
  // Limpiar cache
  Object.keys(dbConnections).forEach(key => delete dbConnections[key]);
}

/**
 * Obtener configuración de una sucursal
 */
export function getSucursalConfig(sucursalId) {
  return sucursalesConfig[sucursalId];
}

/**
 * Obtener lista de todas las sucursales
 */
export function getAllSucursales() {
  return Object.values(sucursalesConfig);
}

export default {
  getDbConnection,
  getDbFromRequest,
  closeAllConnections,
  getSucursalConfig,
  getAllSucursales
};
