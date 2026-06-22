# 📚 Documentación MOTOBOMBON Sucursales

Toda la documentación del proyecto está organizada aquí.

---

## 📋 Índice por categoría

### 🚀 Setup e instalación
- [Setup Rápido (VPS)](setup/SETUP-RAPIDO.md)
- [Quick Start Productos](setup/QUICK-START-PRODUCTOS.md)
- [AWS Setup](setup/AWS-SETUP.md)

### 🏗️ Sistemas y funcionalidades
- [Sistema Multisucursal](sistemas/SISTEMA-MULTISUCURSAL.md)
- [Sistema de Fidelización](sistemas/SISTEMA-FIDELIZACION.md)
- [Promociones](sistemas/PROMOCIONES-SISTEMA.md)
- [Productos y Ventas - Resumen](sistemas/PRODUCTOS-VENTAS-RESUMEN.md)
- [Arquitectura Productos](sistemas/ARQUITECTURA-PRODUCTOS.md)
- [Flujo Nómina](sistemas/FLUJO-NOMINA.md)

### 🔒 Seguridad y deploy
- [Deploy](deploy-seguridad/DEPLOY.md)
- [Seguridad y Despliegue](deploy-seguridad/SEGURIDAD-Y-DESPLIEGUE.md)
- [Resumen Seguridad](deploy-seguridad/RESUMEN-SEGURIDAD.md)
- [Checklist Verificación](deploy-seguridad/CHECKLIST-VERIFICACION.md)

### 🔧 Mantenimiento
- [Mantenimiento y Limpieza](mantenimiento/MANTENIMIENTO-LIMPIEZA.md)
- [Recuperación de Citas](mantenimiento/RECUPERACION-CITAS.md)

### 📄 Propuestas
- [Propuesta Expansión Multisucursal / Rifa](propuestas/PROPUESTA-EXPANSION-MULTISURCURSAL-RIFA.md)

### 📝 Otros
- [README Nuevo (alternativa)](README-NUEVO.md)

### 📦 Documentación archivada
Los documentos antiguos o ya no vigentes están en la raíz del proyecto en **`.archived/`** (guías de bebidas, actualizaciones de fidelización VPS, implementaciones completadas, etc.). Si necesitas uno en concreto, búscalo ahí.

---

## 🆕 Cambios recientes (lo que hicimos hoy)

Resumen de mejoras y correcciones aplicadas en la última sesión:

👉 **[Ver detalle en CAMBIOS-RECIENTES.md](CAMBIOS-RECIENTES.md)**

- **Backend:** upload de imágenes asíncrono, rate limit en `/api/upload-image`, auth con bcrypt, verificación SMTP corregida.
- **Frontend:** ProtectedRoute con verificación de token, filtro por estado en Citas, estilo neón unificado en botones, HomePage y carga de imágenes con lazy.
- **Formulario de reserva:** checkbox de tratamiento de datos (Ley 1581 de 2012), reservas sin hora para evitar error de traslape cuando varios clientes reservan a la vez.
