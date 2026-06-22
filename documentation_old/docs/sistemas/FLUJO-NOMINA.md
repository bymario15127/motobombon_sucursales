# 📋 Flujo de Nómina - MOTOBOMBON

## ✅ Proceso Correcto para que las Citas Aparezcan en la Nómina

### 1️⃣ Cliente Reserva
- El cliente llena el formulario de reserva
- La cita se crea con estado **"pendiente"**
- **NO** tiene lavador asignado aún

### 2️⃣ Admin Asigna Lavador (PANEL ADMIN)
- Ve a **Panel Admin** o **Calendario**
- Localiza la cita
- **IMPORTANTE**: Selecciona un lavador del dropdown "👤 Asignar lavador"
- El sistema guarda automáticamente el lavador_id

### 3️⃣ Admin Procesa la Cita
- Clic en **✅ Confirmar** (opcional)
- Clic en **🔄 En curso** cuando empiece el lavado
- Clic en **✨ Finalizar** cuando termine

### 4️⃣ La Cita Aparece en Nómina
La cita SOLO se cuenta en la nómina si:
- ✅ Estado = "finalizada" O "confirmada"
- ✅ Tiene lavador asignado (lavador_id)
- ✅ Está en el rango de fechas de la quincena

---

## 🚫 Errores Comunes

### ❌ Finalizar sin asignar lavador
**Antes**: Podías finalizar sin lavador → No aparecía en nómina
**Ahora**: El botón "✨ Finalizar" está DESHABILITADO hasta que asignes un lavador

### ❌ Olvidar asignar el lavador
**Solución**: 
- El campo de lavador tiene borde ROJO si no está asignado
- Mensaje: "(Requerido para finalizar)"
- Alerta si intentas finalizar sin lavador

---

## 💰 Cálculo de Comisión

### Fórmula
```
Comisión = Precio del Servicio × (% Comisión del Lavador / 100)
```

### Precio según Cilindraje
- **100-405 cc**: Precio Bajo CC
- **406-1200 cc**: Precio Alto CC
- **Sin cilindraje o fuera de rango**: Precio estándar

### Ejemplo
- Servicio: "Lavado Deluxe"
  - Precio Bajo CC: $15,000
  - Precio Alto CC: $25,000
- Moto: 500 cc (Alto CC)
- Lavador: Juan Pérez (30% comisión)

**Cálculo**:
```
Precio = $25,000 (Alto CC)
Comisión = $25,000 × 0.30 = $7,500
```

---

## 📊 Visualización en Nómina

### Datos que se muestran por lavador:
- Nombre y cédula
- Cantidad de servicios realizados
- Total generado (suma de precios)
- % de comisión configurado
- Comisión a pagar

### Filtros disponibles:
- Por mes
- Por año
- Por quincena (1: días 1-15, 2: días 16-fin)

---

## 🔧 Configuración de Lavadores

### En Gestión de Lavadores:
- **Nombre**: Nombre completo
- **Cédula**: Documento de identidad
- **Activo**: Si/No (solo activos aparecen en dropdown)
- **% Comisión**: Por defecto 30%

---

## ✨ Mejoras Implementadas

1. ✅ Validación obligatoria de lavador antes de finalizar
2. ✅ Indicador visual (borde rojo) cuando falta lavador
3. ✅ Botón "Finalizar" deshabilitado sin lavador
4. ✅ Alerta clara si intentas finalizar sin lavador
5. ✅ Mensaje en calendario sobre citas sin lavador
