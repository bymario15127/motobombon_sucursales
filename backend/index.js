// backend/index.js
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import sucursalMiddleware from "./middleware/sucursal.js";
import citasRouter from "./routes/citas.js";
import serviciosRouter from "./routes/servicios.js";
import lavadoresRouter from "./routes/lavadores.js";
import nominaRouter from "./routes/nomina.js";
import talleresRouter from "./routes/talleres.js";
import clientesRouter from "./routes/clientes.js";
import productosRouter from "./routes/productos.js";
import finanzasRouter from "./routes/finanzas.js";
import authRouter from "./routes/auth.js";
import debugRouter from "./routes/debug.js";
// Promociones y reportes de promociones removidos

// Cargar variables de entorno
dotenv.config();

const app = express();

// Configuración de CORS para producción
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'] 
    : ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
};

// Middleware de seguridad básico
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Logging mejorado
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production' || process.env.LOG_LEVEL === 'debug') {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  }
  next();
});

app.use(cors(corsOptions));
// Aumentar límite para permitir imágenes en base64
app.use(express.json({ limit: process.env.MAX_FILE_SIZE || '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Resolver __dirname en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carpeta pública para archivos subidos
const uploadsDir = path.join(__dirname, 'uploads');
const servicesDir = path.join(uploadsDir, 'services');
if (!fs.existsSync(servicesDir)) {
  fs.mkdirSync(servicesDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Rutas sin middleware de sucursal
app.use("/api/auth", authRouter);

// Aplicar middleware de sucursal a todas las rutas que lo necesiten
app.use("/api/citas", sucursalMiddleware, citasRouter);
app.use("/api/servicios", sucursalMiddleware, serviciosRouter);
app.use("/api/lavadores", sucursalMiddleware, lavadoresRouter);
app.use("/api/nomina", sucursalMiddleware, nominaRouter);
app.use("/api/talleres", sucursalMiddleware, talleresRouter);
app.use("/api/clientes", sucursalMiddleware, clientesRouter);
app.use("/api/productos", sucursalMiddleware, productosRouter);
app.use("/api/finanzas", sucursalMiddleware, finanzasRouter);
app.use("/api/debug", debugRouter);
// Rutas de promociones/reportes deshabilitadas

// Subida de imagen vía base64 (evita dependencias externas)
app.post('/api/upload-image', async (req, res) => {
  try {
    console.log("📸 Recibido upload-image");
    
    const { image } = req.body; // dataURL: data:image/png;base64,AAAA
    if (!image || typeof image !== 'string') {
      console.error("❌ Imagen inválida o vacía");
      return res.status(400).json({ error: 'Imagen inválida' });
    }
    
    console.log("📏 Tamaño de imagen recibida:", image.length);
    
    const match = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) {
      console.error("❌ Formato de imagen no válido");
      return res.status(400).json({ error: 'Formato de imagen no soportado' });
    }
    
    const mime = match[1];
    const base64Data = match[2];
    
    console.log("🖼️ Tipo MIME:", mime);
    
    // Validar tipo permitido
    const allowed = new Set(['image/png','image/jpeg','image/jpg','image/webp']);
    if (!allowed.has(mime)) {
      console.error("❌ Tipo MIME no permitido:", mime);
      return res.status(400).json({ error: 'Tipo de imagen no permitido' });
    }
    
    // Validar tamaño (máx 10 MB)
    const approxBytes = Math.ceil((base64Data.length * 3) / 4);
    console.log("💾 Tamaño aproximado:", Math.round(approxBytes / 1024 / 1024 * 100) / 100, "MB");
    
    if (approxBytes > 10 * 1024 * 1024) {
      console.error("❌ Imagen demasiado grande");
      return res.status(413).json({ error: 'Imagen demasiado grande (máx 10 MB)' });
    }
    
    const ext = mime.split('/')[1].replace('jpeg', 'jpg');
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
    const filePath = path.join(servicesDir, filename);
    
    console.log("💾 Guardando en:", filePath);
    
    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
    
    // Verificar que el archivo se creó
    if (!fs.existsSync(filePath)) {
      console.error("❌ Archivo no se guardó correctamente");
      return res.status(500).json({ error: 'No se pudo guardar la imagen' });
    }
    
    const fileStats = fs.statSync(filePath);
    console.log("✅ Archivo guardado exitosamente:", filename, "Tamaño:", fileStats.size, "bytes");
    
    const urlResponse = `/uploads/services/${filename}`;
    console.log("✅ URL retornada:", urlResponse);
    
    return res.json({ url: urlResponse });
  } catch (e) {
    console.error("🔴 Error en upload:", e);
    return res.status(500).json({ error: 'No se pudo guardar la imagen: ' + e.message });
  }
});

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// 🔹 Ruta raíz
app.get("/", (req, res) => {
  res.send("🚀 Servidor backend funcionando correctamente");
});

// Middleware de manejo de errores global
app.use((error, req, res, next) => {
  console.error('Error no manejado:', error);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    timestamp: new Date().toISOString()
  });
});

// Middleware para rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    path: req.path,
    method: req.method
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📁 Directorio de uploads: ${path.join(__dirname, 'uploads')}`);
});
