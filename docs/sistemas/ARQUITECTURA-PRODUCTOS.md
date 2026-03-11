# 📦 MÓDULO PRODUCTOS Y VENTAS - IMPLEMENTACIÓN COMPLETADA

```
┌─────────────────────────────────────────────────────────────┐
│         FLUJO DE DATOS - PRODUCTOS Y VENTAS                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  👤 Admin/Supervisora                                        │
│       │                                                       │
│       ├─→ 📦 Crear Productos                                │
│       │   (Nombre, Precio Compra, Precio Venta, Stock)      │
│       │                                                       │
│       ├─→ 💰 Registrar Venta                                │
│       │   (Producto + Cantidad)                             │
│       │   ↓                                                  │
│       │   Stock -1                                          │
│       │   Ganancia = (Venta - Compra) × Cantidad            │
│       │                                                       │
│       └─→ 📊 Ver Reportes                                   │
│           (Ganancias, Totales, Por Período)                 │
│                                                               │
│       🗄️ BASE DE DATOS                                      │
│       ┌─────────────────────────┐                           │
│       │ TABLA: productos        │                           │
│       ├─────────────────────────┤                           │
│       │ • nombre                │                           │
│       │ • precio_compra         │                           │
│       │ • precio_venta          │                           │
│       │ • stock                 │                           │
│       └─────────────────────────┘                           │
│                                                               │
│       ┌─────────────────────────┐                           │
│       │ TABLA: ventas           │                           │
│       ├─────────────────────────┤                           │
│       │ • producto_id (FK)      │                           │
│       │ • cantidad              │                           │
│       │ • total                 │                           │
│       │ • registrado_por        │                           │
│       │ • created_at            │                           │
│       └─────────────────────────┘                           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 ARQUITECTURA DEL MÓDULO

```
FRONTEND (React/Vite)
│
├── 🎨 ProductosManagement.jsx (UI Principal)
│   ├── Tab 1: Gestionar Productos
│   ├── Tab 2: Registrar Ventas
│   └── Tab 3: Reportes
│
├── 📡 productosService.js (Llamadas API)
│   ├── obtenerProductos()
│   ├── crearProducto()
│   ├── actualizarProducto()
│   ├── eliminarProducto()
│   ├── registrarVenta()
│   └── obtenerReportes()
│
└── 🎨 ProductosManagement.css (Estilos)

               ↓ FETCH (JSON)

BACKEND (Node.js/Express)
│
├── 🔌 /api/productos (Rutas)
│   ├── GET /      → Listar productos
│   ├── POST /     → Crear producto
│   ├── PUT /:id   → Editar producto
│   ├── DELETE /:id → Eliminar producto
│   ├── POST /venta/registrar → Vender
│   ├── GET /reportes/diarias → Ventas hoy
│   └── GET /reportes/ganancias → Ganancias período
│
├── 🔐 middleware/auth.js (Seguridad)
│   └── requireAdminOrSupervisor()
│
└── 💾 database/
    ├── initProductos.js (Crear tablas)
    └── database.sqlite (BD)
```

---

## 📋 ARCHIVOS MODIFICADOS Y CREADOS

### ✅ NUEVOS ARCHIVOS

```
backend/
├── routes/
│   └── productos.js (295 líneas) 🆕
└── database/
    └── initProductos.js (42 líneas) 🆕

Frontend/
└── src/
    ├── services/
    │   └── productosService.js (115 líneas) 🆕
    └── components/admin/
        ├── ProductosManagement.jsx (340 líneas) 🆕
        └── ProductosManagement.css (315 líneas) 🆕

Documentación/
├── PRODUCTOS-VENTAS-MANUAL.md 🆕
├── PRODUCTOS-VENTAS-RESUMEN.md 🆕
├── QUICK-START-PRODUCTOS.md 🆕
├── init-productos.bat 🆕
└── init-productos.sh 🆕
```

### ✏️ ARCHIVOS MODIFICADOS

```
backend/
└── index.js (+2 líneas)
    - import productosRouter
    - app.use("/api/productos", productosRouter)

backend/
└── package.json (+1 línea)
    - "init-productos": "node database/initProductos.js"

Frontend/
└── src/components/admin/
    ├── AdminLayout.jsx (+4 líneas)
    │   - import ProductosManagement
    │   - case 'productos'
    │   - switch para render
    │
    └── Sidebar.jsx (+1 línea)
        - Nuevo item en menú: productos
```

---

## 🔐 CONTROL DE ACCESO

```
ROLES AUTORIZADOS:
✅ Admin
✅ Supervisor

ROLES NO AUTORIZADOS:
❌ Lavador
❌ Cliente
❌ Anonimo
```

---

## 💾 BASE DE DATOS - ESQUEMA

```sql
-- Tabla: productos
CREATE TABLE productos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE,
  precio_compra REAL NOT NULL,
  precio_venta REAL NOT NULL,
  stock INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)

-- Índices para búsquedas rápidas
CREATE INDEX idx_productos_nombre ON productos(nombre)

-- Tabla: ventas
CREATE TABLE ventas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  producto_id INTEGER NOT NULL,
  cantidad INTEGER NOT NULL,
  precio_unitario REAL NOT NULL,
  total REAL NOT NULL,
  registrado_por TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (producto_id) REFERENCES productos(id)
)

-- Índices para búsquedas rápidas
CREATE INDEX idx_ventas_producto ON ventas(producto_id)
CREATE INDEX idx_ventas_fecha ON ventas(created_at)
```

---

## 📡 API REST COMPLETA

### Productos

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/productos` | Listar todos | Admin/Supervisor |
| POST | `/api/productos` | Crear nuevo | Admin/Supervisor |
| PUT | `/api/productos/:id` | Actualizar | Admin/Supervisor |
| DELETE | `/api/productos/:id` | Eliminar | Admin/Supervisor |

### Ventas

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/productos/venta/registrar` | Registrar venta | Admin/Supervisor |
| GET | `/api/productos/reportes/diarias?fecha=YYYY-MM-DD` | Ventas del día | Admin/Supervisor |
| GET | `/api/productos/reportes/ganancias?desde=YYYY-MM-DD&hasta=YYYY-MM-DD` | Ganancias período | Admin/Supervisor |

---

## 🎯 CASOS DE USO

### Caso 1: Crear Catálogo de Bebidas
```
1. Admin abre "📦 Productos"
2. Llena formulario:
   - Nombre: "Coca Cola 350ml"
   - Precio Compra: 2000
   - Precio Venta: 5000
   - Stock: 10
3. Click "Crear"
4. Sistema muestra margen: 150%
```

### Caso 2: Registrar Venta
```
1. Cliente llega y compra 2 Coca Colas
2. Supervisor abre tab "💰 Registrar Venta"
3. Selecciona "Coca Cola 350ml"
4. Ingresa cantidad: 2
5. Click "Registrar Venta"
6. Sistema:
   - Descuenta stock: 10 → 8
   - Registra venta: $10,000
   - Calcula ganancia: $6,000
   - Registra quién vendió (automático)
```

### Caso 3: Ver Reportes
```
1. Abre tab "📊 Reportes"
2. Filtra por fecha
3. Ve:
   - Todas las ventas del día
   - Ganancia por venta
   - Total diario
   - Ganancia neta del día
```

---

## 🔒 VALIDACIONES IMPLEMENTADAS

```javascript
✅ precio_venta >= precio_compra
   ├─ Si No → Error: "El precio de venta debe ser mayor o igual"
   
✅ cantidad > 0
   ├─ Si No → Error: "La cantidad debe ser mayor a 0"
   
✅ stock >= cantidad_venta
   ├─ Si No → Error: "Stock insuficiente. Disponible: X"
   
✅ nombre_producto UNIQUE
   ├─ Si duplicado → Error: "El producto ya existe"
   
✅ Token JWT presente
   ├─ Si No → Unauthorized (401)
   
✅ User.role in ['admin', 'supervisor']
   ├─ Si No → Forbidden (403)
```

---

## 🚀 INSTALACIÓN

### Paso 1: Inicializar Base de Datos
```bash
# Windows
init-productos.bat

# Linux/Mac
bash init-productos.sh

# O manualmente
cd backend && npm run init-productos
```

### Paso 2: Iniciar Servidor
```bash
cd backend
npm run dev
```

### Paso 3: Iniciar Frontend
```bash
cd Frontend
npm run dev
```

### Paso 4: Acceder
```
http://localhost:5173
Username: admin
Password: (según tu config)
```

---

## 📊 REPORTES DISPONIBLES

### Reporte Diario
```json
{
  "ventas": [
    {
      "id": 1,
      "producto": "Coca Cola 350ml",
      "cantidad": 2,
      "precio_unitario": 5000,
      "total": 10000,
      "ganancia": 6000,
      "registrado_por": "admin",
      "created_at": "2026-01-22T10:30:00Z"
    }
  ],
  "resumen": {
    "totalVentas": 10000,
    "totalGanancia": 6000,
    "cantidadVentas": 1
  }
}
```

### Reporte de Ganancias por Período
```json
[
  {
    "fecha": "2026-01-22",
    "cantidad_ventas": 5,
    "total_ventas": 50000,
    "ganancia_neta": 30000
  },
  {
    "fecha": "2026-01-21",
    "cantidad_ventas": 3,
    "total_ventas": 30000,
    "ganancia_neta": 18000
  }
]
```

---

## 🎨 INTERFAZ DE USUARIO

### Tab 1: Productos
```
┌──────────────────────────────────┐
│ ➕ Nuevo Producto                │
├──────────────────────────────────┤
│ Nombre: [________________]        │
│ Precio Compra: [_____]            │
│ Precio Venta: [_____]             │
│ Stock: [_____]                    │
│ [Crear]  [Cancelar]               │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ Productos registrados             │
├──────────────────────────────────┤
│ Nombre │ Compra │ Venta │ Margen │
├──────────────────────────────────┤
│ Coca.. │ $2000 │ $5000 │ 150%  │
│ Cerv.. │ $5000 │ $12000│ 140%  │
└──────────────────────────────────┘
```

### Tab 2: Ventas
```
┌──────────────────────────────────┐
│ 💳 Registrar Nueva Venta         │
├──────────────────────────────────┤
│ Producto: [Coca Cola 350ml ▼]    │
│ Cantidad: [2]                    │
│ [Registrar Venta]                │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ Ventas de hoy (2026-01-22)       │
├──────────────────────────────────┤
│ Hora│Producto│Cant│Total│Ganancia│
├──────────────────────────────────┤
│10:30│Coca    │ 2  │10000│ 6000  │
│11:45│Cerveza │ 1  │12000│ 7000  │
│                 Total: 22000     │
│                Ganancia: 13000   │
└──────────────────────────────────┘
```

---

## 📈 METRICS Y ANALYTICS

### Métricas Disponibles
- Total ventas por día
- Total ganancia por día
- Cantidad de transacciones
- Margen de ganancia por producto
- Stock actual
- Producto más vendido
- Ganancia promedio por venta

---

## 🔄 FLUJO DE UNA VENTA COMPLETA

```
1. Cliente llega al motolavado
2. Pide una bebida (Coca Cola)
3. Supervisora abre app
   ├─ Tab: "Registrar Venta"
   ├─ Selecciona: "Coca Cola 350ml"
   ├─ Cantidad: 1
   └─ Click: "Registrar Venta"

4. Sistema:
   ├─ Crea registro en tabla "ventas"
   ├─ Actualiza tabla "productos"
   │  └─ stock: 10 → 9
   ├─ Calcula ganancia: 5000 - 2000 = 3000
   ├─ Registra quién vendió: "supervisora_nombre"
   ├─ Registra hora: 2026-01-22 10:30:45
   └─ Muestra confirmación: "✅ Venta registrada"

5. Cliente paga $5,000
6. Supervisora ve actualización:
   ├─ Nuevo stock
   ├─ Nueva ganancia en resumen
   └─ Total diario actualizado
```

---

## ✨ CARACTERÍSTICAS DESTACADAS

✅ **Automático**: Stock, ganancias, horarios
✅ **Seguro**: JWT, roles, validaciones
✅ **Rápido**: UI responsiva, cálculos instantáneos
✅ **Auditable**: Quién vendió, cuándo, qué
✅ **Reporteable**: Datos por período
✅ **Escalable**: Fácil agregar más funciones

---

## 🆘 TROUBLESHOOTING

| Problema | Solución |
|----------|----------|
| "No veo el menú de Productos" | Ingresa como Admin o Supervisor |
| "Error: Module not found" | Ejecuta `init-productos.bat` |
| "Stock insuficiente" | Aumenta stock del producto |
| "La BD está vacía" | Crea productos primero |
| "No aparece la venta" | Recarga la página (F5) |

---

## 📝 PRÓXIMOS PASOS SUGERIDOS

1. ✅ **HECHO**: Módulo básico
2. 🔄 **PRÓXIMO**: Exportar reportes a Excel
3. 🔄 **PRÓXIMO**: Gráficos de ventas
4. 🔄 **PRÓXIMO**: Notificaciones de stock bajo
5. 🔄 **PRÓXIMO**: Historial de precios

---

**Estado:** ✅ COMPLETO Y LISTO PARA USAR

Ejecuta `init-productos.bat` y comienza a vender! 🚀
