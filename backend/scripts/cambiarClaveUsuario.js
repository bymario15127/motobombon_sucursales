// Cambia la contraseña de un usuario en la BD de una sucursal (bcrypt).
// Uso (desde la carpeta backend):
//   node scripts/cambiarClaveUsuario.js --sucursal sucursal2 --user admin_sur --password 'Bombonsur2026*'

import bcrypt from "bcryptjs";
import { getDbConnection, closeAllConnections } from "../database/dbManager.js";

function parseArgs() {
  const out = {};
  const a = process.argv.slice(2);
  for (let i = 0; i < a.length; i++) {
    if (a[i] === "--sucursal" && a[i + 1]) out.sucursal = a[++i];
    else if (a[i] === "--user" && a[i + 1]) out.user = a[++i];
    else if (a[i] === "--password" && a[i + 1]) out.password = a[++i];
  }
  return out;
}

async function main() {
  const { sucursal, user, password } = parseArgs();

  if (!sucursal || !user || !password) {
    console.error(
      "Uso: node scripts/cambiarClaveUsuario.js --sucursal <sucursal1|sucursal2> --user <username> --password <nueva_clave>"
    );
    process.exit(1);
  }

  const db = await getDbConnection(sucursal);
  const row = await db.get("SELECT id FROM usuarios WHERE username = ?", [
    user.trim().toLowerCase(),
  ]);

  if (!row) {
    console.error(`No existe el usuario "${user}" en ${sucursal}.`);
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 10);
  const r = await db.run("UPDATE usuarios SET password = ? WHERE id = ?", [
    hash,
    row.id,
  ]);

  console.log(`OK: contraseña actualizada (${r.changes} fila).`);
  await closeAllConnections();
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
