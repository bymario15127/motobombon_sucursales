// backend/scripts/generarClavesSupervisores.js
// Genera claves aleatorias seguras para supervisores de cada sede y actualiza la BD.
// Ejecutar: cd backend && node scripts/generarClavesSupervisores.js

import crypto from "crypto";
import bcrypt from "bcryptjs";
import { getDbConnection, getAllSucursales } from "../database/dbManager.js";

function generarClaveSegura(longitud = 12) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.randomBytes(longitud);
  let clave = "";
  for (let i = 0; i < longitud; i++) {
    clave += chars[bytes[i] % chars.length];
  }
  return clave;
}

async function main() {
  console.log("🔐 Generando claves para supervisores de cada sede...\n");

  const credenciales = [];

  for (const sucursal of getAllSucursales()) {
    const db = await getDbConnection(sucursal.id);

    const supervisores = await db.all(
      "SELECT id, username, name FROM usuarios WHERE role = ? AND activo = 1",
      ["supervisor"]
    );

    if (supervisores.length === 0) {
      console.log(`⚠️ ${sucursal.nombre}: No hay supervisores en la BD`);
      continue;
    }

    for (const sup of supervisores) {
      const nuevaClave = generarClaveSegura();
      const hash = await bcrypt.hash(nuevaClave, 10);

      await db.run("UPDATE usuarios SET password = ? WHERE id = ?", [
        hash,
        sup.id
      ]);

      credenciales.push({
        sede: sucursal.nombre,
        usuario: sup.username,
        nombre: sup.name,
        clave: nuevaClave
      });

      console.log(`✅ ${sucursal.nombre} - ${sup.name}: clave actualizada`);
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("📋 CREDENCIALES NUEVAS (guarda esto en lugar seguro):\n");

  for (const c of credenciales) {
    console.log(`   ${c.sede}:`);
    console.log(`     Usuario: ${c.usuario}`);
    console.log(`     Clave:   ${c.clave}`);
    console.log("");
  }

  console.log("=".repeat(50));
  console.log("\n⚠️ Las claves anteriores ya no funcionan. Entrega estas a cada supervisor.");

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
