# 🎄 Sistema de Promociones MOTOBOMBON

## Resumen

Se ha implementado un sistema completo de **promociones especiales** que funciona en paralelo con los servicios normales. Esto permite que el cliente pague un precio diferente al que se usa para calcular la comisión del lavador.

### Ejemplo GOLD NAVIDEÑO
- **Cliente paga**: $25.000 (Bajo CC) o $28.000 (Alto CC)
- **Lavador comisiona sobre**: $45.000 (fijo, sin importar el CC)

## 🏗️ Arquitectura

### Backend

#### 1. **Base de Datos** (`database.sqlite`)
Tabla `promociones` con campos:
```sql
CREATE TABLE IF NOT EXISTS promociones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio_cliente_bajo_cc REAL,      -- Lo que paga el cliente
  precio_cliente_alto_cc REAL,      -- Lo que paga el cliente
  precio_comision_bajo_cc REAL,     -- Base para comisión
  precio_comision_alto_cc REAL,     -- Base para comisión
  duracion INTEGER,
  activo INTEGER DEFAULT 1,
  fecha_inicio DATE,
  fecha_fin DATE,
  imagen TEXT,
  imagen_bajo_cc TEXT,
  imagen_alto_cc TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

Tabla `citas` agrega columna:
```sql
promocion_id INTEGER  -- Referencia a la promoción (null si es servicio normal)
```

#### 2. **API Routes**

**GET `/api/servicios`** - Devuelve servicios Y promociones activas
```javascript
// Ahora devuelve un array con:
[
  { id: 1, nombre: "Lavado Básico", tipo: "servicio", ... },
  { id: 2, nombre: "Lavado Premium", tipo: "servicio", ... },
  { id: 1, nombre: "GOLD NAVIDEÑO", tipo: "promocion", ... }
]
```

**GET/POST/PUT/DELETE `/api/promociones`** - CRUD de promociones
- `GET /` - Lista todas las promociones
- `GET /:id` - Una promoción específica
- `POST /` - Crear promoción
- `PUT /:id` - Actualizar promoción
- `DELETE /:id` - Eliminar promoción

**POST `/api/citas`** - Ahora acepta `promocion_id`
```javascript
{
  cliente: "Juan",
  servicio: "GOLD NAVIDEÑO",    // Nombre de la promoción
  promocion_id: 1,               // ID de la promoción
  cilindraje: 600,
  metodo_pago: "codigo_qr",
  ...
}
```

#### 3. **Cálculo de Nómina** (`nomina.js`)
El endpoint `/api/nomina` ahora:
1. **Prioridad 1**: Si la cita tiene `promocion_id`, usa los precios de comisión de la promoción
2. **Prioridad 2**: Si es taller aliado, usa precios del taller
3. **Prioridad 3**: Si es cliente normal, usa precios del servicio

```javascript
// En la nómina:
if (cita.promocion_id && cita.promo_precio_comision_bajo_cc) {
  precio = cita.promo_precio_comision_bajo_cc;      // $45.000 para comisión
  precioCliente = cita.promo_precio_cliente_bajo_cc; // $25.000 lo que pagó
}
```

### Frontend

#### 1. **Componente PromocionesManager** 
- Ruta: `/src/components/admin/PromocionesManager.jsx`
- Panel para crear, editar y eliminar promociones
- Accesible desde Admin > Promociones (⚡)

#### 2. **ReservaForm Actualizado**
- Ahora carga promociones junto con servicios
- Marca promociones con emoji 🎄
- Envía `promocion_id` cuando el cliente selecciona una promoción

```javascript
// Estructura del form actualizada:
{
  servicio: "GOLD NAVIDEÑO",
  promocion_id: 1,           // ← Nuevo
  esPromocion: true,         // ← Nuevo
  cliente: "...",
  ...
}
```

#### 3. **Estructura del Admin**
```
AdminLayout.jsx
├── imports PromocionesManager.jsx
├── case 'promociones': → PromocionesManager
└── Sidebar.jsx
    └── { id: 'promociones', icon: '⚡', label: 'Promociones', roles: ['admin'] }
```

## 🔄 Flujo Completo

### 1. Cliente Reserva
```
ReservaForm
  ↓
  Selecciona "GOLD NAVIDEÑO 🎄" (precio $25.000/$28.000)
  ↓
  Envía: { servicio: "GOLD NAVIDEÑO", promocion_id: 1, ... }
  ↓
  POST /api/citas
```

### 2. Base de Datos
```
Cita guardada:
{
  id: 123,
  cliente: "Juan",
  servicio: "GOLD NAVIDEÑO",
  promocion_id: 1,           ← Marca que es promoción
  cilindraje: 600,
  estado: "pendiente",
  ...
}
```

### 3. Nómina (GET /api/nomina)
```
El sistema detecta promocion_id = 1
  ↓
  Obtiene precios de promoción:
    - precio_comision_bajo_cc: $45.000
    - precio_cliente_bajo_cc: $25.000
  ↓
  Calcula:
    - Lo que pagó el cliente: $25.000
    - Base para comisión: $45.000
    - Comisión 30%: $13.500
```

## 📊 Ejemplo: GOLD NAVIDEÑO

### Datos de la Promoción
```
Nombre: GOLD NAVIDEÑO
Descripción: GRACIAS POR HACER FELIZ A UNA FAMILIA EN ESTE DICIEMBRE
Precio Cliente Bajo CC: $25.000
Precio Cliente Alto CC: $28.000
Precio Comisión Bajo CC: $45.000
Precio Comisión Alto CC: $45.000
Duración: 60 minutos
Vigencia: 2025-12-01 a 2025-12-31
```

### Si llega una cita:
```
Cliente: "Mario" (600 CC)
  ↓
  Paga: $28.000 (Alto CC)
  ↓
  Lavador comisiona sobre: $45.000 (Alto CC)
  ↓
  Comisión a 30%: $13.500
```

## 🛠️ Cómo Crear una Promoción

### En Admin Panel:
1. Ir a **Promociones** (⚡) en el sidebar
2. Llenar el formulario:
   - Nombre: "Mi Promoción"
   - Descripción: (opcional)
   - **Precio Cliente**: Lo que cobra al cliente
   - **Precio Comisión**: Sobre qué valor se calcula la comisión ⭐
   - Fechas: Inicio y fin
   - Imágenes: (opcional)
3. Hacer clic en **"Crear"**

### La promoción ahora:
- Aparece en el formulario de clientes
- Se filtra automáticamente por fecha (solo muestra si hoy está entre inicio y fin)
- Aparece como opción al hacer reserva

## 🚀 API Endpoints Principales

### Servicios (con promociones)
```
GET /api/servicios
Respuesta: [
  { id: 1, nombre: "...", tipo: "servicio", precio_bajo_cc: ..., ... },
  { id: 1, nombre: "GOLD NAVIDEÑO", tipo: "promocion", precio_cliente_bajo_cc: ..., ... }
]
```

### CRUD Promociones
```
GET /api/promociones                    - Listar todas
GET /api/promociones/:id                - Una promoción
POST /api/promociones                   - Crear
  Body: { nombre, descripcion, precio_cliente_bajo_cc, ... }
PUT /api/promociones/:id                - Actualizar
DELETE /api/promociones/:id             - Eliminar
```

### Crear Cita con Promoción
```
POST /api/citas
Body: {
  cliente: "Juan",
  servicio: "GOLD NAVIDEÑO",
  promocion_id: 1,
  cilindraje: 600,
  ...
}
```

### Generar Nómina
```
GET /api/nomina?fechaInicio=2025-12-01&fechaFin=2025-12-31
Respuesta incluye:
{
  reportePorLavador: [
    {
      nombre: "Carlos",
      total_ingreso_cliente: 100000,      ← Lo que realmente pagó el cliente
      total_generado: 150000,              ← Base de comisión
      comision_a_pagar: 45000             ← 30% de total_generado
    }
  ]
}
```

## 📝 Archivos Creados/Modificados

### Creados ✨
- `backend/routes/promociones.js` - API de promociones
- `Frontend/src/components/admin/PromocionesManager.jsx` - Panel de admin

### Modificados 🔄
- `backend/index.js` - Importa y registra ruta `/api/promociones`
- `backend/routes/servicios.js` - GET ahora devuelve servicios + promociones
- `backend/routes/citas.js` - Acepta y guarda `promocion_id`
- `backend/routes/nomina.js` - Calcula comisión basada en `promocion_id`
- `Frontend/src/components/Cliente/ReservaForm.jsx` - Maneja promociones
- `Frontend/src/components/admin/AdminLayout.jsx` - Integra PromocionesManager
- `Frontend/src/components/admin/Sidebar.jsx` - Añade opción "Promociones"

## ✅ Casos de Uso Completados

- ✅ Cliente ve promociones junto con servicios
- ✅ Cliente selecciona promoción y ve precio diferente por CC
- ✅ Backend guarda qué promoción se usó en la cita
- ✅ Nómina calcula comisión diferente para promociones
- ✅ Admin puede crear/editar/eliminar promociones
- ✅ Promociones se filtran automáticamente por fecha vigencia
- ✅ Sistema de precios dobles funcionando perfectamente

## 💡 Casos Prácticos

### Escenario: Oferta de Diciembre
```
Crear promoción "Lavado de Navidad":
- Cliente paga: $30.000
- Lavador comisiona: $40.000 (quiere que no se pierda dinero en oferta)
- Vigencia: 12/01/2025 a 12/31/2025
- Al hacer nómina: ingresos reales son $30k, pero comisión se calcula sobre $40k
```

### Escenario: Servicio Especial
```
Crear promoción "Detallado + Brillo":
- Cliente paga: $50.000 (servicio especial)
- Lavador comisiona: $60.000 (porque le toma más tiempo)
- El cliente paga menos pero el lavador gana más
```

## 🔐 Seguridad

- ✅ Validación en backend de todos los campos
- ✅ Promociones solo se muestran si están activas Y vigentes
- ✅ Solo admin puede crear/editar/eliminar promociones
- ✅ Precios se validan en backend

## 📞 Soporte

Si necesitas:
- ✏️ Editar GOLD NAVIDEÑO: Ir a Admin > Promociones
- ➕ Crear nueva promoción: Admin > Promociones > "Nueva Promoción"
- 🗑️ Eliminar promoción: Admin > Promociones > Eliminar
- 📊 Ver comisiones: Admin > Nómina (automáticamente calcula bien)

---

**Versión**: 1.0  
**Fecha**: 15 de diciembre de 2025  
**Status**: ✅ Completo y funcionando
