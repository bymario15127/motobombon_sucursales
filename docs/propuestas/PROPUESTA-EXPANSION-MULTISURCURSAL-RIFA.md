# 📋 PROPUESTA: EXPANSIÓN MULTI-SUCURSAL + SISTEMA DE RIFA

**Fecha:** 30 Enero 2026  
**Proyecto:** MOTOBOMBON - Lavado de Motos  
**Versión:** 1.0

---

## 🎯 OBJETIVO GENERAL

Expandir MOTOBOMBON a múltiples sucursales manteniendo **una sola inversión en infraestructura** pero con **bases de datos independientes para cada sucursal**, más un **sistema de rifa/sorteo complementario** sin afectar las operaciones principales.

---

## 📊 SOLUCIÓN PROPUESTA

### **Arquitectura General**

```
┌─────────────────────────────────────────────────────────────┐
│                    www.motobombon.com                       │
├─────────────────────────────────────────────────────────────┤
│                    NGINX (Reverse Proxy)                    │
├─────────────────────────────────────────────────────────────┤
│  /principal  │  /1-mayo  │  /torre  │  /rifa               │
├──────────────┼───────────┼──────────┼──────────────────────┤
│  Puerto 3000 │ Puerto 3000│ Puerto 3000 │ Puerto 3001      │
│  (APP 1)     │ (APP 1)    │ (APP 1)     │ (APP 2)          │
├──────────────┼───────────┼──────────┼──────────────────────┤
│ BD           │ BD        │ BD       │ BD                   │
│ moto_bombon_ │moto_bombon│moto_bombon_│moto_bombon_      │
│ principal    │_1mayo     │torre     │ rifa                │
└──────────────┴───────────┴──────────┴──────────────────────┘
```

---

## 🏢 PARTE 1: SISTEMA MULTI-SUCURSAL

### **Cómo Funciona**

#### **URLs Resultantes:**
```
www.motobombon.com/principal/     → Sucursal Principal
www.motobombon.com/1-mayo/        → Sucursal 1 de Mayo
www.motobombon.com/torre/         → Sucursal Torre
www.motobombon.com/center/        → Sucursal Center
```

#### **Datos Independientes por Sucursal:**
- ✅ **Clientes** separados (sin mezcla)
- ✅ **Reservas/Citas** independientes
- ✅ **Lavadores** propios
- ✅ **Talleres** propios
- ✅ **Productos** y precios diferentes
- ✅ **Reportes** por sucursal
- ✅ **Usuarios admin** propios

---

### **Implementación Técnica - MULTI-SUCURSAL**

#### **1. Estructura de Carpetas en VPS:**
```
/var/www/motobombon/
├── backend/
│   ├── index.js                    (Modificado)
│   ├── package.json
│   ├── config/
│   │   └── databases.js            (NUEVO)
│   ├── middleware/
│   │   └── sucursalMiddleware.js   (NUEVO)
│   └── routes/
│       ├── citas.js
│       ├── clientes.js
│       ├── productos.js
│       └── ... (igual para todos)
└── Frontend/                        (Se adapta automáticamente)
```

---

#### **2. Configuración de Bases de Datos:**

**Archivo: `config/databases.js`**
```javascript
module.exports = {
  principal: {
    name: 'moto_bombon_principal',
    url: 'mongodb://localhost/moto_bombon_principal'
  },
  '1-mayo': {
    name: 'moto_bombon_1mayo',
    url: 'mongodb://localhost/moto_bombon_1mayo'
  },
  torre: {
    name: 'moto_bombon_torre',
    url: 'mongodb://localhost/moto_bombon_torre'
  },
  center: {
    name: 'moto_bombon_center',
    url: 'mongodb://localhost/moto_bombon_center'
  }
};
```

---

#### **3. Middleware de Detección de Sucursal:**

**Archivo: `middleware/sucursalMiddleware.js`**
```javascript
module.exports = (req, res, next) => {
  // Detecta la sucursal desde la URL
  const match = req.path.match(/^\/(principal|1-mayo|torre|center)\//);
  req.sucursal = match ? match[1] : 'principal';
  
  console.log(`📍 Sucursal: ${req.sucursal}`);
  next();
};
```

---

#### **4. Modificación del Index:**

**Archivo: `backend/index.js` (parcial)**
```javascript
const express = require('express');
const mongoose = require('mongoose');
const databases = require('./config/databases');
const sucursalMiddleware = require('./middleware/sucursalMiddleware');

const app = express();

// Middleware global
app.use(sucursalMiddleware);
app.use(express.json());

// Conexiones multi-BD
const connections = {};
async function initializeConnections() {
  for (const [sucursal, config] of Object.entries(databases)) {
    try {
      const conn = mongoose.createConnection(config.url);
      connections[sucursal] = conn;
      console.log(`✅ Conectado a ${sucursal}`);
    } catch (error) {
      console.error(`❌ Error: ${sucursal}`, error);
    }
  }
}

// Inyecta la BD correcta
app.use((req, res, next) => {
  req.db = connections[req.sucursal];
  next();
});

// Rutas con prefijo
app.use('/:sucursal/citas', require('./routes/citas'));
app.use('/:sucursal/clientes', require('./routes/clientes'));
app.use('/:sucursal/reservas', require('./routes/reservas'));

initializeConnections();
app.listen(3000, () => console.log('🚀 Server 3000'));
```

---

#### **5. Uso de BD en las Rutas:**

**Ejemplo: `routes/citas.js`**
```javascript
const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  // req.db apunta a la BD correcta de esa sucursal
  const Cita = req.db.model('Cita', citaSchema);
  const citas = await Cita.find();
  res.json(citas);
});

router.post('/', async (req, res) => {
  const Cita = req.db.model('Cita', citaSchema);
  const nuevaCita = new Cita(req.body);
  await nuevaCita.save();
  res.json(nuevaCita);
});

module.exports = router;
```

---

#### **6. Configuración Nginx:**

**Archivo: `nginx.conf`**
```nginx
upstream motobombon_app {
    server localhost:3000;
}

server {
    listen 80;
    server_name motobombon.com www.motobombon.com;

    # Rutas de sucursales
    location ~^/(principal|1-mayo|torre|center)/ {
        proxy_pass http://motobombon_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Default a principal
    location / {
        return 301 /principal/;
    }
}
```

---

### **Ventajas - MULTI-SUCURSAL**

| Aspecto | Beneficio |
|---------|-----------|
| **Escalabilidad** | Agregar sucursal = cambiar 3 líneas de código |
| **Datos Independientes** | Cero mezcla entre sucursales |
| **Un solo servidor** | Ahorro de infraestructura |
| **URLs Claras** | Fácil de recordar y compartir |
| **Sin downtime** | Agregar sucursal sin parar app actual |
| **Reportes** | Cada sucursal ve solo sus datos |
| **Usuarios** | Admin específico por sucursal |

---

---

## 🎰 PARTE 2: SISTEMA DE RIFA

### **Cómo Funciona**

#### **URL:**
```
www.motobombon.com/rifa/
```

#### **Funcionalidad:**
- 🎫 Compra de tickets para sorteo
- 💳 Integración con pasarela Wompi
- 📊 Panel de administración
- 🏆 Sorteo y anunciamiento de ganador
- 📱 Notificaciones por email/SMS

---

### **Implementación Técnica - RIFA**

#### **1. Estructura de Carpetas en VPS:**

```
/var/www/rifa/
├── backend/
│   ├── index.js
│   ├── package.json
│   ├── models/
│   │   ├── Ticket.js          (Ticket de rifa)
│   │   ├── Rifa.js            (Info general sorteo)
│   │   └── Ganador.js         (Registro de ganadores)
│   ├── routes/
│   │   ├── tickets.js         (Compra de tickets)
│   │   ├── pagos.js           (Integración Wompi)
│   │   ├── admin.js           (Gestión sorteo)
│   │   └── confirmacion.js    (Verificación de pago)
│   └── services/
│       ├── wompi.js           (API Wompi)
│       └── email.js           (Notificaciones)
└── Frontend/
    └── src/
        ├── pages/
        │   ├── ComprarTickets.jsx
        │   ├── MisTickets.jsx
        │   ├── VerificacionPago.jsx
        │   └── Admin/
        │       ├── DashboardRifa.jsx
        │       └── SortearGanador.jsx
```

---

#### **2. Modelo de Ticket:**

```javascript
// models/Ticket.js
const ticketSchema = new mongoose.Schema({
  numero: {
    type: String,
    unique: true,
    required: true
    // Formato: #00001, #00002, etc
  },
  cliente: {
    nombre: String,
    cedula: String,
    email: String,
    telefono: String
  },
  precio: {
    type: Number,
    default: 50000  // Pesos colombianos
  },
  estado: {
    type: String,
    enum: ['disponible', 'vendido', 'ganador'],
    default: 'disponible'
  },
  fechaCompra: Date,
  ordenPago: String,        // ID de transacción Wompi
  pagado: Boolean,
  createdAt: {
    type: Date,
    default: Date.now
  }
});
```

---

#### **3. Rutas - Compra de Tickets:**

```javascript
// routes/tickets.js
const express = require('express');
const axios = require('axios');
const router = express.Router();
const Ticket = require('../models/Ticket');

// Cliente compra tickets
router.post('/comprar', async (req, res) => {
  const { nombre, cedula, email, telefono, cantidad } = req.body;

  const monto = cantidad * 50000;

  try {
    // 1. Crear transacción en Wompi
    const wompiResponse = await axios.post(
      'https://api.wompi.co/v1/transactions',
      {
        amount_in_cents: monto * 100,
        currency: 'COP',
        customer_email: email,
        payment_method: { type: 'CARD' },
        reference: `RIFA-${Date.now()}`,
        redirect_url: 'https://motobombon.com/rifa/confirmacion'
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WOMPI_PRIVATE_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // 2. Guardar tickets en BD (estado: pendiente de pago)
    for (let i = 0; i < cantidad; i++) {
      const ticket = new Ticket({
        numero: generateTicketNumber(),
        cliente: { nombre, cedula, email, telefono },
        precio: 50000,
        ordenPago: wompiResponse.data.id,
        estado: 'disponible',
        pagado: false
      });
      await ticket.save();
    }

    // 3. Retornar link de pago
    res.json({
      success: true,
      link_pago: wompiResponse.data.payment_link,
      referencia: wompiResponse.data.reference
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verificar pago
router.post('/verificar-pago', async (req, res) => {
  const { referencia } = req.body;

  const wompiResponse = await axios.get(
    `https://api.wompi.co/v1/transactions/${referencia}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.WOMPI_PRIVATE_KEY}`
      }
    }
  );

  if (wompiResponse.data.data.status === 'APPROVED') {
    // Actualizar tickets a estado "vendido"
    await Ticket.updateMany(
      { ordenPago: referencia },
      { $set: { pagado: true, estado: 'vendido' } }
    );

    res.json({ success: true, message: 'Pago confirmado' });
  }
});

module.exports = router;
```

---

#### **4. Admin - Gestión del Sorteo:**

```javascript
// routes/admin.js
router.get('/dashboard', async (req, res) => {
  const totalTickets = await Ticket.countDocuments();
  const vendidos = await Ticket.countDocuments({ estado: 'vendido' });
  const ingresos = await Ticket.aggregate([
    { $match: { estado: 'vendido' } },
    { $group: { _id: null, total: { $sum: '$precio' } } }
  ]);

  res.json({
    totalTickets,
    vendidos,
    disponibles: totalTickets - vendidos,
    porcentajeVenta: ((vendidos / totalTickets) * 100).toFixed(2),
    ingresos: ingresos[0]?.total || 0
  });
});

// Realizar sorteo
router.post('/sortear', async (req, res) => {
  // Obtener todos los tickets vendidos
  const ticketsVendidos = await Ticket.find({ estado: 'vendido' });

  // Seleccionar ganador aleatorio
  const ganador = ticketsVendidos[
    Math.floor(Math.random() * ticketsVendidos.length)
  ];

  // Actualizar estado
  await Ticket.findByIdAndUpdate(ganador._id, {
    estado: 'ganador'
  });

  // Enviar email
  await emailService.enviarGanador(ganador.cliente);

  res.json({
    ganador: ganador.numero,
    cliente: ganador.cliente
  });
});

module.exports = router;
```

---

#### **5. Configuración Index Rifa:**

```javascript
// /var/www/rifa/backend/index.js
const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

// BD RIFA (completamente separada)
mongoose.connect('mongodb://localhost/moto_bombon_rifa');

// Rutas
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/pagos', require('./routes/pagos'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/confirmacion', require('./routes/confirmacion'));

app.listen(3001, () => {
  console.log('🎰 Rifa Server corriendo en puerto 3001');
});
```

---

#### **6. Configuración Nginx (Actualizada):**

```nginx
upstream motobombon_app {
    server localhost:3000;
}

upstream rifa_app {
    server localhost:3001;
}

server {
    listen 80;
    server_name motobombon.com www.motobombon.com;

    # RUTAS MULTI-SUCURSAL
    location ~^/(principal|1-mayo|torre|center)/ {
        proxy_pass http://motobombon_app;
    }

    # RIFA (APP INDEPENDIENTE)
    location /rifa {
        proxy_pass http://rifa_app;
        proxy_set_header Host $host;
    }

    # Default
    location / {
        return 301 /principal/;
    }
}
```

---

### **Ventajas - RIFA**

| Aspecto | Beneficio |
|---------|-----------|
| **Independencia** | Falla en rifa ≠ falla en lavado |
| **BD Separada** | Cero interferencia con datos principales |
| **Escalable** | Puede agregar múltiples rifas |
| **Temporal** | Fácil de desactivar cuando termine |
| **Pasarela segura** | Wompi maneja pagos (PCI compliant) |
| **Automatización** | Notificaciones automáticas |
| **Reportes** | Dashboard de ventas en tiempo real |

---

---

## 🚀 DESPLIEGUE EN VPS

### **Estructura Final en VPS:**

```
/var/www/
├── motobombon/
│   ├── backend/          (npm start → puerto 3000)
│   └── Frontend/
│
└── rifa/
    ├── backend/          (npm start → puerto 3001)
    └── Frontend/
```

---

### **Comandos de Arranque:**

```bash
# Terminal 1 - App Principal
cd /var/www/motobombon/backend
npm start                    # Puerto 3000

# Terminal 2 - App Rifa
cd /var/www/rifa/backend
npm start                    # Puerto 3001
```

**O con PM2 (recomendado):**

```bash
# ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'motobombon',
      cwd: '/var/www/motobombon/backend',
      script: 'index.js',
      instances: 1,
      env: { PORT: 3000 }
    },
    {
      name: 'rifa',
      cwd: '/var/www/rifa/backend',
      script: 'index.js',
      instances: 1,
      env: { PORT: 3001 }
    }
  ]
};

# Comando:
pm2 start ecosystem.config.js
```

---

---

## 📱 EXPERIENCIA DEL USUARIO

### **Flujo Cliente - Multi-Sucursal:**

```
1. Usuario accede a www.motobombon.com
   ↓
2. Redirige a /principal/ (opción 1)
   o muestra selector de sucursal (opción 2)
   ↓
3. Ingresa a /principal/login o /1-mayo/login
   ↓
4. Ve solo datos de esa sucursal
   ↓
5. Hace cita/compra en esa sucursal
```

### **Flujo Cliente - Rifa:**

```
1. Usuario accede a www.motobombon.com/rifa
   ↓
2. Ve información del sorteo
   ↓
3. Compra tickets (selecciona cantidad)
   ↓
4. Redirige a pasarela Wompi
   ↓
5. Paga con tarjeta
   ↓
6. Recibe confirmación por email
   ↓
7. En admin se sortea y avisa ganador
```

---

---

## 💰 COSTOS Y RECURSOS

### **Hardware Requerido:**

| Recurso | Especificación |
|---------|----------------|
| **CPU** | 2 cores (suficiente) |
| **RAM** | 4GB (mínimo recomendado) |
| **Almacenamiento** | 100GB (para crecer) |
| **BD** | MongoDB o MySQL existente |

---

### **Costos (Aproximados):**

| Concepto | Costo |
|----------|-------|
| **VPS** | $10-20/mes (actual) |
| **Dominio** | Ya existe |
| **SSL** | Gratis (Let's Encrypt) |
| **Wompi** (comisión) | 3% del monto transacción |
| **Desarrollo** | Según alcance |

---

---

## ✅ PLAN DE IMPLEMENTACIÓN

### **Fase 1: Preparación (1 semana)**
- [ ] Crear BD para sucursales (principal, 1-mayo, torre)
- [ ] Crear middleware de sucursales
- [ ] Modificar archivo de configuración
- [ ] Pruebas en local

### **Fase 2: Despliegue Multi-Sucursal (1 semana)**
- [ ] Subir cambios a VPS
- [ ] Configurar Nginx
- [ ] Pruebas en producción
- [ ] Backups

### **Fase 3: Sistema Rifa (2 semanas)**
- [ ] Crear proyecto separado `/var/www/rifa`
- [ ] Integración Wompi
- [ ] Frontend compra tickets
- [ ] Admin dashboard
- [ ] Pruebas

### **Fase 4: Lanzamiento (1 semana)**
- [ ] Capacitación staff
- [ ] Lanzamiento multi-sucursal
- [ ] Lanzamiento rifa
- [ ] Monitoreo 24/7

---

---

## ⚠️ CONSIDERACIONES IMPORTANTES

### **Seguridad:**
- ✅ Cada sucursal solo accede su BD
- ✅ Wompi maneja encriptación de pagos
- ✅ JWT por sucursal
- ✅ Rate limiting en endpoints

### **Performance:**
- ✅ MongoDB índices optimizados
- ✅ Caché por sucursal
- ✅ CDN para assets (opcional)

### **Mantenimiento:**
- ✅ Backups automáticos por BD
- ✅ Logs separados por sucursal
- ✅ Monitoreo en tiempo real

---

---

## 📞 PRÓXIMOS PASOS

1. **Aprobación de propuesta**
2. **Reunión técnica detalles**
3. **Inicio desarrollo Fase 1**
4. **Testing en ambiente local**
5. **Despliegue progresivo**

---

**Contacto Desarrollo:** [Tu correo]  
**Última actualización:** 30 Enero 2026
