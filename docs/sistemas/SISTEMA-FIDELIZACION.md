# Sistema de Fidelización MotoBombón 🎉

## Descripción

Sistema automático de recompensas que otorga **una lavada gratis** cada 10 lavadas completadas. El cupón se envía automáticamente por correo electrónico al cliente.

## ¿Cómo Funciona?

### Para el Cliente:
1. ✅ El cliente reserva y completa una cita normalmente
2. 📊 El sistema registra automáticamente cada lavada completada
3. 🎁 Al completar 10 lavadas, recibe un email con un **cupón de lavada gratis**
4. 🔄 **El contador se reinicia a 0** para empezar un nuevo ciclo de 10 lavadas
5. 📈 El historial total de lavadas se mantiene (nunca se pierde)
6. 💌 El cupón incluye un código único que puede presentar en su próxima visita

### Para el Administrador:
1. ⚙️ Configurar las credenciales de email (ver sección de Configuración)
2. ✅ Marcar las citas como "completada" cuando el servicio finalice
3. 👥 Ver estadísticas de clientes en la sección "Clientes"
4. 🎯 El sistema se encarga automáticamente de:
   - Rastrear las lavadas del cliente
   - Generar cupones cuando corresponda
   - Reiniciar el contador cada 10 lavadas
   - Enviar emails con el cupón
   - Gestionar la validación de cupones

## Configuración Inicial

### 1. Variables de Entorno

Copia el archivo `.env.example` a `.env`:
\`\`\`bash
cp .env.example .env
\`\`\`

### 2. Configurar Email (IMPORTANTE)

Para **Gmail** (recomendado):

1. Ve a https://myaccount.google.com/apppasswords
2. Genera una "Contraseña de aplicación" 
3. Edita tu archivo `.env`:

\`\`\`env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tucorreo@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx  # Contraseña de aplicación (16 caracteres)
\`\`\`

Para **otros proveedores**:
- Outlook/Hotmail: `smtp-mail.outlook.com` (puerto 587)
- Yahoo: `smtp.mail.yahoo.com` (puerto 587)

### 3. Inicializar Base de Datos

\`\`\`bash
npm run init-clientes
# o manualmente:
node database/initClientes.js
\`\`\`

### 4. Reiniciar el Servidor

\`\`\`bash
npm run dev
\`\`\`

## API Endpoints

### Clientes

#### Obtener información de un cliente
\`\`\`
GET /api/clientes/email/:email
\`\`\`

Respuesta:
\`\`\`json
{
  "id": 1,
  "email": "cliente@ejemplo.com",
  "nombre": "Juan Pérez",
  "telefono": "3001234567",
  "lavadas_completadas": 8,
  "lavadas_gratis_pendientes": 0,
  "cupones": [],
  "progreso": {
    "lavadas_completadas": 8,
    "proxima_gratis": 2,
    "lavadas_gratis_disponibles": 0
  }
}
\`\`\`

#### Listar todos los clientes
\`\`\`
GET /api/clientes
\`\`\`

#### Crear/actualizar cliente manualmente
\`\`\`
POST /api/clientes
Content-Type: application/json

{
  "email": "cliente@ejemplo.com",
  "nombre": "Juan Pérez",
  "telefono": "3001234567"
}
\`\`\`

### Cupones

#### Verificar validez de un cupón
\`\`\`
GET /api/clientes/cupon/:codigo
\`\`\`

Respuesta para cupón válido:
\`\`\`json
{
  "valido": true,
  "mensaje": "Cupón válido para lavada gratis",
  "email_cliente": "cliente@ejemplo.com",
  "fecha_emision": "2026-01-14"
}
\`\`\`

Respuesta para cupón ya usado:
\`\`\`json
{
  "valido": false,
  "mensaje": "Este cupón ya fue utilizado",
  "fecha_uso": "2026-01-15"
}
\`\`\`

#### Usar/redimir un cupón
\`\`\`
POST /api/clientes/cupon/:codigo/usar
Content-Type: application/json

{
  "cita_id": 123  // Opcional: ID de la cita donde se usa el cupón
}
\`\`\`

## Flujo Automático

### Cuando se completa una cita:

1. **Admin marca cita como "completada"**:
\`\`\`
PUT /api/citas/:id
{
  "estado": "completada"
}
\`\`\`

2. **El sistema automáticamente**:
   - ✅ Verifica si el cliente tiene email y nombre
   - ✅ Busca o crea el registro del cliente
   - ✅ Incrementa el contador de lavadas
   - ✅ Si llegó a 10 (o múltiplo de 10):
     - 🎫 Genera un código de cupón único
     - 💾 Guarda el cupón en la base de datos
     - 📧 Envía email con el cupón al cliente
     - 🎉 Devuelve información del cupón generado

3. **Respuesta del servidor**:
\`\`\`json
{
  "message": "Cita actualizada exitosamente",
  "cuponGenerado": true,
  "codigoCupon": "GRATIS-abc123-XYZ789",
  "lavadas": 10,
  "mensajeFidelizacion": "¡Felicidades! Has completado 10 lavadas. Te hemos enviado un cupón de lavada gratis al correo cliente@ejemplo.com"
}
\`\`\`

## Estructura de la Base de Datos

### Tabla: `clientes`
\`\`\`sql
CREATE TABLE clientes (
  id INTEGER PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  telefono TEXT,
  lavadas_completadas INTEGER DEFAULT 0,        -- Contador actual (se reinicia cada 10)
  total_lavadas_historico INTEGER DEFAULT 0,    -- Total histórico (nunca se reinicia)
  lavadas_gratis_pendientes INTEGER DEFAULT 0,
  ultima_lavada_gratis DATE,
  created_at DATETIME,
  updated_at DATETIME
);
\`\`\`

### Tabla: `cupones`
\`\`\`sql
CREATE TABLE cupones (
  id INTEGER PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,
  email_cliente TEXT NOT NULL,
  usado INTEGER DEFAULT 0,
  fecha_emision DATE NOT NULL,
  fecha_expiracion DATE,
  fecha_uso DATE,
  cita_id INTEGER,
  created_at DATETIME
);
\`\`\`

## Email de Cupón

El email incluye:
- 🎉 Diseño atractivo con gradiente
- 📊 Número de lavadas completadas
- 🎫 Código de cupón grande y visible
- 📝 Instrucciones claras de uso
- ✅ Compatible con todos los clientes de email

## Casos de Uso

### Caso 1: Cliente Regular
\`\`\`
Lavada 1: ✅ → Contador: 1/10 (Total histórico: 1)
Lavada 2: ✅ → Contador: 2/10 (Total histórico: 2)
...
Lavada 9: ✅ → Contador: 9/10 (Total histórico: 9)
Lavada 10: ✅ → 🎉 ¡CUPÓN GENERADO! Email enviado
              → 🔄 Contador reinicia: 0/10 (Total histórico: 10)
Lavada 11: ✅ → Contador: 1/10 (Total histórico: 11)
...
Lavada 20: ✅ → 🎉 ¡SEGUNDO CUPÓN! Email enviado
              → 🔄 Contador reinicia: 0/10 (Total histórico: 20)
\`\`\`

### Caso 2: Cliente Sin Email
- ⚠️ No se puede rastrear lavadas automáticamente
- 💡 Solución: Asegurarse de que todos los clientes proporcionen email

### Caso 3: Cliente Usa Cupón
\`\`\`
1. Cliente llega con código GRATIS-abc123-XYZ789
2. Admin verifica: GET /api/clientes/cupon/GRATIS-abc123-XYZ789
3. Sistema responde: "Cupón válido"
4. Admin crea la cita con servicio gratis
5. Al completar, marca cupón como usado: 
   POST /api/clientes/cupon/GRATIS-abc123-XYZ789/usar
\`\`\`

## Troubleshooting

### El email no se envía
1. ✅ Verificar que `SMTP_USER` y `SMTP_PASS` estén en `.env`
2. ✅ Para Gmail, usar "Contraseña de aplicación", NO la contraseña normal
3. ✅ Revisar logs del servidor para errores específicos

### El cupón no se genera
1. ✅ Verificar que la cita tenga email y nombre del cliente
2. ✅ Asegurarse de marcar el estado como "completada" (minúsculas)
3. ✅ Verificar que la tabla `clientes` existe: `node database/initClientes.js`

### Cupón aparece como "ya usado"
1. ✅ Verificar en la base de datos: `SELECT * FROM cupones WHERE codigo = 'XXX'`
2. ✅ Campo `usado` debe ser 0 para cupones válidos
3. ✅ Si fue error, actualizar: `UPDATE cupones SET usado = 0 WHERE codigo = 'XXX'`

## Estadísticas y Monitoreo

Para ver estadísticas:
\`\`\`bash
# Clientes con más lavadas
GET /api/clientes

# Información de cliente específico
GET /api/clientes/email/cliente@ejemplo.com
\`\`\`

## Notas Importantes

- ⭐ Los cupones **NO tienen fecha de expiración** por defecto
- ⭐ Un cliente puede acumular múltiples cupones
- ⭐ Los cupones son únicos e irrepetibles
- ⭐ El sistema cuenta solo citas con estado "completada"
- ⭐ Se recomienda hacer backup regular de la base de datos

## Actualización del package.json

Agregar script para inicializar clientes:
\`\`\`json
{
  "scripts": {
    "init-clientes": "node database/initClientes.js"
  }
}
\`\`\`

## Seguridad

- 🔒 Las contraseñas de email NUNCA deben estar en el código fuente
- 🔒 Usar siempre `.env` y agregarlo a `.gitignore`
- 🔒 Los códigos de cupón son únicos y aleatorios
- 🔒 Validar cupones antes de aplicar descuentos

## Soporte

Para problemas o preguntas:
1. Revisar logs del servidor
2. Verificar configuración en `.env`
3. Comprobar que las tablas existen en la base de datos
4. Verificar que el email del cliente es válido

---

**¡Sistema de Fidelización MotoBombón implementado exitosamente!** 🚀
