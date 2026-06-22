# 🔒 GUÍA DE SEGURIDAD Y DESPLIEGUE - MOTOBOMBON
## Checklist de Seguridad para Producción

---

## ✅ MEJORAS IMPLEMENTADAS

### 1. 🛡️ Seguridad del Backend

#### Protecciones Implementadas:
- ✅ **Helmet.js** - Protección contra vulnerabilidades HTTP comunes
- ✅ **Rate Limiting** - Prevención de ataques de fuerza bruta
  - 100 requests por IP cada 15 minutos (general)
  - 5 intentos de login cada 15 minutos
- ✅ **CORS configurado** - Solo dominios autorizados
- ✅ **Validación de inputs** - Prevención de inyecciones SQL/XSS
- ✅ **Variables de entorno** - Credenciales fuera del código
- ✅ **JWT para autenticación** - Tokens seguros con expiración
- ✅ **Bcrypt para contraseñas** - Hashing seguro de passwords

### 2. 📁 Archivos Creados/Modificados

```
backend/
├── .env                        ✅ Configuración de desarrollo
├── .env.example               ✅ Plantilla para producción
├── .gitignore                 ✅ Evita subir archivos sensibles
├── middleware/
│   ├── auth.js                ✅ Autenticación JWT
│   └── validator.js           ✅ Validación de datos
├── routes/
│   └── auth.js                ✅ Login seguro con bcrypt
└── scripts/
    └── generateHash.js        ✅ Generar hashes de contraseñas
```

---

## 🚀 PASOS PARA DESPLEGAR EN PRODUCCIÓN

### PASO 1: Instalar Dependencias de Seguridad

```bash
cd backend
npm install
```

Esto instalará:
- `bcrypt` - Hashing de contraseñas
- `jsonwebtoken` - Tokens JWT
- `helmet` - Seguridad HTTP
- `express-rate-limit` - Limitación de requests
- `validator` - Validación de datos
- `dotenv` - Variables de entorno

### PASO 2: Generar Contraseñas Seguras

```bash
# Generar hash para contraseña de admin
npm run generate-hash
# Ingresa: tu_contraseña_segura_admin

# Copiar el hash generado
# Ejemplo: $2b$10$abcd1234...
```

Ejecuta el comando dos veces:
1. Para generar hash de **admin**
2. Para generar hash de **supervisor**

### PASO 3: Configurar Variables de Entorno

Edita el archivo `.env` en producción:

```env
NODE_ENV=production
PORT=3001

# SEGURIDAD - OBLIGATORIO CAMBIAR
JWT_SECRET=tu_clave_secreta_muy_larga_y_compleja_minimo_32_caracteres
ADMIN_PASSWORD_HASH=$2b$10$[PEGAR_HASH_GENERADO_ADMIN]
SUPERVISOR_PASSWORD_HASH=$2b$10$[PEGAR_HASH_GENERADO_SUPERVISOR]

# CORS - Tu dominio real
CORS_ORIGINS=https://tudominio.com,https://www.tudominio.com

# Límites
MAX_FILE_SIZE=10mb
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Base de datos
DB_PATH=./database/database.sqlite

# Logging
LOG_LEVEL=info
```

### PASO 4: Configurar HTTPS en el VPS

⚠️ **CRÍTICO**: NUNCA uses HTTP en producción, solo HTTPS.

#### Opción A: Nginx + Let's Encrypt (Recomendado)

```bash
# Instalar Nginx
sudo apt update
sudo apt install nginx

# Instalar Certbot para SSL
sudo apt install certbot python3-certbot-nginx

# Obtener certificado SSL GRATIS
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
```

Configuración Nginx (`/etc/nginx/sites-available/motobombon`):

```nginx
# Redirigir HTTP a HTTPS
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS
server {
    listen 443 ssl http2;
    server_name tudominio.com www.tudominio.com;

    ssl_certificate /etc/letsencrypt/live/tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tudominio.com/privkey.pem;

    # Seguridad SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Frontend estático
    location / {
        root /var/www/motobombon/dist;
        try_files $uri $uri/ /index.html;
    }

    # Archivos subidos
    location /uploads {
        proxy_pass http://localhost:3001/uploads;
    }
}
```

Activar configuración:

```bash
sudo ln -s /etc/nginx/sites-available/motobombon /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Opción B: PM2 + Clúster (Recomendado)

PM2 se utiliza para mantener el servidor corriendo en segundo plano y recuperarlo automáticamente tras caídas o reinicios. Para producción, ambos proyectos se despliegan en **Modo Clúster** con 2 instancias para habilitar balanceo de carga, redundancia y recargas sin caídas de servicio.

```bash
# Instalar PM2 globalmente (si no está instalado)
npm install -g pm2

# Iniciar aplicación usando el archivo de ecosistema (Modo Clúster con 2 instancias)
cd /var/www/motobombon && pm2 start ecosystem.config.json

# Configurar inicio automático en el sistema operativo
pm2 startup
pm2 save

# Ver status y procesos activos (verás 2 instancias corriendo en paralelo)
pm2 status

# Ver logs en tiempo real
pm2 logs motobombon-backend

# Recargar código de forma segura y sin caídas (Zero-Downtime)
pm2 reload motobombon-backend
```

### PASO 5: Configurar Firewall

```bash
# Permitir solo puertos necesarios
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP (redirige a HTTPS)
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Verificar status
sudo ufw status
```

### PASO 6: Build del Frontend

```bash
cd Frontend
npm install
npm run build

# El folder 'dist' contiene tu aplicación lista para producción
```

Configurar variables en Frontend:

Crear `Frontend/.env.production`:

```env
VITE_API_URL=https://tudominio.com/api
```

Actualizar `Frontend/src/services/citasService.js` y otros servicios:

```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
```

---

## ⚠️ VULNERABILIDADES PENDIENTES DE RESOLVER

### CRÍTICAS (Resolver ANTES de producción):

1. **❌ Autenticación en Frontend sin JWT**
   - Actualmente usa localStorage sin validación
   - Contraseñas en texto plano en LoginAdmin.jsx
   
   **Solución**: Actualizar LoginAdmin.jsx para usar endpoint `/api/auth/login`

2. **❌ Sin protección en rutas de admin**
   - Cualquiera puede acceder a `/api/nomina`, `/api/lavadores`
   
   **Solución**: Agregar middleware `verifyToken` a rutas sensibles

3. **❌ Base de datos SQLite sin cifrado**
   - Datos almacenados en texto plano
   
   **Solución**: Para datos sensibles, considerar PostgreSQL con cifrado

### IMPORTANTES (Resolver en 1-2 semanas):

4. **⚠️ Sin backup automático de base de datos**
   
   **Solución**: Script de backup diario

   ```bash
   # Crear script backup.sh
   #!/bin/bash
   DATE=$(date +%Y%m%d_%H%M%S)
   cp /ruta/database/database.sqlite /ruta/backups/db_$DATE.sqlite
   find /ruta/backups -mtime +7 -delete  # Borrar backups >7 días
   ```

   ```bash
   # Agregar a crontab (cada día a las 3 AM)
   crontab -e
   0 3 * * * /ruta/backup.sh
   ```

5. **⚠️ Sin logs de auditoría**
   
   **Solución**: Implementar Winston o similar para logs estructurados

6. **⚠️ Sin monitoreo de errores**
   
   **Solución**: Integrar Sentry o similar

### RECOMENDACIONES:

7. **📊 Sin métricas de rendimiento**
   - Considerar: Grafana + Prometheus

8. **📧 Sin notificaciones de errores**
   - Configurar alertas por email/SMS

9. **🔄 Sin actualizaciones automáticas de seguridad**
   ```bash
   # Configurar actualizaciones automáticas Ubuntu
   sudo apt install unattended-upgrades
   sudo dpkg-reconfigure --priority=low unattended-upgrades
   ```

---

## 🔐 CHECKLIST FINAL ANTES DE PRODUCCIÓN

```
☐ Generar hashes bcrypt para admin y supervisor
☐ Actualizar .env con JWT_SECRET aleatorio (32+ caracteres)
☐ Actualizar .env con hashes de contraseñas
☐ Configurar CORS_ORIGINS con dominio real
☐ Instalar certificado SSL (Let's Encrypt)
☐ Configurar Nginx como reverse proxy
☐ Configurar PM2 para mantener servidor corriendo
☐ Activar firewall (ufw)
☐ Configurar backups automáticos de DB
☐ Actualizar LoginAdmin.jsx para usar /api/auth/login
☐ Proteger rutas de admin con middleware verifyToken
☐ Cambiar NODE_ENV=production en .env
☐ Hacer build del frontend (npm run build)
☐ Configurar dominio DNS apuntando a VPS
☐ Probar login y todas las funcionalidades
☐ NO subir .env a Git (verificar .gitignore)
☐ Documentar credenciales en lugar seguro (1Password, etc)
```

---

## 📞 COMANDOS ÚTILES PARA PRODUCCIÓN

```bash
# Ver logs del servidor
pm2 logs motobombon-api

# Reiniciar servidor
pm2 restart motobombon-api

# Ver status
pm2 status

# Verificar uso de recursos
pm2 monit

# Ver logs de Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Renovar certificado SSL (automático pero por si acaso)
sudo certbot renew --dry-run

# Backup manual de DB
cp backend/database/database.sqlite backups/db_$(date +%Y%m%d).sqlite

# Ver conexiones activas
netstat -tuln | grep :3001
```

---

## 🚨 EN CASO DE EMERGENCIA

### Si el servidor no responde:
```bash
pm2 restart motobombon-api
sudo systemctl restart nginx
```

### Si hay ataque de fuerza bruta:
```bash
# Bloquear IP específica
sudo ufw deny from 123.456.789.0

# Ver intentos de login fallidos
pm2 logs motobombon-api | grep "inválidas"
```

### Restaurar backup:
```bash
# Detener servidor
pm2 stop motobombon-api

# Restaurar DB
cp backups/db_20250124.sqlite backend/database/database.sqlite

# Reiniciar
pm2 restart motobombon-api
```

---

## 📚 RECURSOS ADICIONALES

- [OWASP Top 10](https://owasp.org/www-project-top-ten/) - Vulnerabilidades más comunes
- [Let's Encrypt](https://letsencrypt.org/) - SSL gratis
- [PM2 Documentation](https://pm2.keymetrics.io/) - Process manager
- [Nginx Security](https://nginx.org/en/docs/http/ngx_http_ssl_module.html) - Configuración SSL
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)

---

## ⚡ PRÓXIMOS PASOS DESPUÉS DEL DESPLIEGUE

1. ✅ Monitorear logs diariamente (primera semana)
2. ✅ Verificar backups funcionando correctamente
3. ✅ Probar recuperación de desastre
4. ✅ Configurar alertas de uptime (UptimeRobot gratis)
5. ✅ Actualizar documentación con credenciales reales (guardadas en lugar seguro)
6. ✅ Capacitar usuarios sobre seguridad (contraseñas fuertes, no compartir credenciales)
7. ✅ Planear mantenimiento mensual (actualizar dependencias, revisar logs)

---

**Creado:** 25 de Noviembre, 2025  
**Última actualización:** 25 de Noviembre, 2025  
**Versión:** 1.0.0
