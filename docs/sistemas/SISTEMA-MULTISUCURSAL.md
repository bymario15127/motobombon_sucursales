# Sistema Multi-Sucursal - MOTOBOMBON

## ✅ PASO 1 COMPLETADO: Selector de Sucursales en Frontend

### Cambios Implementados

#### 1. **Nueva Página de Selección de Sucursales** 
   - **Archivo**: `Frontend/src/pages/SucursalSelector.jsx`
   - **Funcionalidad**: 
     - Página de entrada principal al sistema
     - Muestra todas las sucursales disponibles con diseño atractivo
     - Guarda la selección en localStorage
     - Redirige a la landing page de la sucursal seleccionada

#### 2. **Configuración Centralizada de Sucursales**
   - **Archivo**: `Frontend/src/config/sucursales.js`
   - **Contenido**:
     - Array con todas las sucursales (nombre, dirección, ciudad, teléfono, email, horario)
     - Funciones helper para obtener sucursales por ID
     - Fácil de modificar para agregar/editar sucursales

#### 3. **Router Actualizado**
   - **Archivo**: `Frontend/src/router.jsx`
   - **Cambios**:
     - Ruta `/` ahora muestra el selector de sucursales
     - Rutas de cliente ahora incluyen el parámetro `/:sucursalId/`
     - Ejemplos: `/:sucursalId/home`, `/:sucursalId/reserva`, `/:sucursalId/cliente`

#### 4. **Páginas Actualizadas para Multi-Sucursal**

   **a) LandingPage**
   - Lee el `sucursalId` de la URL
   - Muestra el nombre de la sucursal seleccionada
   - Botón para cambiar de sucursal
   - Redirige al selector si no hay sucursal seleccionada

   **b) ClientePage**
   - Lee el `sucursalId` de la URL
   - Pasa el `sucursalId` al componente ReservaForm
   - Muestra indicador de sucursal actual

   **c) TallerPage**
   - Lee el `sucursalId` de la URL
   - Muestra indicador de sucursal actual
   - Redirige al selector si no hay sucursal seleccionada

#### 5. **ReservaForm Actualizado**
   - **Archivo**: `Frontend/src/components/Cliente/ReservaForm.jsx`
   - Recibe prop `sucursalId`
   - Incluye `sucursal_id` en el formulario de reserva
   - Se actualiza automáticamente cuando cambia la sucursal

### Cómo Funciona el Flujo

```
1. Usuario entra a www.motobombon.com (/)
   ↓
2. Ve selector de sucursales
   ↓
3. Selecciona una sucursal (ej: Sucursal Centro)
   ↓
4. Sistema guarda en localStorage:
   - motobombon_sucursal: "sucursal1"
   - motobombon_sucursal_nombre: "Sucursal Centro"
   ↓
5. Redirige a /sucursal1/home
   ↓
6. Todas las operaciones posteriores usan sucursal1
   ↓
7. Usuario puede cambiar de sucursal con botón "← Cambiar Sucursal"
```

### Archivos Modificados

```
Frontend/src/
├── pages/
│   ├── SucursalSelector.jsx         [NUEVO]
│   ├── LandingPage.jsx              [MODIFICADO]
│   ├── ClientePage.jsx              [MODIFICADO]
│   └── TallerPage.jsx               [MODIFICADO]
├── components/
│   └── Cliente/
│       └── ReservaForm.jsx          [MODIFICADO]
├── config/
│   └── sucursales.js                [NUEVO]
└── router.jsx                       [MODIFICADO]
```

### Personalización de Sucursales

Para agregar o modificar sucursales, edita el archivo:
**`Frontend/src/config/sucursales.js`**

```javascript
export const sucursales = [
  {
    id: 'sucursal1',              // ID único
    nombre: 'Sucursal Centro',    // Nombre que se muestra
    direccion: 'Calle Principal #123',
    ciudad: 'Ciudad Central',
    telefono: '123-456-7890',
    email: 'centro@motobombon.com',
    horario: 'Lun-Sab: 8:00 AM - 6:00 PM'
  },
  // Agregar más sucursales aquí...
];
```

---

## 📋 PRÓXIMOS PASOS

### PASO 2: Base de Datos por Sucursal (Backend)

**Objetivo**: Cada sucursal debe tener su propia base de datos separada

**Tareas pendientes**:

1. **Modificar Estructura de Base de Datos**
   - Crear una BD por sucursal (ej: `motobombon_sucursal1`, `motobombon_sucursal2`)
   - O agregar columna `sucursal_id` a todas las tablas existentes

2. **Actualizar Backend para Filtrar por Sucursal**
   - Modificar rutas de API para recibir `sucursal_id`
   - Filtrar todas las consultas por sucursal
   - Asegurar que los datos de una sucursal no se mezclen con otra

3. **Actualizar Servicios del Frontend**
   - Modificar `citasService.js`, `clientesService.js`, etc.
   - Enviar `sucursal_id` en todas las peticiones

4. **Panel Admin Multi-Sucursal**
   - Permitir al admin ver/gestionar todas las sucursales
   - O crear un selector de sucursal para el admin

---

## 🎯 Estado Actual

✅ **Frontend**: Selección de sucursales implementada
✅ **Router**: Rutas con parámetro de sucursal
✅ **Formularios**: Incluyendo sucursal_id en datos
⏳ **Backend**: Pendiente - filtrado por sucursal
⏳ **Base de Datos**: Pendiente - separación por sucursal

---

## 🚀 Para Probar el Sistema

1. Inicia el frontend:
   ```bash
   cd Frontend
   npm run dev
   ```

2. Abre el navegador en la URL mostrada

3. Deberías ver el selector de sucursales

4. Selecciona una sucursal y verifica que:
   - La URL incluya el ID de la sucursal (ej: `/sucursal1/home`)
   - El nombre de la sucursal aparezca en la página
   - El botón "Cambiar Sucursal" funcione

---

## ⚙️ Configuración Técnica

### localStorage
El sistema usa localStorage para mantener la sucursal seleccionada:
- `motobombon_sucursal`: ID de la sucursal
- `motobombon_sucursal_nombre`: Nombre de la sucursal

### Parámetros de URL
Las rutas incluyen el parámetro dinámico:
- `/:sucursalId/home`
- `/:sucursalId/reserva`
- `/:sucursalId/cliente`
- `/:sucursalId/taller`

---

**Fecha de implementación**: Febrero 17, 2026
**Versión**: 1.0 - Multi-Sucursal Frontend
