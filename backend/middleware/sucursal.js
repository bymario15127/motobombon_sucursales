// backend/middleware/sucursal.js
import { getDbConnection } from '../database/dbManager.js';

/**
 * Middleware para identificar la sucursal y adjuntar su BD al request
 * La sucursal puede venir de:
 * 1. Header 'X-Sucursal-Id'
 * 2. Query param '?sucursalId=xxx'
 * 3. Body 'sucursalId'
 */
export async function sucursalMiddleware(req, res, next) {
  try {
    // Intentar obtener sucursalId de diferentes fuentes
    let sucursalId = 
      req.headers['x-sucursal-id'] || 
      req.query.sucursalId || 
      req.body?.sucursalId;

    // Si no se proporciona sucursalId, usar sucursal1 por defecto (compatibilidad)
    if (!sucursalId) {
      console.warn('⚠️ No se especificó sucursalId, usando sucursal1 por defecto');
      sucursalId = 'sucursal1';
    }

    // Validar formato de sucursalId
    if (!sucursalId.match(/^sucursal[12]$/)) {
      return res.status(400).json({ 
        error: 'sucursalId inválido. Use: sucursal1 o sucursal2' 
      });
    }

    // Obtener conexión a la BD de la sucursal
    const db = await getDbConnection(sucursalId);
    
    // Adjuntar al request para uso en las rutas
    req.db = db;
    req.sucursalId = sucursalId;
    
    // Log solo en desarrollo
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🏢 Sucursal: ${sucursalId} | ${req.method} ${req.path}`);
    }
    
    next();
  } catch (error) {
    console.error('❌ Error en middleware de sucursal:', error.message);
    res.status(500).json({ 
      error: 'Error al conectar con la base de datos de la sucursal',
      details: error.message 
    });
  }
}

/**
 * Middleware opcional para rutas que NO requieren sucursal
 * (como login de admin)
 */
export function noSucursalRequired(req, res, next) {
  next();
}

export default sucursalMiddleware;
