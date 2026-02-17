// backend/database/ensureFinanzasSchema.js

const expectedGastosColumns = [
  { name: "tipo", ddl: "tipo TEXT NOT NULL" },
  { name: "categoria", ddl: "categoria TEXT NOT NULL" },
  { name: "descripcion", ddl: "descripcion TEXT NOT NULL" },
  { name: "monto", ddl: "monto REAL NOT NULL" },
  { name: "fecha", ddl: "fecha DATE NOT NULL" },
  { name: "empleado_id", ddl: "empleado_id INTEGER" },
  { name: "metodo_pago", ddl: "metodo_pago TEXT" },
  { name: "estado", ddl: "estado TEXT DEFAULT 'completado'" },
  { name: "notas", ddl: "notas TEXT" },
  { name: "registrado_por", ddl: "registrado_por TEXT" },
  { name: "created_at", ddl: "created_at DATETIME DEFAULT CURRENT_TIMESTAMP" },
  { name: "updated_at", ddl: "updated_at DATETIME DEFAULT CURRENT_TIMESTAMP" }
];

async function ensureGastosTable(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS gastos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT NOT NULL,
      categoria TEXT NOT NULL,
      descripcion TEXT NOT NULL,
      monto REAL NOT NULL,
      fecha DATE NOT NULL,
      empleado_id INTEGER,
      metodo_pago TEXT,
      estado TEXT DEFAULT 'completado',
      notas TEXT,
      registrado_por TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const columns = await db.all("PRAGMA table_info(gastos)");
  const columnNames = new Set(columns.map((col) => col.name));

  for (const column of expectedGastosColumns) {
    if (!columnNames.has(column.name)) {
      await db.exec(`ALTER TABLE gastos ADD COLUMN ${column.ddl}`);
      console.log(`🧩 Migración finanzas: columna '${column.name}' agregada a gastos`);
    }
  }

  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_gastos_fecha ON gastos(fecha);
    CREATE INDEX IF NOT EXISTS idx_gastos_tipo ON gastos(tipo);
    CREATE INDEX IF NOT EXISTS idx_gastos_categoria ON gastos(categoria);
    CREATE INDEX IF NOT EXISTS idx_gastos_empleado ON gastos(empleado_id);
  `);
}

async function ensureUtilidadesMensuales(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS utilidades_mensuales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mes INTEGER NOT NULL,
      anio INTEGER NOT NULL,
      utilidad_neta REAL NOT NULL,
      ingresos_totales REAL NOT NULL,
      gastos_totales REAL NOT NULL,
      utilidad_mes_anterior REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(mes, anio)
    )
  `);

  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_utilidades_mes_anio ON utilidades_mensuales(mes, anio);
    CREATE INDEX IF NOT EXISTS idx_utilidades_anio ON utilidades_mensuales(anio);
  `);

  const indexList = await db.all("PRAGMA index_list('utilidades_mensuales')");
  const hasUniqueIndex = indexList.some((idx) => idx.unique === 1);

  if (!hasUniqueIndex) {
    const duplicates = await db.all(`
      SELECT mes, anio, COUNT(*) as total
      FROM utilidades_mensuales
      GROUP BY mes, anio
      HAVING total > 1
    `);

    for (const duplicate of duplicates) {
      await db.run(
        `DELETE FROM utilidades_mensuales
         WHERE mes = ? AND anio = ?
           AND id NOT IN (
             SELECT MAX(id) FROM utilidades_mensuales WHERE mes = ? AND anio = ?
           )`,
        [duplicate.mes, duplicate.anio, duplicate.mes, duplicate.anio]
      );
      console.log(`🧹 Migración finanzas: duplicados limpiados en utilidades_mensuales (${duplicate.mes}/${duplicate.anio})`);
    }

    try {
      await db.exec(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_utilidades_mes_anio_unique ON utilidades_mensuales(mes, anio)"
      );
      console.log("🧩 Migración finanzas: índice único creado en utilidades_mensuales (mes, anio)");
    } catch (error) {
      console.warn("⚠️ No se pudo crear índice único en utilidades_mensuales:", error.message);
    }
  }
}

export async function ensureFinanzasSchema(db) {
  await ensureGastosTable(db);
  await ensureUtilidadesMensuales(db);
}
