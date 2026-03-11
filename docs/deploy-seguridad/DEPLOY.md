# 🚀 Guía de Deploy - MOTOBOMBON

## Requisitos del servidor

### VPS/AWS EC2 Mínimo:
- **CPU**: 1 vCore
- **RAM**: 1GB (recomendado 2GB)
- **Almacenamiento**: 10GB SSD
- **OS**: Ubuntu 22.04 LTS o similar

### Software necesario:
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2 globalmente
sudo npm install -g pm2

# Instalar Nginx
sudo apt install nginx -y

# Instalar certbot para SSL (opcional)
sudo apt install certbot python3-certbot-nginx -y
```

## 📁 Estructura en servidor

```
/var/www/motobombon/
├── backend/                 # Backend Node.js
│   ├── index.js
│   ├── package.json
│   ├── database/
│   │   └── database.sqlite  # Base de datos SQLite
│   ├── uploads/            # Archivos subidos
│   └── logs/               # Logs de PM2
├── Frontend/
│   └── dist/               # Build de React
├── ecosystem.config.json   # Configuración PM2
└── deploy.sh              # Script de deploy
```

## 🔧 Pasos de Deploy

### 1. Preparar servidor
```bash
# Crear usuario para la app
sudo adduser motobombon
sudo usermod -aG sudo motobombon

# Crear directorio del proyecto
sudo mkdir -p /var/www/motobombon
sudo chown motobombon:motobombon /var/www/motobombon
```

### 2. Subir código
```bash
# Opción A: Git clone
cd /var/www/motobombon
git clone https://github.com/bymario15127/moto_bombon.git .

# Opción B: SCP/SFTP
scp -r ./elite-studio/* user@servidor:/var/www/elite-studio/
```

### 3. Configurar variables de entorno
```bash
# Backend
cd /var/www/motobombon/backend
cp .env.example .env
nano .env  # Editar con valores de producción

# Frontend
cd ../Frontend
cp .env.production .env.production.local
nano .env.production.local  # Ajustar URLs de producción
```

### 4. Ejecutar deploy
```bash
cd /var/www/motobombon
chmod +x deploy.sh
./deploy.sh
```

### 5. Configurar Nginx
```bash
# Copiar configuración
sudo cp nginx.conf /etc/nginx/sites-available/motobombon
sudo ln -s /etc/nginx/sites-available/motobombon /etc/nginx/sites-enabled/

# Probar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

### 6. Configurar SSL (Opcional pero recomendado)
```bash
# Obtener certificado SSL gratuito
sudo certbot --nginx -d tudominio.com -d www.tudominio.com

# Auto-renovación
sudo crontab -e
# Agregar: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔧 Variables de Entorno Importantes

### Backend (.env)
```bash
NODE_ENV=production
PORT=3000
CORS_ORIGINS=https://tudominio.com,https://www.tudominio.com
```

### Frontend (.env.production.local)
```bash
VITE_API_URL=https://tudominio.com
```

## 🛠️ Comandos útiles de mantenimiento

```bash
# Ver logs en tiempo real
pm2 logs elite-studio-backend

# Reiniciar aplicación
pm2 restart elite-studio-backend

# Ver status
pm2 status

# Backup de base de datos
cp backend/database/database.sqlite backup_$(date +%Y%m%d).sqlite

# Ver logs de Nginx
sudo tail -f /var/log/nginx/elite-studio-access.log
sudo tail -f /var/log/nginx/elite-studio-error.log
```

## 🚨 Troubleshooting

### Problema: Backend no inicia
```bash
# Verificar logs
pm2 logs elite-studio-backend

# Verificar puerto
sudo netstat -tlnp | grep :3000

# Reiniciar PM2
pm2 restart elite-studio-backend
```

### Problema: Frontend no carga
```bash
# Verificar build
ls -la Frontend/dist/

# Verificar configuración Nginx
sudo nginx -t

# Verificar permisos
sudo chown -R www-data:www-data /var/www/elite-studio/Frontend/dist/
```

### Problema: Base de datos corrupta
```bash
# Recrear base de datos
cd backend
rm database/database.sqlite
npm run init
npm run init-services
```

## 📊 Monitoreo

### PM2 Dashboard
```bash
pm2 plus  # Dashboard web gratuito
```

### Logs importantes
- Backend: `/var/www/elite-studio/backend/logs/`
- Nginx: `/var/log/nginx/elite-studio-*.log`
- Sistema: `journalctl -u nginx`

## 🔐 Seguridad adicional

### Firewall básico
```bash
sudo ufw allow 22     # SSH
sudo ufw allow 80     # HTTP
sudo ufw allow 443    # HTTPS
sudo ufw enable
```

### Backup automático
```bash
# Agregar a crontab
0 2 * * * tar -czf /backups/elite-studio-$(date +\%Y\%m\%d).tar.gz /var/www/elite-studio/backend/database/ /var/www/elite-studio/backend/uploads/
```

## 💰 Costos estimados

### VPS básico:
- **DigitalOcean**: $6/mes (1GB RAM)
- **Vultr**: $5/mes (1GB RAM)
- **AWS EC2 t2.micro**: Gratuito primer año

### Dominio:
- **.com**: ~$12/año
- SSL: Gratuito con Let's Encrypt

### Total estimado: **$6-12/mes + dominio**