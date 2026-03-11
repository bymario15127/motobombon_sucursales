#!/bin/bash
# Deploy script para MOTOBOMBON
# Uso: ./deploy.sh

set -e

echo "🚀 Iniciando deploy de MOTOBOMBON..."
echo "================================================"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables
APP_DIR="/var/www/motobombon"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/Frontend"

# Funciones
log_info() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# 1. Validar que estamos en la ruta correcta
if [ ! -d "$APP_DIR" ]; then
    log_error "Directorio $APP_DIR no encontrado"
fi

cd "$APP_DIR"
log_info "Directorio de trabajo: $APP_DIR"

# 2. Actualizar código desde GitHub
echo ""
echo "📦 Actualizando código desde GitHub..."
git pull origin main || log_error "Error al hacer pull de GitHub"
log_info "Código actualizado"

# 3. Instalar/actualizar dependencias del backend
echo ""
echo "📦 Instalando dependencias del backend..."
cd "$BACKEND_DIR"
npm install --production || log_error "Error instalando dependencias backend"
log_info "Dependencias backend instaladas"

# 4. Inicializar base de datos
echo ""
echo "🗄️  Inicializando base de datos..."
if [ ! -f "$BACKEND_DIR/database/database.sqlite" ]; then
    npm run init-all || log_error "Error inicializando base de datos"
    log_info "Base de datos creada e inicializada"
else
    log_warn "Base de datos ya existe, saltando inicialización"
fi

# 5. Instalar/actualizar dependencias del frontend
echo ""
echo "📦 Instalando dependencias del frontend..."
cd "$FRONTEND_DIR"
npm install || log_error "Error instalando dependencias frontend"
log_info "Dependencias frontend instaladas"

# 6. Build del frontend
echo ""
echo "🏗️  Construyendo frontend..."
npm run build || log_error "Error en build del frontend"
log_info "Frontend compilado"

# 7. Configurar Nginx
echo ""
echo "⚙️  Configurando Nginx..."
if [ ! -L "/etc/nginx/sites-enabled/motobombon" ]; then
    sudo cp "$APP_DIR/nginx.conf" /etc/nginx/sites-available/motobombon || log_error "Error copiando configuración Nginx"
    sudo ln -s /etc/nginx/sites-available/motobombon /etc/nginx/sites-enabled/motobombon || log_error "Error creando enlace Nginx"
    log_info "Configuración Nginx aplicada"
else
    log_warn "Nginx ya configurado"
fi

# 8. Validar configuración Nginx
sudo nginx -t || log_error "Error en configuración Nginx"
log_info "Configuración Nginx válida"

# 9. Reiniciar servicios
echo ""
echo "🔄 Reiniciando servicios..."
cd "$APP_DIR"

# Detener servicios anteriores
pm2 delete motobombon-backend 2>/dev/null || true

# Iniciar backend
pm2 start ecosystem.config.json || log_error "Error iniciando backend con PM2"
log_info "Backend iniciado"

# Reiniciar Nginx
sudo systemctl restart nginx || log_error "Error reiniciando Nginx"
log_info "Nginx reiniciado"

# 10. Verificar que todo está corriendo
echo ""
echo "✅ Verificando servicios..."
sleep 2

BACKEND_CHECK=$(curl -s http://localhost:3000/api/health | grep -c "ok" || echo "0")
if [ "$BACKEND_CHECK" -gt 0 ]; then
    log_info "Backend respondiendo correctamente"
else
    log_warn "Backend no responde, verificar logs: pm2 logs motobombon-backend"
fi

echo ""
echo "================================================"
echo "🎉 Deploy completado exitosamente!"
echo "================================================"
echo ""
echo "📊 Estado de servicios:"
pm2 status
echo ""
echo "🔗 Acceso:"
echo "   Frontend: http://localhost"
echo "   Backend API: http://localhost:3000/api"
echo "   API Health: http://localhost:3000/api/health"
echo ""
echo "📝 Logs:"
echo "   Backend: pm2 logs motobombon-backend"
echo "   Nginx: sudo tail -f /var/log/nginx/motobombon-access.log"
echo ""