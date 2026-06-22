# MOTOBOMBON - Setup Rápido para VPS

## 🚀 Deploy en un nuevo VPS (Debian/Ubuntu)

### Paso 1: Preparar servidor (ejecutar como root)

```bash
# Actualizar sistema
apt update && apt upgrade -y

# Instalar Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Instalar PM2 globalmente
npm install -g pm2

# Instalar Nginx
apt install nginx -y

# Instalar Git
apt install git -y

# Crear directorio del proyecto
mkdir -p /var/www/motobombon
cd /var/www/motobombon
```

### Paso 2: Clonar el repositorio

```bash
git clone https://github.com/bymario15127/moto_bombon.git .
```

### Paso 3: Ejecutar script de deploy

```bash
chmod +x deploy.sh
./deploy.sh
```

**¡Listo!** El script hará:
- ✅ Instalar dependencias
- ✅ Crear y inicializar base de datos
- ✅ Compilar frontend
- ✅ Configurar Nginx
- ✅ Iniciar backend con PM2

---

## 🛠️ Comandos útiles

### Ver estado
```bash
pm2 status
curl http://localhost:3000/api/health
```

### Ver logs
```bash
pm2 logs motobombon-backend
sudo tail -f /var/log/nginx/motobombon-access.log
```

### Reiniciar
```bash
pm2 restart motobombon-backend
sudo systemctl restart nginx
```

### Actualizar código
```bash
cd /var/www/motobombon
git pull origin main
npm run build --prefix Frontend
pm2 restart motobombon-backend
```

---

## 📋 Checklist final

- [ ] Backend responde en `http://localhost:3000/api/health`
- [ ] Frontend visible en `http://tu-ip/`
- [ ] API calls funcionan sin errores 404
- [ ] Base de datos creada en `backend/database/database.sqlite`

---

## ❌ Troubleshooting

**Error: "no such table"**
```bash
cd /var/www/motobombon/backend
npm run init-all
pm2 restart motobombon-backend
```

**Backend no inicia**
```bash
pm2 logs motobombon-backend --err
netstat -tuln | grep 3000
```

**Nginx no forwarding API**
```bash
sudo nginx -t
sudo systemctl restart nginx
curl http://localhost:3000/api/citas
```

---

## 📊 Información importante

- **Database**: `/var/www/motobombon/backend/database/database.sqlite`
- **Uploads**: `/var/www/motobombon/backend/uploads/`
- **Logs**: `/var/www/motobombon/backend/logs/`
- **Frontend build**: `/var/www/motobombon/Frontend/dist/`
- **Nginx config**: `/etc/nginx/sites-available/motobombon`
