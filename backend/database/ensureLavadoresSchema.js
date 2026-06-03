// backend/database/ensureLavadoresSchema.js
// Añade la columna 'eliminado' a la tabla de lavadores si no existe.

export async function ensureLavadoresSchema(db) {
  try {
    const cols = await db.all("PRAGMA table_info(lavadores)");
    if (!Array.isArray(cols) || cols.length === 0) return;
    const has = (name) => cols.some((c) => c.name === name);
    const adds = [];
    
    if (!has("eliminado")) {
      adds.push("ALTER TABLE lavadores ADD COLUMN eliminado INTEGER DEFAULT 0");
    }
    
    for (const stmt of adds) {
      try {
        await db.exec(stmt);
        console.log("🧩 Migración lavadores: columna 'eliminado' agregada");
      } catch (e) {
        if (!/duplicate column|already exists/i.test(e.message || "")) {
          console.error("ensureLavadoresSchema error al ejecutar stmt:", e.message);
        }
      }
    }
  } catch (e) {
    console.error("ensureLavadoresSchema:", e.message);
  }
}
