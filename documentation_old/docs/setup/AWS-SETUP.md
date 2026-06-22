# 🎯 Configuración AWS EC2 Recomendada para MOTOBOMBON

## 📋 Especificaciones Recomendadas

### Instancia: **t3.micro**
- **vCPUs**: 2
- **RAM**: 1 GB 
- **Red**: Hasta 5 Gigabit
- **Almacenamiento**: 8-20 GB SSD (gp3)
- **Costo**: GRATIS primer año, luego ~$8.50/mes

## 🔧 Configuración paso a paso

### 1. Configuración de instancia
```
Tipo de instancia: t3.micro
AMI: Ubuntu Server 22.04 LTS (HVM)
Arquitectura: 64-bit (x86)
```

### 2. Almacenamiento
```
Volumen raíz: 20 GB gp3 SSD
- Para SO: ~5GB
- Para aplicación: ~5GB  
- Para base de datos y uploads: ~5GB
- Para logs y backups: ~5GB
```

### 3. Grupos de seguridad
```
SSH (22): Tu IP únicamente
HTTP (80): 0.0.0.0/0 (todo el mundo)
HTTPS (443): 0.0.0.0/0 (todo el mundo)
Custom TCP (3000): 127.0.0.1/32 (solo localhost)
```

### 4. Par de claves
- Crear nuevo par de claves: `elite-studio-key.pem`
- Descargar y guardar en lugar seguro

## 💰 Estimación de costos

### Primer año (GRATIS):
- Instancia t3.micro: $0
- 20 GB EBS: ~$2/mes
- Transferencia: Incluida en capa gratuita
- **Total: ~$2/mes**

### Después del primer año:
- Instancia t3.micro: $8.50/mes
- 20 GB EBS: $2/mes  
- Transferencia: ~$1/mes
- **Total: ~$11.50/mes**

## 🚀 Ventajas de t3.micro para MOTOBOMBON

### ✅ Rendimiento perfecto para:
- Backend Node.js con Express
- Base de datos SQLite (hasta 10,000 citas)
- Frontend React servido por Nginx
- 20-50 usuarios concurrentes
- Uploads de imágenes

### ✅ Escalabilidad:
- Fácil upgrade a t3.small si creces
- Auto Scaling Groups disponible
- Load Balancer si necesitas más tráfico

### ✅ Monitoreo incluido:
- CloudWatch metrics gratuito
- Alertas de CPU/memoria
- Logs de aplicación

## 🛡️ Configuración de seguridad recomendada

### 1. Elastic IP (Recomendado)
```
Costo: $0 si está asignada a instancia corriendo
Beneficio: IP fija para tu dominio
```

### 2. Backup automático
```
EBS Snapshots: $0.05/GB/mes
Frecuencia: Diaria
Retención: 7 días
```

### 3. SSL Certificate
```
AWS Certificate Manager: GRATIS
Cloudflare: GRATIS (alternativa)
Let's Encrypt: GRATIS (manual)
```

## 📊 Monitoreo de recursos

### Umbrales recomendados:
- **CPU**: < 70% promedio
- **RAM**: < 80% uso
- **Disco**: < 85% uso
- **Red**: < 80% del límite

### Alertas importantes:
```bash
# CPU alta por más de 5 minutos
# RAM > 90% por más de 3 minutos  
# Disco > 90%
# Aplicación caída (HTTP 5xx)
```

## 🔧 Comandos útiles de monitoreo

```bash
# Ver uso de recursos
htop
df -h
free -m

# Logs de aplicación
pm2 logs elite-studio-backend

# Métricas de AWS
aws cloudwatch get-metric-statistics \
  --namespace AWS/EC2 \
  --metric-name CPUUtilization \
  --dimensions Name=InstanceId,Value=i-1234567890abcdef0
```

## 🚨 Cuándo upgradar a t3.small

### Señales para upgrade:
- CPU > 80% por más de 1 hora
- RAM > 90% consistentemente  
- Más de 100 usuarios concurrentes
- Base de datos > 50,000 registros
- Necesitas Redis/caché adicional

### Proceso de upgrade:
1. Crear snapshot de EBS
2. Parar instancia
3. Cambiar tipo a t3.small
4. Iniciar instancia
5. Verificar funcionamiento

## 🌟 Alternativas consideradas

### Si quieres MÁS barato:
- **Lightsail $3.50/mes**: Más simple pero menos flexible
- **DigitalOcean $6/mes**: Competidor directo

### Si quieres MÁS potencia:
- **t3.small**: $17/mes, 2GB RAM
- **t3.medium**: $33/mes, 4GB RAM

## 🎯 Mi recomendación final

**Empieza con t3.micro** porque:
1. **Gratis el primer año** - perfecto para validar
2. **Suficiente para 500+ usuarios/día**
3. **Fácil de escalar** cuando necesites más
4. **Toda la infraestructura AWS** disponible

**MOTOBOMBON funcionará perfectamente** en esta configuración.