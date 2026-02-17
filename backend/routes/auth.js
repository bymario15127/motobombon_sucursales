// routes/auth.js
import express from 'express';
import jwt from 'jsonwebtoken';
import { getDbConnection } from '../database/dbManager.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'cambiar-este-secret-en-produccion';

router.post('/login', async (req, res) => {
  try {
    const { username, password, sucursalId } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    if (!sucursalId) {
      return res.status(400).json({ error: 'Debe seleccionar una sucursal' });
    }
    
    // Obtener la conexión a la BD de la sucursal
    const db = await getDbConnection(sucursalId);
    
    // Buscar usuario en la base de datos de la sucursal
    const user = await db.get(
      'SELECT * FROM usuarios WHERE username = ? AND activo = 1',
      [username.toLowerCase()]
    );
    
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    // Comparar contraseña (en producción debería usar bcrypt)
    if (user.password !== password) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    // Generar JWT incluyendo la sucursal
    const token = jwt.sign(
      { 
        username: user.username, 
        role: user.role, 
        name: user.name,
        sucursalId: sucursalId 
      },
      JWT_SECRET,
      { expiresIn: '24h' } // Token válido por 24 horas
    );
    
    res.json({
      token,
      user: {
        username: user.username,
        role: user.role,
        name: user.name,
        sucursalId: sucursalId
      }
    });
    
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Verificar token
router.get('/verify', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ error: 'Token inválido', valid: false });
  }
});

export default router;
