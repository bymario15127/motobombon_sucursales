// backend/database/initSucursales.js
// Script para inicializar las bases de datos de cada sucursal
import { getDbConnection, getAllSucursales } from './dbManager.js';

/**
 * Inicializar todas las tablas necesarias para una sucursal
 */
async function initSucursalDb(sucursalId) {
  console.log(`\n🔧 Inicializando BD para ${sucursalId}...`);
  
  try {
    const db = await getDbConnection(sucursalId);

    // Tabla de citas
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
        placa TEXT,
        marca TEXT,
        modelo TEXT,
        cilindraje INTEGER,
        metodo_pago TEXT,
        lavador_id INTEGER,
        tipo_cliente TEXT DEFAULT 'cliente',
        taller_id INTEGER,
        promocion_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de servicios
    await db.exec(`
      CREATE TABLE IF NOT EXISTS servicios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        duracion INTEGER NOT NULL,
        precio REAL NOT NULL,
        descripcion TEXT,
        imagen TEXT,
        activo INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de lavadores
    await db.exec(`
      CREATE TABLE IF NOT EXISTS lavadores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE,
        cedula TEXT,
        telefono TEXT,
        email TEXT,
        activo INTEGER DEFAULT 1,
        comision_porcentaje REAL DEFAULT 30.0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Parchear columnas faltantes en lavadores para instalaciones antiguas
    try {
      const colsLavadores = await db.all("PRAGMA table_info(lavadores)");
      const hasLavCol = (n) => Array.isArray(colsLavadores) && colsLavadores.some(c => c.name === n);
      const alterLavadores = [];
      if (!hasLavCol('cedula')) alterLavadores.push("ALTER TABLE lavadores ADD COLUMN cedula TEXT");
      if (!hasLavCol('comision_porcentaje')) alterLavadores.push("ALTER TABLE lavadores ADD COLUMN comision_porcentaje REAL DEFAULT 30.0");

      for (const stmt of alterLavadores) {
        try {
          await db.exec(stmt);
        } catch (e) {
          if (!/duplicate column|already exists/i.test(e.message || "")) {
            console.error("Error aplicando parche de esquema en lavadores:", e.message);
          }
        }
      }
    } catch (e) {
      console.error("No se pudo asegurar columnas de lavadores:", e.message);
    }

    // Tabla de talleres
    await db.exec(`
      CREATE TABLE IF NOT EXISTS talleres (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        direccion TEXT,
        telefono TEXT,
        email TEXT,
        contacto TEXT,
        precio_bajo_cc REAL,
        precio_alto_cc REAL,
        activo INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Parchear columnas faltantes en talleres para instalaciones antiguas
    try {
      const colsTalleres = await db.all("PRAGMA table_info(talleres)");
      const hasTallerCol = (n) => Array.isArray(colsTalleres) && colsTalleres.some(c => c.name === n);
      const alterTalleres = [];
      if (!hasTallerCol('precio_bajo_cc')) alterTalleres.push("ALTER TABLE talleres ADD COLUMN precio_bajo_cc REAL");
      if (!hasTallerCol('precio_alto_cc')) alterTalleres.push("ALTER TABLE talleres ADD COLUMN precio_alto_cc REAL");

      for (const stmt of alterTalleres) {
        try {
          await db.exec(stmt);
        } catch (e) {
          if (!/duplicate column|already exists/i.test(e.message || "")) {
            console.error("Error aplicando parche de esquema en talleres:", e.message);
          }
        }
      }
    } catch (e) {
      console.error("No se pudo asegurar columnas de talleres:", e.message);
    }

    // Tabla de clientes
    await db.exec(`
      CREATE TABLE IF NOT EXISTS clientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        nombre TEXT NOT NULL,
        telefono TEXT,
        lavadas_completadas INTEGER DEFAULT 0,
        lavadas_gratis_pendientes INTEGER DEFAULT 0,
        total_lavadas_historico INTEGER DEFAULT 0,
        ultima_lavada_gratis TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Parchear columnas faltantes en clientes para instalaciones antiguas
    try {
      const colsClientes = await db.all("PRAGMA table_info(clientes)");
      const hasClienteCol = (n) => Array.isArray(colsClientes) && colsClientes.some(c => c.name === n);
      const alterClientes = [];
      if (!hasClienteCol('email')) alterClientes.push("ALTER TABLE clientes ADD COLUMN email TEXT");
      if (!hasClienteCol('lavadas_completadas')) alterClientes.push("ALTER TABLE clientes ADD COLUMN lavadas_completadas INTEGER DEFAULT 0");
      if (!hasClienteCol('lavadas_gratis_pendientes')) alterClientes.push("ALTER TABLE clientes ADD COLUMN lavadas_gratis_pendientes INTEGER DEFAULT 0");
      if (!hasClienteCol('total_lavadas_historico')) alterClientes.push("ALTER TABLE clientes ADD COLUMN total_lavadas_historico INTEGER DEFAULT 0");
      if (!hasClienteCol('ultima_lavada_gratis')) alterClientes.push("ALTER TABLE clientes ADD COLUMN ultima_lavada_gratis TEXT");
      if (!hasClienteCol('updated_at')) alterClientes.push("ALTER TABLE clientes ADD COLUMN updated_at DATETIME");

      for (const stmt of alterClientes) {
        try {
          await db.exec(stmt);
        } catch (e) {
          if (!/duplicate column|already exists/i.test(e.message || "")) {
            console.error("Error aplicando parche de esquema en clientes:", e.message);
          }
        }
      }

      if (!hasClienteCol('updated_at')) {
        try {
          await db.exec("UPDATE clientes SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL");
        } catch (e) {
          console.error("Error inicializando updated_at en clientes:", e.message);
        }
      }
    } catch (e) {
      console.error("No se pudo asegurar columnas de clientes:", e.message);
    }

    // Tabla de cupones (fidelización)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS cupones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo TEXT NOT NULL UNIQUE,
        email_cliente TEXT NOT NULL,
        usado INTEGER DEFAULT 0,
        fecha_emision TEXT,
        fecha_uso TEXT,
        cita_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de productos
    await db.exec(`
      CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        categoria TEXT,
        precio REAL,
        precio_compra REAL,
        precio_venta REAL,
        stock INTEGER DEFAULT 0,
        imagen TEXT,
        activo INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Parchear columnas faltantes en productos para instalaciones antiguas
    try {
      const colsProductos = await db.all("PRAGMA table_info(productos)");
      const hasProdCol = (n) => Array.isArray(colsProductos) && colsProductos.some(c => c.name === n);
      const alterProductos = [];
      if (!hasProdCol('precio_compra')) alterProductos.push("ALTER TABLE productos ADD COLUMN precio_compra REAL");
      if (!hasProdCol('precio_venta')) alterProductos.push("ALTER TABLE productos ADD COLUMN precio_venta REAL");
      if (!hasProdCol('updated_at')) alterProductos.push("ALTER TABLE productos ADD COLUMN updated_at DATETIME");

      for (const stmt of alterProductos) {
        try {
          await db.exec(stmt);
        } catch (e) {
          if (!/duplicate column|already exists/i.test(e.message || "")) {
            console.error("Error aplicando parche de esquema en productos:", e.message);
          }
        }
      }

      if (!hasProdCol('updated_at')) {
        try {
          await db.exec("UPDATE productos SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL");
        } catch (e) {
          console.error("Error inicializando updated_at en productos:", e.message);
        }
      }
    } catch (e) {
      console.error("No se pudo asegurar columnas de productos:", e.message);
    }

    // Tabla de ventas de productos
    await db.exec(`
      CREATE TABLE IF NOT EXISTS ventas_productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        producto_id INTEGER NOT NULL,
        cantidad INTEGER NOT NULL,
        precio_unitario REAL NOT NULL,
        precio_total REAL NOT NULL,
        metodo_pago TEXT,
        cliente_nombre TEXT,
        cliente_telefono TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (producto_id) REFERENCES productos(id)
      )
    `);

    // Tabla ventas (usada por finanzas/productos)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS ventas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        producto_id INTEGER NOT NULL,
        cantidad INTEGER NOT NULL,
        precio_unitario REAL NOT NULL,
        total REAL NOT NULL,
        metodo_pago TEXT DEFAULT 'efectivo',
        registrado_por TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (producto_id) REFERENCES productos(id)
      )
    `);

    // Tabla de finanzas/gastos
    await db.exec(`
      CREATE TABLE IF NOT EXISTS finanzas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tipo TEXT NOT NULL,
        categoria TEXT,
        monto REAL NOT NULL,
        descripcion TEXT,
        fecha TEXT NOT NULL,
        metodo_pago TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla gastos (usada por finanzas)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS gastos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tipo TEXT DEFAULT 'gasto',
        categoria TEXT,
        monto REAL NOT NULL,
        descripcion TEXT,
        fecha TEXT NOT NULL,
        metodo_pago TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla utilidades mensuales (cierre de mes)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS utilidades_mensuales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mes INTEGER NOT NULL,
        anio INTEGER NOT NULL,
        utilidad_neta REAL NOT NULL,
        ingresos_totales REAL NOT NULL,
        gastos_totales REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de nómina
    await db.exec(`
      CREATE TABLE IF NOT EXISTS nomina (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lavador_id INTEGER NOT NULL,
        periodo TEXT NOT NULL,
        total_servicios INTEGER DEFAULT 0,
        monto_base REAL DEFAULT 0,
        bonificaciones REAL DEFAULT 0,
        deducciones REAL DEFAULT 0,
        total REAL NOT NULL,
        estado TEXT DEFAULT 'pendiente',
        fecha_pago TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lavador_id) REFERENCES lavadores(id)
      )
    `);

    // Tabla de promociones
    await db.exec(`
      CREATE TABLE IF NOT EXISTS promociones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tipo TEXT NOT NULL,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        descuento REAL,
        lavadas_requeridas INTEGER,
        fecha_inicio TEXT,
        fecha_fin TEXT,
        activo INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de usuarios (admin/supervisor por sucursal)
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

    console.log(`✅ ${sucursalId}: Tablas creadas exitosamente`);
    
  } catch (error) {
    console.error(`❌ Error inicializando ${sucursalId}:`, error.message);
    throw error;
  }
}

/**
 * Inicializar todas las sucursales
 */
async function initAllSucursales() {
  console.log('🚀 Iniciando configuración de bases de datos multisucursal...\n');
  
  const sucursales = getAllSucursales();
  
  for (const sucursal of sucursales) {
    try {
      await initSucursalDb(sucursal.id);
    } catch (error) {
      console.error(`❌ Falló inicialización de ${sucursal.id}`);
    }
  }
  
  console.log('\n✅ Inicialización de todas las sucursales completada');
  process.exit(0);
}

// Ejecutar automáticamente cuando se corra este script
initAllSucursales().catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});

export { initSucursalDb, initAllSucursales };
