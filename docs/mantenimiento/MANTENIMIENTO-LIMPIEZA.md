# 🧹 REPORTE DE LIMPIEZA Y MANTENIMIENTO

**Fecha:** 30 Enero 2026  
**Estado:** Análisis Inicial Completo

---

## ✅ HALLAZGOS IDENTIFICADOS

### **1. 🗂️ ARCHIVOS/CARPETAS OBSOLETOS EN RAÍZ**

**Documentos que parecen antiguos o duplicados:**

| Archivo | Estado | Acción |
|---------|--------|--------|
| `ACTUALIZAR-AUTENTICACION.md` | ⚠️ Antiguo | Revisar contenido |
| `ACTUALIZAR-FIDELIZACION-VPS.md` | ⚠️ Antiguo | Revisar contenido |
| `ARQUITECTURA-PRODUCTOS.md` | ⚠️ Duplicado | Posible duplicación |
| `AWS-SETUP.md` | ❓ Sin uso | ¿Aún usan AWS? |
| `EJECUTAR-EN-VPS-MIGRACION.txt` | ⚠️ Migración vieja | Archivar |
| `ENTREGA-FINAL.md` | ⚠️ Histórico | Archivar |
| `GUIA-SIMPLE-BEBIDAS.md` | ❓ ¿Qué es? | Revisar relevancia |
| `IMPLEMENTACION-COMPLETADA.md` | ⚠️ Histórico | Archivar |
| `MANTENIMIENTO-COMPLETADO.md` | ⚠️ Histórico | Archivar |
| `NOTAS-Y-PROXIMOS-PASOS.md` | ⚠️ Antiguo | Revisar |
| `PRODUCTOS-VENTAS-MANUAL.md` | ⚠️ Manual | Documentación obsoleta |
| `PRODUCTOS-VENTAS-RESUMEN.md` | ⚠️ Duplicado | Revisar |
| `RESUMEN-PROMOCIONES-IMPLEMENTACION.md` | ⚠️ Histórico | Archivar |

---

### **2. 📝 ARCHIVOS DE CONFIGURACIÓN POSIBLEMENTE VIEJOS**

```
✅ ecosystem.config.json          ← Necesario (PM2)
✅ nginx.conf                      ← Necesario (VPS)
❓ setup-db.bat                   ← ¿Aún se usa?
⚠️ .env.example                   ← Revisar si está actualizado
```

---

### **3. 🔧 SCRIPTS EN RAÍZ (Posiblemente Viejos)**

| Script | Propósito | Estado |
|--------|-----------|--------|
| `backup.sh` | Backup simple | ⚠️ Revisar si funciona |
| `backup-full.sh` | Backup completo | ⚠️ Revisar si funciona |
| `deploy.sh` | Deploy app | ⚠️ Revisar si está actualizado |
| `init-productos.bat` | Init productos | ❓ ¿Reemplazado por npm scripts? |
| `init-productos.sh` | Init productos | ❓ ¿Reemplazado por npm scripts? |
| `update-fidelizacion.sh` | Update fidelización | ⚠️ Posible código obsoleto |
| `update-vps-promociones.sh` | Update promociones | ⚠️ Posible código obsoleto |

---

### **4. 🗄️ DATABASE SCRIPTS (32 archivos) - REVISAR NECESIDAD**

**Scripts de inicialización/migración (Probablemente viejos):**

```
❓ actualizarCitasGoldNavideno.js         ← Promoción Navidad (2024)
❓ addComisionToLavadores.js              ← Migración antigua
❓ addEmailColumn.js                      ← Migración antigua
❓ addImagenesCC.js                       ← Migración antigua
❓ addImagenesToPromociones.js            ← Migración antigua
❓ addLavadorIdToCitas.js                 ← Migración antigua
❓ addLavadorToCitas.js                   ← Migración antigua
❓ addMetodoPago.js                       ← Migración antigua
❓ addMotoFields.js                       ← Migración antigua
❓ addPrecioBaseComision.js               ← Migración antigua
❓ addTallerToCitas.js                    ← Migración antigua
❓ addTotalLavadas.js                     ← Migración antigua
❓ arreglarPromocion.js                   ← Fix antiguo
❓ asignarImagenesGoldNavideno.js         ← Promoción vieja
❓ checkCitasStructure.js                 ← Script de verificación
❓ createLavadores.js                     ← Script de creación
❓ createPromociones.js                   ← Script de creación
✅ init.js                                ← Probablemente usado
✅ initAll.js                             ← Probablemente usado
✅ initClientes.js                        ← Probablemente usado
✅ initFinanzas.js                        ← Probablemente usado
✅ initLavadores.js                       ← Probablemente usado
✅ initProductos.js                       ← Probablemente usado
✅ initServicios.js                       ← Probablemente usado
✅ initTalleres.js                        ← Probablemente usado
❓ makeHoraNullable.js                    ← Migración antigua
❓ migrarCitasExistentes.js               ← Migración antigua
❓ migrarGoldNavidenoAPromocion.js        ← Migración antigua
❓ renameTelefonoToCedula.js              ← Migración antigua
❓ updateGoldNavidenoExistentes.js        ← Migración antigua
❓ verificarCitas.js                      ← Verificación antigua
❓ verificarPreciosPromocion.js           ← Verificación antigua
❓ verificarPromociones.js                ← Verificación antigua
❓ verificarPromocionesNomina.js          ← Verificación antigua
```

---

### **5. 📦 DEPENDENCIAS DE NODE (backend/package.json)**

**Estado Actual:**
```json
{
  "cors": "^2.8.5",                ✅ Necesaria
  "dotenv": "^17.2.3",             ✅ Necesaria
  "express": "^4.19.2",            ✅ Necesaria
  "exceljs": "^4.3.0",             ❓ ¿Se usa para reportes?
  "jsonwebtoken": "^9.0.3",        ✅ Necesaria (autenticación)
  "nodemailer": "^7.0.12",         ✅ Necesaria (emails)
  "sqlite": "^5.1.1",              ❌ Nunca se usa (usan MongoDB)
  "sqlite3": "^5.1.7",             ❌ Nunca se usa (usan MongoDB)
  "xlsx": "^0.18.5"                ❓ ¿Se usa para reportes?
}
```

**PROBLEMAS DETECTADOS:**
- ❌ `sqlite` y `sqlite3` no se usan (usan MongoDB)
- ⚠️ Faltan dependencias importantes:
  - `mongoose` NO ESTÁ (¡pero se usa en todo!)
  - `nodemon` para desarrollo
  - `bcryptjs` para hashear contraseñas

---

### **6. 📚 DOCUMENTACIÓN DUPLICADA/OBSOLETA**

```
GUIA-SIMPLE-BEBIDAS.md                  ← ¿Qué es esto?
PRODUCTOS-VENTAS-MANUAL.md              ← Manual obsoleto
PRODUCTOS-VENTAS-RESUMEN.md             ← Duplicado
RESUMEN-PROMOCIONES-IMPLEMENTACION.md   ← Histórico
AWS-SETUP.md                            ← ¿Siguen usando AWS?
```

---

---

## 🎯 PLAN DE LIMPIEZA RECOMENDADO

### **FASE 1: ARCHIVAR DOCUMENTACIÓN HISTÓRICA**

```bash
# Crear carpeta de histórico
mkdir .archived/

# Archivar documentos viejos
mv ACTUALIZAR-AUTENTICACION.md .archived/
mv ACTUALIZAR-FIDELIZACION-VPS.md .archived/
mv ENTREGA-FINAL.md .archived/
mv IMPLEMENTACION-COMPLETADA.md .archived/
mv MANTENIMIENTO-COMPLETADO.md .archived/
mv EJECUTAR-EN-VPS-MIGRACION.txt .archived/
mv RESUMEN-PROMOCIONES-IMPLEMENTACION.md .archived/
mv PRODUCTOS-VENTAS-MANUAL.md .archived/
mv GUIA-SIMPLE-BEBIDAS.md .archived/
```

---

### **FASE 2: LIMPIAR DATABASE SCRIPTS**

**Crear carpeta para scripts de migración antigua:**

```bash
mkdir backend/database/.archived/

# Archivar migrations antiguas
mv backend/database/actualizarCitasGoldNavideno.js .archived/
mv backend/database/addComisionToLavadores.js .archived/
mv backend/database/addEmailColumn.js .archived/
# ... (todos los add*, migrar*, update*, etc)
```

**Mantener solo scripts activos:**
```
✅ backend/database/init.js
✅ backend/database/initAll.js
✅ backend/database/initClientes.js
✅ backend/database/initFinanzas.js
✅ backend/database/initLavadores.js
✅ backend/database/initProductos.js
✅ backend/database/initServicios.js
✅ backend/database/initTalleres.js
```

---

### **FASE 3: CORREGIR PACKAGE.JSON**

**Eliminar:**
- `sqlite` (no se usa)
- `sqlite3` (no se usa)

**Agregar (si faltan):**
- `mongoose` (CRÍTICO - se usa en todo)
- `nodemon` (para desarrollo)
- `bcryptjs` (si hash contraseñas)

---

### **FASE 4: REVISAR SCRIPTS SHELL**

```bash
✅ backup.sh           ← Verificar que funciona
✅ backup-full.sh      ← Verificar que funciona
⚠️ deploy.sh           ← Actualizar para multi-sucursal
⚠️ update-*.sh         ← Revisar si aún se usan
```

---

### **FASE 5: DOCUMENTACIÓN PRINCIPAL**

**Consolidar en un solo lugar:**

```
README.md                          ← Principal (actualizar)
SETUP-RAPIDO.md                    ← Mantener
DEPLOY.md                          ← Actualizar
SEGURIDAD-Y-DESPLIEGUE.md         ← Mantener
PROPUESTA-EXPANSION-MULTISURCURSAL-RIFA.md  ← Nueva
```

**Archivar:**
```
AWS-SETUP.md                       ← Si no lo usan
ARQUITECTURA-PRODUCTOS.md          ← Si es duplicado
PRODUCTOS-VENTAS-RESUMEN.md        ← Si es duplicado
```

---

---

## 📊 RESUMEN DEL TRABAJO

| Categoría | Antes | Después | Beneficio |
|-----------|-------|---------|-----------|
| Documentos raíz | 27+ | ~15 | -44% clutter |
| DB Scripts | 32 | 8 | -75% obsoletos |
| Dependencias npm | 9 (2 inútiles) | 11 (todas usadas) | -22% innecesarias |
| Carpetas | Mezcladas | Organizadas | +Claridad |

---

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### **FASE 1: ARCHIVAR DOCUMENTACIÓN**
- [ ] Crear carpeta `.archived/`
- [ ] Mover documentos históricos
- [ ] Actualizar `.gitignore` para ignorar `.archived/`

### **FASE 2: LIMPIAR DATABASE SCRIPTS**
- [ ] Crear `backend/database/.archived/`
- [ ] Mover scripts de migración antigua
- [ ] Documentar qué hace cada script activo

### **FASE 3: ARREGLAR PACKAGE.JSON**
- [ ] Remover `sqlite` y `sqlite3`
- [ ] Verificar que `mongoose` está
- [ ] Agregar `nodemon` si falta
- [ ] Ejecutar `npm install`

### **FASE 4: ACTUALIZAR SCRIPTS**
- [ ] Revisar `backup.sh`
- [ ] Revisar `deploy.sh`
- [ ] Remover `init-productos.bat/sh` si usan npm scripts

### **FASE 5: DOCUMENTACIÓN**
- [ ] Actualizar `README.md`
- [ ] Revisar `DEPLOY.md`
- [ ] Consolidar documentación importante
- [ ] Crear índice de documentos

---

---

## 💡 RECOMENDACIONES ADICIONALES

### **1. Crear estructura estándar:**
```
moto_bombon/
├── docs/                    ← Documentación actual
├── .archived/              ← Histórico (ignore en git)
├── backend/
│   ├── database/
│   │   ├── .archived/      ← Scripts viejos
│   │   └── init/           ← Scripts activos
│   └── ...
└── ...
```

### **2. Actualizar .gitignore:**
```
.archived/
backend/database/.archived/
node_modules/
.env
*.log
```

### **3. Crear CHANGELOG.md:**
```markdown
# Cambios Recientes

## [Limpieza] - 30 Enero 2026
- Archivado 15 documentos históricos
- Removido código de migración antigua
- Actualizado package.json
```

---

---

## 🚀 SIGUIENTE PASO

¿Quieres que proceda con:

1. **Solo archivar documentación**
2. **Completa: Limpieza total + arreglar package.json**
3. **Personalizado: Solo ciertas fases**

Dime qué prefieres y **hacemos la limpieza** 🧹
