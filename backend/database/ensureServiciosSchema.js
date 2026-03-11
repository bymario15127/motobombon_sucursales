// backend/database/ensureServiciosSchema.js
// Añade columnas faltantes en la tabla servicios (precio/imagen por CC y comisión)
// para que POST/PUT de servicios funcionen en BDs creadas con esquema antiguo.

export async function ensureServiciosSchema(db) {
  try {
    const cols = await db.all("PRAGMA table_info(servicios)");
    if (!Array.isArray(cols) || cols.length === 0) return;
    const has = (name) => cols.some((c) => c.name === name);
    const adds = [];
    if (!has("precio_bajo_cc")) adds.push("ALTER TABLE servicios ADD COLUMN precio_bajo_cc REAL");
    if (!has("precio_alto_cc")) adds.push("ALTER TABLE servicios ADD COLUMN precio_alto_cc REAL");
    if (!has("imagen_bajo_cc")) adds.push("ALTER TABLE servicios ADD COLUMN imagen_bajo_cc TEXT");
    if (!has("imagen_alto_cc")) adds.push("ALTER TABLE servicios ADD COLUMN imagen_alto_cc TEXT");
    if (!has("precio_base_comision_bajo")) adds.push("ALTER TABLE servicios ADD COLUMN precio_base_comision_bajo REAL");
    if (!has("precio_base_comision_alto")) adds.push("ALTER TABLE servicios ADD COLUMN precio_base_comision_alto REAL");
    for (const stmt of adds) {
      try {
        await db.exec(stmt);
        console.log("🧩 Migración servicios: columna agregada");
      } catch (e) {
        if (!/duplicate column|already exists/i.test(e.message || "")) console.error("ensureServiciosSchema:", e.message);
      }
    }
  } catch (e) {
    console.error("ensureServiciosSchema:", e.message);
  }
}
