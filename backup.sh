#!/bin/bash
# Backup de bases de datos MOTOBOMBON (multisucursal: centro + sur)

BACKUP_DIR="/var/www/motobombon/backups"
DB_DIR="/var/www/motobombon/backend/database"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

mkdir -p "$BACKUP_DIR"

# Backup de cada BD de sucursal
for db in database_centro.sqlite database_sur.sqlite; do
  SRC="$DB_DIR/$db"
  DST="$BACKUP_DIR/${db%.sqlite}_$TIMESTAMP.sqlite"
  if [ -f "$SRC" ]; then
    cp "$SRC" "$DST"
    echo "✅ $db → $BACKUP_DIR/$(basename "$DST")"
  else
    echo "⚠️ No encontrada: $SRC"
  fi
done

# Mantener solo los últimos 10 backups por tipo
cd "$BACKUP_DIR" 2>/dev/null || exit 0
for prefix in database_centro database_sur; do
  ls -t ${prefix}_*.sqlite 2>/dev/null | tail -n +11 | xargs -r rm
done
echo "🧹 Backups antiguos eliminados (manteniendo últimos 10 por sucursal)"

echo ""
echo "📋 Backups recientes:"
ls -lht "$BACKUP_DIR"/*.sqlite 2>/dev/null | head -10
