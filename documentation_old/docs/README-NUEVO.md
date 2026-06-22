# 🏍️ MOTOBOMBON - Sistema de Reservas y Gestión

Sistema completo de gestión de citas para un lavamotors especializado en lavado y cuidado de motocicletas.

**Estado:** ✅ Producción - VPS Activo  
**Última actualización:** 30 Enero 2026  
**Versión:** 2.0 (Multi-Sucursal Ready)

---

## 🚀 Características Principales

### 👤 Cliente
- ✅ Formulario de reservas intuitivo
- ✅ Selector de servicios con imágenes
- ✅ Calendario con horarios disponibles
- ✅ Validación en tiempo real
- ✅ Confirmación instantánea
- ✅ Notificaciones por email

### 👨‍💼 Administrador
- ✅ Dashboard con estadísticas
- ✅ Calendario de citas (diaria/semanal)
- ✅ Gestión completa de citas
- ✅ CRUD de servicios
- ✅ Gestión de lavadores y comisiones
- ✅ Reportes y finanzas
- ✅ Autenticación JWT

### 🔜 Próximas Mejoras
- 🔜 **Sistema Multi-Sucursal** (Q1 2026)
- 🔜 **Sistema de Rifa/Sorteos** (Q1 2026)
- 🔜 **Integración Wompi** (Pagos en línea)

---

## 📁 Estructura Proyecto

```
MOTOBOMBON/
├── backend/                  # Node.js + Express + SQLite
│   ├── database/
│   │   ├── init.js
│   │   ├── initAll.js
│   │   ├── initClientes.js
│   │   ├── initLavadores.js
│   │   ├── initProductos.js
│   │   ├── initServicios.js
│   │   ├── initFinanzas.js
│   │   ├── initTalleres.js
│   │   └── .archived/        # Scripts de migración viejos
│   ├── routes/
│   │   ├── auth.js
│   │   ├── citas.js
│   │   ├── clientes.js
│   │   ├── productos.js
│   │   ├── promociones.js
│   │   ├── lavadores.js
│   │   ├── nomina.js
│   │   ├── finanzas.js
│   │   ├── reportes.js
│   │   ├── servicios.js
│   │   └── talleres.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── validator.js
│   │   └── sucursalMiddleware.js (NUEVO - para multi-sucursal)
│   ├── services/
│   │   ├── emailService.js
│   │   └── ...
│   ├── scripts/
│   ├── config/
│   │   └── databases.js (NUEVO - para multi-sucursal)
│   ├── index.js
│   ├── package.json
│   └── setup-db.bat
│
├── Frontend/                # React + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── main.jsx
│   └── package.json
│
├── .archived/              # Documentos históricos archivados
├── docs/                   # Documentación (opcional)
├── ecosystem.config.json   # Configuración PM2
├── nginx.conf              # Configuración Nginx
├── deploy.sh               # Script de deploy
├── backup.sh               # Script de backup
├── PROPUESTA-EXPANSION-MULTISURCURSAL-RIFA.md
├── MANTENIMIENTO-LIMPIEZA.md
├── DEPLOY.md
├── SETUP-RAPIDO.md
└── README.md
```

---

## 🔧 Instalación Rápida

### Requisitos
- Node.js 16+
- NPM o Yarn
- SQLite3
- Nginx (en VPS)

### Setup Local

```bash
# 1. Clonar repositorio
git clone <repo>
cd moto_bombon

# 2. Backend
cd backend
npm install
npm run init-all          # Inicializar BD
npm run dev               # Ejecutar en desarrollo

# 3. Frontend (otra terminal)
cd Frontend
npm install
npm run dev               # Ejecutar en desarrollo

# 4. Acceder
# Frontend: http://localhost:5173
# Backend API: http://localhost:3000
```

---

## 🚀 Despliegue VPS

### Pasos principales

```bash
# 1. SSH al VPS
ssh usuario@server.com

# 2. Clonar en /var/www
cd /var/www
git clone <repo> motobombon
cd motobombon

# 3. Backend
cd backend
npm install --production
npm run init-all

# 4. Frontend
cd ../Frontend
npm install --production
npm run build

# 5. Iniciar con PM2
cd ..
pm2 start ecosystem.config.json
pm2 save

# 6. Configurar Nginx
sudo cp nginx.conf /etc/nginx/sites-available/motobombon
sudo ln -s /etc/nginx/sites-available/motobombon /etc/nginx/sites-enabled/
sudo systemctl restart nginx

# 7. Certificado SSL (Let's Encrypt)
sudo certbot certonly --webroot -w /var/www/motobombon/Frontend/dist -d motobombon.com
```

---

## 📊 Scripts NPM Backend

```bash
npm start                    # Iniciar servidor
npm run dev                 # Dev con auto-reload
npm run init                # Inicializar BD
npm run init-all            # Inicializar todo
npm run init-clientes       # Init clientes
npm run init-lavadores      # Init lavadores
npm run init-productos      # Init productos
npm run init-finanzas       # Init finanzas
npm run init-services       # Init servicios
```

---

## 🔐 Seguridad

- ✅ Autenticación JWT
- ✅ Validación en servidor
- ✅ CORS configurado
- ✅ Variables de entorno (.env)
- ✅ HTTPS en producción

---

## 📝 Documentación

- [DEPLOY.md](DEPLOY.md) - Guía completa de despliegue
- [SETUP-RAPIDO.md](SETUP-RAPIDO.md) - Setup rápido
- [PROPUESTA-EXPANSION-MULTISURCURSAL-RIFA.md](PROPUESTA-EXPANSION-MULTISURCURSAL-RIFA.md) - Plan multi-sucursal
- [MANTENIMIENTO-LIMPIEZA.md](MANTENIMIENTO-LIMPIEZA.md) - Mantenimiento del código

---

## 🔄 Actualización de Código

```bash
# En VPS
cd /var/www/motobombon

# Pull de cambios
git pull origin main

# Reinstalar dependencias si es necesario
cd backend && npm install --production
cd ../Frontend && npm install --production

# Rebuild frontend
npm run build

# Reiniciar servicios
pm2 restart ecosystem.config.json

# O con script
./deploy.sh
```

---

## 🧹 Limpieza y Mantenimiento

Se realizó limpieza completa el **30 de Enero 2026**:

✅ Archivados 15 documentos históricos  
✅ Archivados 24 scripts de migración antigua  
✅ Actualizado package.json  
✅ Arreglado backup.sh  
✅ Optimizada documentación  

Ver [MANTENIMIENTO-LIMPIEZA.md](MANTENIMIENTO-LIMPIEZA.md) para detalles.

---

## 📞 Soporte

- **Estado del servidor:** `pm2 status`
- **Logs backend:** `pm2 logs motobombon-backend`
- **Logs Nginx:** `sudo tail -f /var/log/nginx/error.log`
- **BD SQLite:** `backend/database/database.sqlite`

---

## 📄 Licencia

Privado - MOTOBOMBON

---

**Última actualización:** 30 Enero 2026  
**Versión:** 2.0  
**Estado:** Producción ✅
