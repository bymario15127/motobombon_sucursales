# 📋 RECUPERACIÓN DE CITAS - GUÍA COMPLETA

Cuando una cita se elimina por error (por ejemplo, una chica borra una cita sin querer), ahora hay un sistema para **ver, recuperar y gestionar** las citas eliminadas.

## 🔄 ¿Cómo funciona?

El sistema implementa **"soft delete"** (eliminación suave):
- Cuando eliminas una cita, NO se borra de la base de datos
- Se marca con una fecha de eliminación (`deleted_at`)
- Aparece en la "papelera" y puede recuperarse
- Las citas activas no muestran las eliminadas (quedan ocultas)

---

## 🛠️ OPCIÓN 1: Script de Terminal (Recomendado para VPS)

### Paso 1: Inicializar el sistema de papelera

```bash
cd backend
node scripts/recuperarCitas.js
```

Esto agregará la columna `deleted_at` a la tabla de citas si no existe.

### Paso 2: Ver citas eliminadas

```bash
node scripts/recuperarCitas.js ver
```

**Resultado:**
```
🗑️  CITAS ELIMINADAS (PAPELERA):

1. ID: 42 | María López | 2026-02-10 14:30
   Servicio: Lavado Básico Moto | Teléfono: 3005551234
   Eliminada: 2026-02-10T14:35:22.000Z

2. ID: 43 | Juan Pérez | 2026-02-10 15:00
   Servicio: Detallado | Teléfono: 3015551234
   Eliminada: 2026-02-10T15:10:45.000Z

📊 Total de citas eliminadas: 2
```

### Paso 3: Recuperar una cita específica

```bash
node scripts/recuperarCitas.js recuperar 42
```

**Resultado:**
```
✅ Cita 42 recuperada exitosamente
   Cliente: María López
   Fecha: 2026-02-10 14:30
   Servicio: Lavado Básico Moto
```

### Paso 4: Eliminar permanentemente (opcional)

Si quieres eliminar definitivamente una cita de la papelera:

```bash
node scripts/recuperarCitas.js eliminar-permanentemente 42
```

### Paso 5: Limpiar papelera vieja (opcional)

Eliminar citas que fueron borradas hace más de 30 días:

```bash
node scripts/recuperarCitas.js vaciar-papelera 30
```

---

## 📱 OPCIÓN 2: API REST (Para el Frontend/Admin)

Si prefieres usar la API desde el frontend o postman:

### Ver papelera

```bash
GET http://localhost:3001/api/citas/papelera/ver
```

**Respuesta:**
```json
{
  "total": 2,
  "citas": [
    {
      "id": 42,
      "cliente": "María López",
      "fecha": "2026-02-10",
      "hora": "14:30",
      "servicio": "Lavado Básico Moto",
      "telefono": "3005551234",
      "email": "maria@example.com",
      "deleted_at": "2026-02-10T14:35:22.000Z"
    }
  ]
}
```

### Recuperar cita por API

```bash
POST http://localhost:3001/api/citas/papelera/recuperar/42
```

**Respuesta:**
```json
{
  "message": "Cita recuperada exitosamente",
  "cita": { ... }
}
```

### Eliminar permanentemente por API

```bash
DELETE http://localhost:3001/api/citas/papelera/permanente/42
```

---

## 👩‍💼 PROCEDIMIENTO TÍPICO EN EL VPS

### Escenario: Una cita fue eliminada sin querer

**En el VPS (servidor):**

```bash
# 1. Conectarse al VPS
ssh usuario@tu-vps.com

# 2. Ir al proyecto
cd /ruta/del/proyecto/moto_bombon/backend

# 3. Ver qué citas se eliminaron hoy
node scripts/recuperarCitas.js ver

# 4. Si ves la cita que necesitas, recuperarla
node scripts/recuperarCitas.js recuperar 42

# 5. ¡Listo! La cita aparecerá nuevamente en el sistema
```

---

## 📊 OPCIONES AVANZADAS

### Ver solo citas eliminadas hoy

```bash
# Ver papelera y filtrar mentalmente
node scripts/recuperarCitas.js ver | grep "2026-02-10"
```

### Backup antes de limpiar

```bash
# Hacer respaldo de la DB antes de limpiar
cp backend/database/database.sqlite backend/database/database.sqlite.backup.$(date +%s)

# Luego sí vaciar papelera
node scripts/recuperarCitas.js vaciar-papelera 90
```

### Restaurar desde respaldo

Si necesitas volver a una versión anterior:

```bash
cp backend/database/database.sqlite.backup.1707536400 backend/database/database.sqlite
```

---

## 🔍 PREGUNTAS FRECUENTES

**P: ¿Cuánto tiempo duran las citas en la papelera?**  
R: Indefinidamente. Se recomienda limpiar citas de más de 30-90 días con `vaciar-papelera`.

**P: ¿Se puede saber quién eliminó la cita?**  
R: Actualmente no hay auditoría de usuario. Futura mejora: agregar `deleted_by` y `deleted_reason`.

**P: ¿Qué pasa si restauro una cita pero ya pasó la fecha?**  
R: La cita se restaura con la fecha original. Aparecerá en historial pero no en agenda próxima.

**P: ¿El delete normal del frontend funciona igual?**  
R: Sí, ahora todos los deletes son "soft delete" (marcan como eliminados, no borran).

---

## ⚙️ ARCHIVOS MODIFICADOS

- `backend/routes/citas.js` - Añadido soft delete y endpoints de papelera
- `backend/scripts/recuperarCitas.js` - Nuevo script de recuperación ✨
- `backend/database/initAll.js` - Preparado para agregar columna (automático)

---

## 🚀 PRÓXIMAS MEJORAS

- [ ] Interfaz visual en admin para papelera
- [ ] Auditoría: quién eliminó y cuándo
- [ ] Recuperación automática de citas en conflicto
- [ ] Notificaciones al recuperar citas
- [ ] Historial de cambios por cita

---

**¿Dudas? Contacta al equipo de desarrollo.**
