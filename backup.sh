#!/bin/bash
# Backup de bases de datos MOTOBOMBON (multisucursal: centro + sur)
#
# Usa la API .backup de SQLite: vuelca WAL + main en UN solo archivo consistente.
# Evita el problema de copiar solo .sqlite y perder datos recientes en .sqlite-wal.
#
# Requiere: apt install sqlite3  (paquete sqlite3 en Debian/Ubuntu)

BACKUP_DIR="/var/www/motobombon/backups"
DB_DIR="/var/www/motobombon/backend/database"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

mkdir -p "$BACKUP_DIR"

backup_one() {
  local SRC="$1"
  local BASENAME
  BASENAME=$(basename "$SRC" .sqlite)
  # Evita que "database.sqlite" genere database_FECHA.sqlite y choque con database_centro_*
  if [ "$(basename "$SRC")" = "database.sqlite" ]; then
    BASENAME="database_legacy"
  fi
  local DST="$BACKUP_DIR/${BASENAME}_$TIMESTAMP.sqlite"
  if [ ! -f "$SRC" ]; then
    echo "⚠️ No encontrada: $SRC"
    return
  fi
  if command -v sqlite3 >/dev/null 2>&1; then
    if sqlite3 "$SRC" ".backup '$DST'"; then
      echo "✅ backup consistente: $SRC → $(basename "$DST")"
    else
      echo "❌ Falló .backup para $SRC"
    fi
  else
    echo "⚠️ sqlite3 no instalado; usando cp (peor con WAL). Instala: apt install sqlite3"
    cp "$SRC" "$DST"
    echo "✅ cp: $SRC → $(basename "$DST")"
  fi
}

# Bases multisucursal + legado database.sqlite si existe
for db in database_centro.sqlite database_sur.sqlite database.sqlite; do
  SRC="$DB_DIR/$db"
  [ -f "$SRC" ] && backup_one "$SRC"
done

# Mantener solo los últimos 10 backups por tipo
cd "$BACKUP_DIR" 2>/dev/null || exit 0
for prefix in database_centro database_sur database_legacy; do
  ls -t ${prefix}_*.sqlite 2>/dev/null | tail -n +11 | xargs -r rm
done
echo "🧹 Backups antiguos eliminados (manteniendo últimos 10 por sucursal)"

echo ""
echo "📋 Backups recientes:"
ls -lht "$BACKUP_DIR"/*.sqlite 2>/dev/null | head -10
