// routes/auth.js
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getDbConnection } from '../database/dbManager.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'cambiar-este-secret-en-produccion';

const DEFAULT_USERS_BY_SUCURSAL = {
  sucursal1: [
    {
      username: 'admin_centro',
      password: 'centro123',
      role: 'admin',
      name: 'Admin Centro',
      email: 'admin_centro@motobombon.com'
    },
    {
      username: 'supervisor_centro',
      password: 'supervisor_centro',
      role: 'supervisor',
      name: 'Supervisor Centro',
      email: 'supervisor_centro@motobombon.com'
    }
  ],
  sucursal2: [
    {
      username: 'admin_sur',
      password: 'Bombonsur2026*',
      role: 'admin',
      name: 'Admin Sur',
      email: 'admin_sur@motobombon.com'
    },
    {
      username: 'supervisor_sur',
      password: 'supervisor_sur',
      role: 'supervisor',
      name: 'Supervisor Sur',
      email: 'supervisor_sur@motobombon.com'
    }
  ]
};

async function ensureDefaultUsers(db, sucursalId) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      activo INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const countUsuarios = await db.get('SELECT COUNT(*) as count FROM usuarios');
  if ((countUsuarios?.count || 0) > 0) return;

  const defaultUsers = DEFAULT_USERS_BY_SUCURSAL[sucursalId] || [];
  for (const user of defaultUsers) {
    // Guardar contraseñas por defecto usando hash bcrypt
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await db.run(
      `INSERT INTO usuarios (username, password, role, name, email, activo)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [user.username, hashedPassword, user.role, user.name, user.email]
    );
  }

  if (defaultUsers.length > 0) {
    console.log(`✅ Usuarios por defecto creados para ${sucursalId}`);
  }
}

router.post('/login', async (req, res) => {
  try {
    const { username, password, sucursalId } = req.body;
    const normalizedUsername = (username || '').trim().toLowerCase();
    
    if (!normalizedUsername || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    if (!sucursalId) {
      return res.status(400).json({ error: 'Debe seleccionar una sucursal' });
    }
    
    // Obtener la conexión a la BD de la sucursal
    const db = await getDbConnection(sucursalId);
    await ensureDefaultUsers(db, sucursalId);
    
    // Buscar usuario en la base de datos de la sucursal
    const user = await db.get(
      'SELECT * FROM usuarios WHERE username = ? AND activo = 1',
      [normalizedUsername]
    );
    
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    // Comparar contraseña:
    // - Si está hasheada con bcrypt, usar bcrypt.compare
    // - Si no, comparar en texto plano (compatibilidad con BDs antiguas)
    let passwordOk = false;
    const stored = user.password || '';

    if (stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')) {
      passwordOk = await bcrypt.compare(password, stored);
    } else {
      passwordOk = stored === password;
    }

    if (!passwordOk) {
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
