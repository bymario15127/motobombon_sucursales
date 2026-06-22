# MOTOBOMBON — Documentación Técnica Completa del Sistema

## Tabla de Contenidos

1. [Visión General](#1-visión-general)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Arquitectura del Sistema (Multi-Sucursal)](#3-arquitectura-del-sistema-multi-sucursal)
4. [Estructura del Proyecto](#4-estructura-del-proyecto)
5. [Base de Datos (Esquema SQLite3)](#5-base-de-datos-esquema-sqlite3)
6. [Backend — API REST](#6-backend--api-rest)
7. [Frontend — SPA React](#7-frontend--spa-react)
8. [Autenticación y Seguridad](#8-autenticación-y-seguridad)
9. [Roles y Permisos](#9-roles-y-permisos)
10. [Módulos Funcionales](#10-módulos-funcionales)
11. [Variables de Entorno](#11-variables-de-entorno)
12. [Instalación y Puesta en Marcha](#12-instalación-y-puesta-en-marcha)
13. [Despliegue y Operaciones (PM2 Clúster + Nginx)](#13-despliegue-y-operaciones-pm2-clúster--nginx)
14. [Respaldos y Mantenimiento](#14-respaldos-y-mantenimiento)

---

## 1. Visión General

**MOTOBOMBON** es una solución integral de software diseñada para la administración y control de un centro de lavado y cuidado especializado en motocicletas (lavamotos). Incluye reservas de citas por parte del cliente final y una robusta plataforma administrativa para la gestión del negocio.

El sistema unifica los siguientes flujos de negocio en una sola herramienta:

| Módulo | Descripción |
|--------|-------------|
| **Citas y Reservas** | Formulario público de reservas, asignación de lavadores, métodos de pago y control de estados (pendiente, lavado, finalizado, cancelado). |
| **Lavadores y Nómina** | CRUD de lavadores, cálculo automático de comisiones por porcentaje y liquidación de nóminas mensuales. |
| **Inventario y Ventas** | Control de stock de insumos y venta directa de productos al cliente (aceites, accesorios, etc.). |
| **Finanzas e Ingresos** | Registro de gastos (operativos, nóminas, servicios públicos) y cálculo de utilidades netas mensuales arrastrando balances del mes anterior. |
| **Talleres** | Control de convenios o tarifas especiales con talleres externos. |

El sistema cuenta con soporte de arquitectura **Multi-Sucursal** (Centro, Sur, etc.) utilizando bases de datos independientes por sucursal en archivos SQLite para máxima portabilidad y aislamiento de datos.

---

## 2. Stack Tecnológico

### Frontend

| Tecnología | Propósito |
|------------|-----------|
| **React 18** | Biblioteca para construir la interfaz de usuario basada en componentes y hooks. |
| **React Router DOM 6** | Enrutamiento e historial SPA para la consola de administración. |
| **Axios** | Cliente de promesas HTTP para comunicarse con la API del backend. |
| **jwt-decode** | Utilidad para decodificar los tokens de sesión en el cliente React. |
| **Recharts** | Generación de gráficos analíticos financieros y de rendimiento de citas en el Dashboard. |
| **Vite 5** | Bundler ultra rápido para el entorno de desarrollo y compilación de producción. |
| **Tailwind CSS + PostCSS** | Framework CSS de utilidades para el diseño visual responsivo con temática oscura/neón. |
| **Lucide React** | Pack de iconos vectoriales modernos. |

### Backend

| Tecnología | Propósito |
|------------|-----------|
| **Node.js** | Entorno de ejecución de Javascript del lado del servidor. |
| **Express** | Framework web REST para la definición del servidor HTTP y enrutamientos de la API. |
| **SQLite3 (sqlite/sqlite3)** | Gestor de base de datos SQL embebido, rápido y de configuración cero. |
| **Bcrypt** | Hashing criptográfico de contraseñas para los accesos administrativos. |
| **JSON Web Token (JWT)** | Firma y validación de tokens de acceso seguros sin estado (stateless). |
| **Multer** | Middleware para procesar peticiones `multipart/form-data` y gestionar cargas de archivos. |
| **Nodemailer** | Envío de correos de confirmación de citas automáticos a los clientes. |
| **dotenv** | Gestión de variables de configuración de entorno. |

### Base de Datos

| Tecnología | Propósito |
|------------|-----------|
| **SQLite3** | Bases de datos relacionales en disco local, separadas por archivo según sucursal. |

### Infraestructura y Producción

| Herramienta | Propósito |
|-------------|-----------|
| **Nginx** | Reverse Proxy para la API Node.js, servidor de archivos estáticos (React dist) y terminación SSL (HTTPS). |
| **PM2** | Gestor de procesos Node.js con soporte nativo de **Modo Clúster** para redundancia de 2 instancias y cero caídas de servicio. |
| **Certbot (Let's Encrypt)** | Renovación automática de certificados de seguridad SSL gratuitos. |

---

## 3. Arquitectura del Sistema (Multi-Sucursal)

```
┌─────────────────────────────────────────────────────────┐
│                        CLIENTE                          │
│                                                         │
│   ┌───────────────────────┐   ┌──────────────────────┐  │
│   │   Formulario Público  │   │ Panel Administración │  │
│   │      (React SPA)      │   │     (Dashboard)      │  │
│   └───────────┬───────────┘   └──────────┬───────────┘  │
└───────────────┼──────────────────────────┼──────────────┘
                │                          │ HTTP/HTTPS
                ▼                          ▼
┌─────────────────────────────────────────────────────────┐
│                        NGINX                            │  (Reverse Proxy / SSL)
│                (Puertos 80 y 443)                       │
└───────────────────────┬─────────────────────────────────┘
                        │ /api/
                        ▼
┌─────────────────────────────────────────────────────────┐
│                Backend Node.js (PM2)                    │  (Modo Clúster - 2 Instancias)
│                    Puerto 3000                          │
│                                                         │
│ ┌──────────────┐  ┌────────────────┐  ┌───────────────┐ │
│ │  Middleware  │  │   Controllers  │  │    Routes     │ │
│ │  (verifyToken│  │ (lógica citas, │  │ (endpoints API│ │
│ │  rateLimit)  │  │  lavadores...) │  │  auth, citas) │ │
│ └──────────────┘  └───────┬────────┘  └───────────────┘ │
└───────────────────────────┼─────────────────────────────┘
                            │ (Detecta sucursal en cabecera)
                            ▼
┌─────────────────────────────────────────────────────────┐
│             Bases de Datos SQLite (Local)               │
│                                                         │
│     ┌─────────────────────────────────────────────┐     │
│     │   backend/database/                         │     │
│     │   ├── database_centro.sqlite (Sede Centro)  │     │
│     │   ├── database_sur.sqlite    (Sede Sur)     │     │
│     │   └── database.sqlite        (Default Sede) │     │
│     └─────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

### Características de la Arquitectura
* **Aislamiento por Sede:** Cada sede cuenta con su propio archivo SQLite físico, previniendo que los errores o caídas afecten a la base de datos global.
* **Middleware de Sucursal:** El backend intercepta las peticiones, lee el identificador de sede enviado por el cliente (en cabeceras HTTP como `x-sucursal` o parámetros de ruta) y conecta dinámicamente con la base de datos correspondiente.
* **Stateless API:** La sesión es puramente validada por firma JWT, permitiendo escalar procesos de Node.js en múltiples núcleos (PM2 Cluster) sin desalinear la sesión.

---

## 4. Estructura del Proyecto

```
motobombon/
├── Frontend/                           # SPA React (Vite)
│   ├── src/
│   │   ├── components/                 # Componentes UI reutilizables
│   │   ├── context/                    # Estado global (AuthContext, ToastContext)
│   │   ├── pages/                      # Páginas del sistema (Login, Citas, Finanzas)
│   │   ├── services/                   # Módulo de peticiones Axios a API
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/                            # API REST Express + SQLite3
│   ├── config/
│   │   └── databases.js                # Conexiones dinámicas a bases de datos
│   ├── database/                       # Carpeta contenedora de SQLite
│   │   ├── database.sqlite             # Sede Default
│   │   ├── database_centro.sqlite      # Sede Centro
│   │   ├── database_sur.sqlite         # Sede Sur
│   │   ├── initAll.js                  # Inicialización y tablas por defecto
│   │   └── initAllSucursales.js        # Configura y migra todas las sucursales
│   ├── middleware/
│   │   ├── auth.js                     # Middleware de verificación JWT
│   │   ├── sucursalMiddleware.js       # Asignación de base de datos por petición
│   │   └── validator.js                # Sanitización y rate limiting
│   ├── routes/                         # Enrutadores HTTP
│   │   ├── auth.js
│   │   ├── citas.js
│   │   ├── lavadores.js
│   │   ├── nomina.js
│   │   └── servicios.js
│   ├── services/
│   │   └── emailService.js             # Envío SMTP de correos
│   ├── index.js                        # Entrada de la API Express
│   └── package.json
│
├── docs/                               # Documentación de soporte
├── ecosystem.config.json               # Configuración de procesos PM2 (2 Instancias)
├── nginx.conf                          # Plantilla de Reverse Proxy Nginx
├── deploy.sh                           # Script automatizado de despliegue en producción
└── backup.sh                           # Script automatizado de respaldos diarios
```

---

## 5. Base de Datos (Esquema SQLite3)

Cada archivo SQLite3 independiente almacena los siguientes esquemas de tablas relacionales:

### 1. Tabla `citas`
Almacena todas las reservas hechas por clientes o agendadas por el administrador.
* `id` (INTEGER, PK, AUTOINCREMENT)
* `cliente` (TEXT, NOT NULL) - Nombre del dueño de la motocicleta.
* `fecha` (TEXT, NOT NULL) - Formato `YYYY-MM-DD`.
* `hora` (TEXT) - Hora de la cita (opcional, permite citas sin hora fija para evitar bloqueos).
* `servicio` (TEXT, NOT NULL) - Nombre del servicio de lavado contratado.
* `lavador_id` (INTEGER, FK) - Referencia al lavador asignado.
* `telefono` (TEXT) - Número celular del cliente.
* `cedula` (TEXT) - Documento de identificación.
* `email` (TEXT) - Correo electrónico para notificaciones.
* `placa` (TEXT) - Placa del vehículo.
* `marca` (TEXT) - Marca de la moto.
* `modelo` (TEXT) - Modelo o cilindraje (referencia).
* `cilindraje` (INTEGER) - Cilindraje en CC (útil para calcular tarifas).
* `comentarios` (TEXT) - Observaciones adicionales.
* `estado` (TEXT, DEFAULT 'pendiente') - Valores: `'pendiente'`, `'lavado'`, `'finalizado'`, `'cancelado'`.
* `metodo_pago` (TEXT) - Método utilizado (`'efectivo'`, `'transferencia'`).
* `tipo_cliente` (TEXT, DEFAULT 'cliente') - Tipo de cliente (`'cliente'`, `'convenio'`, `'taller'`).
* `deleted_at` (DATETIME) - Borrado lógico para auditoría.
* `created_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)

### 2. Tabla `lavadores`
Gestiona el personal del lavadero que ejecuta los servicios de lavado.
* `id` (INTEGER, PK, AUTOINCREMENT)
* `nombre` (TEXT, NOT NULL)
* `cedula` (TEXT, UNIQUE)
* `activo` (INTEGER, DEFAULT 1) - `1` (sí) o `0` (no).
* `comision_porcentaje` (REAL, DEFAULT 30.0) - Porcentaje de ganancia por cita.
* `eliminado` (INTEGER, DEFAULT 0) - Bandera de borrado lógico.
* `created_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)

### 3. Tabla `servicios`
Define el catálogo de servicios de lavado, detallado de motos y polichados.
* `id` (INTEGER, PK, AUTOINCREMENT)
* `nombre` (TEXT, NOT NULL)
* `duracion` (INTEGER, NOT NULL) - En minutos.
* `precio` (REAL) - Tarifa fija (si aplica).
* `descripcion` (TEXT)
* `imagen` (TEXT) - Ruta URL a la imagen ilustrativa del servicio.
* `precio_bajo_cc` (REAL) - Precio para motos de bajo cilindraje (<= 250cc).
* `precio_alto_cc` (REAL) - Precio para motos de alto cilindraje (> 250cc).
* `created_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)

### 4. Tabla `talleres`
Almacena talleres externos o concesionarios bajo convenio para facturaciones conjuntas.
* `id` (INTEGER, PK, AUTOINCREMENT)
* `nombre` (TEXT, NOT NULL, UNIQUE)
* `contacto` (TEXT)
* `telefono` (TEXT)
* `email` (TEXT)
* `precio_bajo_cc` (REAL)
* `precio_alto_cc` (REAL)
* `activo` (INTEGER, DEFAULT 1)
* `fecha_creacion` (DATETIME, DEFAULT CURRENT_TIMESTAMP)

### 5. Tabla `nomina`
Registra la acumulación de ganancias y comisiones del personal de forma mensual.
* `id` (INTEGER, PK, AUTOINCREMENT)
* `lavador_id` (INTEGER, NOT NULL, FK)
* `mes` (INTEGER, NOT NULL)
* `ano` (INTEGER, NOT NULL)
* `total_citas` (INTEGER, DEFAULT 0)
* `total_ganancia` (REAL, DEFAULT 0) - Sumatoria total de los servicios lavados.
* `comisiones_generadas` (REAL, DEFAULT 0) - Ganancia neta para el lavador.
* `estado` (TEXT, DEFAULT 'pendiente') - Estados: `'pendiente'`, `'pagado'`.
* `created_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)
* *Restricción:* Llave única compuesta en `(lavador_id, mes, ano)` para evitar duplicidad de nómina.

### 6. Tabla `productos`
Inventario físico de productos para venta secundaria.
* `id` (INTEGER, PK, AUTOINCREMENT)
* `nombre` (TEXT, NOT NULL, UNIQUE)
* `precio_compra` (REAL, NOT NULL)
* `precio_venta` (REAL, NOT NULL)
* `stock` (INTEGER, DEFAULT 0)
* `created_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)
* `updated_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)

### 7. Tabla `ventas`
Historial de transacciones de venta directa de productos.
* `id` (INTEGER, PK, AUTOINCREMENT)
* `producto_id` (INTEGER, NOT NULL, FK)
* `cantidad` (INTEGER, NOT NULL)
* `precio_unitario` (REAL, NOT NULL)
* `total` (REAL, NOT NULL)
* `registrado_por` (TEXT) - Usuario del sistema que cargó la venta.
* `created_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)

### 8. Tabla `gastos`
Registro de egresos para el balance financiero mensual.
* `id` (INTEGER, PK, AUTOINCREMENT)
* `tipo` (TEXT, NOT NULL) - Fijos, variables, nómina, insumos.
* `categoria` (TEXT, NOT NULL)
* `descripcion` (TEXT, NOT NULL)
* `monto` (REAL, NOT NULL)
* `fecha` (DATE, NOT NULL)
* `empleado_id` (INTEGER) - Empleado relacionado (si aplica).
* `metodo_pago` (TEXT)
* `estado` (TEXT, DEFAULT 'completado')
* `notas` (TEXT)
* `registrado_por` (TEXT)
* `created_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)
* `updated_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)

### 9. Tabla `utilidades_mensuales`
Acumulado financiero consolidado por año y mes.
* `id` (INTEGER, PK, AUTOINCREMENT)
* `mes` (INTEGER, NOT NULL)
* `anio` (INTEGER, NOT NULL)
* `utilidad_neta` (REAL, NOT NULL) - `ingresos_totales - gastos_totales`.
* `ingresos_totales` (REAL, NOT NULL) - Sumatoria de servicios finalizados y ventas de productos.
* `gastos_totales` (REAL, NOT NULL) - Sumatoria de egresos.
* `utilidad_mes_anterior` (REAL, DEFAULT 0) - Balance arrastrado.
* `created_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)
* `updated_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)
* *Restricción:* Llave única en `(mes, anio)`.

---

## 6. Backend — API REST

### Autenticación y Perfil
* `POST /api/auth/login` - Inicio de sesión administrativo. Requiere email/username y password.
* `GET /api/auth/me` - Valida token y devuelve detalles del usuario.

### Citas
* `GET /api/citas` - Consulta citas de la sucursal (soporta filtros por fecha y estado).
* `GET /api/citas/:id` - Detalle de cita.
* `POST /api/citas` - Creación de nueva cita (con envío automático de email SMTP al cliente).
* `PUT /api/citas/:id` - Actualización de cita (asignación de lavador, cambio de estado, método de pago).
* `DELETE /api/citas/:id` - Borrado lógico (soft-delete) de citas.

### Lavadores
* `GET /api/lavadores` - Lista los lavadores activos.
* `POST /api/lavadores` - Registra nuevo lavador y su comisión base.
* `PUT /api/lavadores/:id` - Edita datos o estado activo/inactivo.
* `DELETE /api/lavadores/:id` - Soft-delete de lavadores.

### Servicios
* `GET /api/servicios` - Catálogo de servicios disponibles y precios por cilindraje.
* `POST /api/servicios` - Registra nuevo servicio de lavado.
* `PUT /api/servicios/:id` - Edita precios, duración o imágenes.
* `DELETE /api/servicios/:id` - Elimina un servicio.

### Nómina
* `GET /api/nomina` - Consulta de nómina de lavadores filtrada por mes y año.
* `POST /api/nomina/calcular` - Recalcula comisiones de citas completadas para generar liquidaciones.
* `PUT /api/nomina/:id/pagar` - Marca nómina de un lavador como pagada (genera registro automático en gastos).

### Inventario y Ventas
* `GET /api/productos` - Lista de insumos/productos en inventario.
* `POST /api/productos` - Agrega un producto.
* `POST /api/productos/merge-duplicates` - Combina productos duplicados unificando su stock y relaciones (Transaccional).
* `POST /api/productos/venta` - Registra una venta, reduciendo stock en inventario y generando ingresos en caja.

### Finanzas
* `GET /api/finanzas/gastos` - Consulta egresos detallados.
* `POST /api/finanzas/gastos` - Registra nuevo egreso (gastos fijos, insumos, etc.).
* `GET /api/finanzas/resumen` - Devuelve el balance de ingresos, egresos y utilidad del mes.

---

## 7. Frontend — SPA React

La aplicación frontend es un SPA estilizado con colores oscuros y luces de neón modernas.

### Estructura de Vistas principales:
* **Consola de Acceso (Login):** Ingreso para administradores y supervisores.
* **Dashboard Analítico:** Gráficos estadísticos de volumen de citas diarias, ingresos mensuales vs gastos y lavador con mayor rendimiento.
* **Calendario e Interfaz de Citas:** Gestión visual del flujo de citas desde que la moto ingresa hasta que se entrega.
* **Gestión de Lavadores y Nómina:** Panel para liquidar las comisiones de la sucursal mensualmente de manera simple.
* **Punto de Venta e Inventario:** Control de artículos en stock y realización de ventas rápidas.
* **Módulo de Egresos y Finanzas:** Dashboard contable con ingreso manual de gastos y generación de balances netos.

---

## 8. Autenticación y Seguridad

* **Hashing de Contraseñas:** Las contraseñas en el backend se encriptan con `bcrypt` usando un factor de costo seguro (salts de 10) antes de ser almacenadas.
* **JWT Stateless:** La autorización usa un token firmado mediante clave simétrica segura alojada en `.env`. Los tokens expiran de forma predeterminada en 1 día.
* **Rate Limiting:** Protección anti-fuerza bruta en rutas clave:
  * `/api/auth/login` limitado a 5 intentos fallidos por IP cada 15 minutos.
* **Seguridad CORS:** Restricción de llamadas de API únicamente a los dominios del cliente final autorizados en `.env`.

---

## 9. Roles y Permisos

El sistema implementa dos roles internos de administración:

### 1. Administrador (Admin)
* Acceso completo y sin restricciones a todos los módulos.
* Control global de comisiones de lavadores, tarifas de servicios y eliminación física de registros.
* Gestión de nóminas globales e ingresos consolidados de las sucursales.

### 2. Supervisor (Soporte en Sede)
* Gestión del calendario de citas y asignación de lavadores en la sede activa.
* Registro de ventas menores y caja chica (gastos variables básicos).
* No puede modificar el porcentaje de comisión preestablecido para los lavadores, ni ver los balances globales consolidados de otras sedes.

---

## 10. Módulos Funcionales

### Flujo de Citas
```
[ Cliente reserva vía web ] 
             │
             ▼
[ Cita aparece como "pendiente" en Dashboard ]
             │
             ▼
[ Supervisor asigna Lavador y cambia estado a "lavado" ]
             │
             ▼
[ Lavador finaliza. Cita pasa a "finalizado" y se elige "Método de Pago" ]
             │
             ▼
[ Se calcula la comisión del lavador y se registra el ingreso financiero ]
```

---

## 11. Variables de Entorno

### Backend (`backend/.env`)
```env
PORT=3000
NODE_ENV=production
JWT_SECRET=clave_criptografica_segura_de_96_caracteres
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-correo@gmail.com
SMTP_PASS=tu-contraseña-aplicacion
CORS_ORIGINS=https://motobombon.com,https://www.motobombon.com
```

### Frontend (`Frontend/.env.production`)
```env
VITE_API_URL=https://motobombon.com/api
```

---

## 12. Instalación y Puesta en Marcha

### 1. Requisitos del Sistema
* Node.js 18 o superior.
* NPM o Yarn.

### 2. Pasos de Instalación

```bash
# 1. Clonar el repositorio
cd /var/www
git clone <repo-url> motobombon
cd motobombon

# 2. Configurar base de datos inicial y sucursales
cd backend
npm install
node database/initAllSucursales.js

# 3. Construir Frontend
cd ../Frontend
npm install
npm run build
```

---

## 13. Despliegue y Operaciones (PM2 Clúster + Nginx)

En producción, la infraestructura del VPS está configurada para operar con alta disponibilidad.

### 1. Configuración de PM2 (Clúster)
El archivo `ecosystem.config.json` gestiona el backend en **Modo Clúster** distribuyendo el tráfico en 2 instancias:

```bash
# Iniciar servicios en producción
cd /var/www/motobombon
pm2 start ecosystem.config.json

# Mantener procesos vivos tras reinicios del sistema operativo
pm2 startup
pm2 save
```

* **Actualizaciones sin caída de servicio:**
  Para desplegar nuevas versiones del backend de manera transparente y sin interrumpir el servicio de los clientes, ejecuta:
  ```bash
  pm2 reload motobombon-backend
  ```

### 2. Configuración de Nginx (SSL HTTPS)
Nginx sirve la SPA en el root principal y delega la API REST al backend Node.js.

```nginx
server {
    listen 80;
    server_name motobombon.com www.motobombon.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name motobombon.com www.motobombon.com;

    ssl_certificate /etc/letsencrypt/live/motobombon.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/motobombon.com/privkey.pem;

    root /var/www/motobombon/Frontend/dist;
    index index.html;

    # Caché óptimo de assets estáticos React
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API REST Backend
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 14. Respaldos y Mantenimiento

### 1. Respaldos Automáticos de Bases de Datos
El script `backup.sh` en la raíz realiza una copia de seguridad diaria de todos los archivos `.sqlite` de las sucursales, guardándolos en un directorio seguro y limpiando respaldos de más de 7 días de antigüedad.

Está configurado para ejecutarse vía **Cron** todos los días a las 3:00 AM:

```bash
# Para registrar en crontab
crontab -e
# Agregar línea:
0 3 * * * /var/www/motobombon/backup.sh > /dev/null 2>&1
```

### 2. Monitoreo e Inspección
* Ver estado de la aplicación: `pm2 status`
* Monitor de consumo de CPU/RAM en tiempo real: `pm2 monit`
* Logs del backend en vivo: `pm2 logs motobombon-backend`

---

*Documento de especificación técnica de la plataforma MOTOBOMBON. Generado para auditoría de entrega a clientes.*
