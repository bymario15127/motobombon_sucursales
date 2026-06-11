// backend/database/initAll.js
// Script para inicializar toda la base de datos de una sola vez
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initAll() {
  try {
    const db = await open({
      filename: path.join(__dirname, "database.sqlite"),
      driver: sqlite3.Database,
    });

    console.log("🔄 Inicializando base de datos completa...\n");

    // 1. Crear tabla citas
    await db.exec(`
      CREATE TABLE IF NOT EXISTS citas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente TEXT NOT NULL,
        fecha TEXT NOT NULL,
        hora TEXT,
        servicio TEXT NOT NULL,
        lavador_id INTEGER,
        telefono TEXT,
        cedula TEXT,
        email TEXT,
        placa TEXT,
        marca TEXT,
        modelo TEXT,
        cilindraje INTEGER,
        comentarios TEXT,
        estado TEXT DEFAULT 'pendiente',
        metodo_pago TEXT,
        deleted_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lavador_id) REFERENCES lavadores(id)
      )
    `);
    console.log("✅ Tabla 'citas' creada");

    // 2. Crear tabla lavadores
    await db.exec(`
      CREATE TABLE IF NOT EXISTS lavadores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        cedula TEXT UNIQUE,
        activo INTEGER DEFAULT 1,
        comision_porcentaje REAL DEFAULT 30.0,
        eliminado INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Tabla 'lavadores' creada");

    // Insertar lavadores de ejemplo si la tabla está vacía
    const lavadorCount = await db.get("SELECT COUNT(*) as total FROM lavadores");
    if (lavadorCount.total === 0) {
      await db.run(
        "INSERT INTO lavadores (nombre, cedula, activo, comision_porcentaje) VALUES (?, ?, ?, ?)",
        ["Juan Pérez", "1234567890", 1, 30.0]
      );
      await db.run(
        "INSERT INTO lavadores (nombre, cedula, activo, comision_porcentaje) VALUES (?, ?, ?, ?)",
        ["María García", "9876543210", 1, 30.0]
      );
      console.log("✅ Lavadores de ejemplo insertados");
    }

    // 3. Crear tabla servicios
    await db.exec(`
      CREATE TABLE IF NOT EXISTS servicios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        duracion INTEGER NOT NULL,
        precio REAL,
        descripcion TEXT,
        imagen TEXT,
        precio_bajo_cc REAL,
        precio_alto_cc REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Tabla 'servicios' creada");

    // Insertar servicios de ejemplo si la tabla está vacía
    const servicioCount = await db.get("SELECT COUNT(*) as count FROM servicios");
    if (servicioCount.count === 0) {
      const serviciosDefault = [
        {
          nombre: "Lavado Básico Moto",
          duracion: 30,
          precio: null,
          precio_bajo_cc: 15000,
          precio_alto_cc: 20000,
          descripcion: "Lavado exterior completo de moto",
          imagen: "/img/lavado-basico.jpg"
        },
        {
          nombre: "Lavado Premium Moto",
          duracion: 60,
          precio: null,
          precio_bajo_cc: 25000,
          precio_alto_cc: 35000,
          descripcion: "Lavado completo con encerado y detalles",
          imagen: "/img/lavado-premium.jpg"
        },
        {
          nombre: "Lavado Express",
          duracion: 20,
          precio: 10000,
          precio_bajo_cc: null,
          precio_alto_cc: null,
          descripcion: "Lavado rápido exterior",
          imagen: "/img/lavado-express.jpg"
        },
        {
          nombre: "Detallado Completo",
          duracion: 90,
          precio: null,
          precio_bajo_cc: 40000,
          precio_alto_cc: 60000,
          descripcion: "Lavado completo con pulido y protección",
          imagen: "/img/detallado.jpg"
        }
      ];

      for (const servicio of serviciosDefault) {
        await db.run(
          "INSERT INTO servicios (nombre, duracion, precio, precio_bajo_cc, precio_alto_cc, descripcion, imagen) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [servicio.nombre, servicio.duracion, servicio.precio, servicio.precio_bajo_cc, servicio.precio_alto_cc, servicio.descripcion, servicio.imagen]
        );
      }
      console.log("✅ Servicios de ejemplo insertados");
    }

    // 4. Crear tabla talleres
    await db.exec(`
      CREATE TABLE IF NOT EXISTS talleres (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE,
        contacto TEXT,
        telefono TEXT,
        email TEXT,
        precio_bajo_cc REAL,
        precio_alto_cc REAL,
        activo INTEGER DEFAULT 1,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Tabla 'talleres' creada");

    // 5. Agregar columna tipo_cliente a citas si no existe
    try {
      await db.exec("ALTER TABLE citas ADD COLUMN tipo_cliente TEXT DEFAULT 'cliente'");
      console.log("✅ Columna tipo_cliente agregada a citas");
    } catch (error) {
      if (!error.message.includes("duplicate column")) {
        console.log("ℹ️ La columna tipo_cliente ya existe");
      }
    }

    // 6. Crear tabla nomina
    await db.exec(`
      CREATE TABLE IF NOT EXISTS nomina (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lavador_id INTEGER NOT NULL,
        mes INTEGER NOT NULL,
        ano INTEGER NOT NULL,
        total_citas INTEGER DEFAULT 0,
        total_ganancia REAL DEFAULT 0,
        comisiones_generadas REAL DEFAULT 0,
        estado TEXT DEFAULT 'pendiente',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lavador_id) REFERENCES lavadores(id),
        UNIQUE(lavador_id, mes, ano)
      )
    `);
    console.log("✅ Tabla 'nomina' creada");

    // 7. Crear tabla productos
    await db.exec(`
      CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE,
        precio_compra REAL NOT NULL,
        precio_venta REAL NOT NULL,
        stock INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Tabla 'productos' creada");

    // 8. Crear tabla ventas
    await db.exec(`
      CREATE TABLE IF NOT EXISTS ventas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        producto_id INTEGER NOT NULL,
        cantidad INTEGER NOT NULL,
        precio_unitario REAL NOT NULL,
        total REAL NOT NULL,
        registrado_por TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (producto_id) REFERENCES productos(id)
      )
    `);
    console.log("✅ Tabla 'ventas' creada");

    console.log("\n🎉 Base de datos inicializada correctamente!");
    await db.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error al inicializar base de datos:", error.message);
    process.exit(1);
  }
}

initAll();
