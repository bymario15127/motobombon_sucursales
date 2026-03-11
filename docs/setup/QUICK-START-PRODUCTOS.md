# 🚀 QUICK START - Módulo Productos y Ventas

## Instalación Rápida (2 minutos)

### ⚡ Windows

1. **En la carpeta raíz del proyecto**, haz doble click en:
   ```
   init-productos.bat
   ```
   
   O abre PowerShell y ejecuta:
   ```powershell
   cd backend
   npm run init-productos
   ```

2. Listo ✅

---

### ⚡ Linux / Mac

1. **En la carpeta raíz del proyecto**, ejecuta:
   ```bash
   bash init-productos.sh
   ```
   
   O manualmente:
   ```bash
   cd backend
   npm run init-productos
   ```

2. Listo ✅

---

## ¿Cómo Uso?

1. **Abre la app** → `http://localhost:5173`
2. **Ingresa como**: Admin o Supervisor
3. **Ve al menú**: Click en `📦 Productos`
4. **Crea productos**: Bebidas, precios, stock
5. **Registra ventas**: Cuando clientes compren

---

## 📱 Interfaz

| Tab | Qué hace |
|-----|----------|
| 📦 Productos | Crear/editar bebidas |
| 💰 Registrar Venta | Vender bebidas |
| 📊 Reportes | Ver ganancias |

---

## 💡 Ejemplo

```
→ Coca Cola 350ml
  Compra: $2,000
  Vende: $5,000
  Stock: 10

→ Cliente compra 2 Coca Colas
  Total: $10,000
  Ganancia: $6,000
  Stock nuevo: 8
```

---

## ⚠️ Si Algo Falla

**"Module not found: productosRouter"**
- Asegúrate de que ejecutaste `init-productos.bat`

**"No puedo ver el menú de Productos"**
- Ingresa como Admin o Supervisor
- No aparece para clientes ni lavadores

**"Error: stock insuficiente"**
- El producto no tiene stock
- Edita el producto y aumenta stock

---

## 📚 Documentación Completa

Ver: `PRODUCTOS-VENTAS-MANUAL.md`

---

**¿Preguntas?** Ver `PRODUCTOS-VENTAS-RESUMEN.md` para detalles técnicos.
