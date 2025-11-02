# Backend API - Dashboard de Facturas

API REST para el sistema de gestión de facturas procesadas automáticamente con OCR.

## 🚀 Características

- **Autenticación JWT** con gestión de sesiones
- **CRUD completo** de facturas, items y archivos
- **Dashboard con métricas** en tiempo real
- **Búsqueda avanzada** con filtros múltiples
- **Reportes y análisis** de datos
- **Rate limiting** y seguridad implementada
- **Validación de datos** con Joi
- **Logs estructurados** para monitoreo

## 📋 Requisitos

- Node.js 18+ 
- MySQL 8.0+
- npm o yarn

## 🛠️ Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd backend-api
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Editar `.env` con tus configuraciones:
```env
# Configuración del Servidor
NODE_ENV=development
PORT=3001

# Configuración de Base de Datos
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=facturas_db

# Configuración JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Configuración CORS
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
```

4. **Crear base de datos**
```sql
CREATE DATABASE facturas_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

5. **Ejecutar script de inicialización**
```bash
npm run init-db
```

## 🚀 Uso

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

### Scripts disponibles
```bash
npm run dev          # Desarrollo con nodemon
npm start           # Producción
npm run init-db     # Inicializar BD con datos de prueba
npm run lint        # Verificar código
npm run lint:fix    # Corregir problemas de linting
```

## 📚 Endpoints Principales

### Autenticación
- `POST /api/v1/auth/login` - Iniciar sesión
- `GET /api/v1/auth/me` - Obtener perfil
- `POST /api/v1/auth/logout` - Cerrar sesión
- `POST /api/v1/auth/change-password` - Cambiar contraseña

### Facturas
- `GET /api/v1/facturas` - Lista de facturas con filtros
- `GET /api/v1/facturas/:id` - Detalle de factura
- `PUT /api/v1/facturas/:id/estado` - Actualizar estado
- `GET /api/v1/facturas/:id/items` - Items de factura
- `GET /api/v1/facturas/:id/archivos` - Archivos de factura
- `DELETE /api/v1/facturas/:id` - Eliminar factura

### Dashboard
- `GET /api/v1/dashboard/overview` - Métricas generales
- `GET /api/v1/dashboard/metrics` - KPIs principales
- `GET /api/v1/dashboard/charts` - Datos para gráficos

### Emisores
- `GET /api/v1/emisores` - Lista de emisores
- `GET /api/v1/emisores/:ruc` - Detalle de emisor
- `GET /api/v1/emisores/:ruc/facturas` - Facturas de emisor

### Reportes
- `GET /api/v1/reportes/ventas-periodo` - Ventas por período
- `GET /api/v1/reportes/top-emisores` - Top emisores
- `GET /api/v1/reportes/itbms-resumen` - Resumen ITBMS
- `POST /api/v1/reportes/export` - Exportar datos

### Búsqueda
- `GET /api/v1/busqueda/facturas` - Búsqueda avanzada
- `GET /api/v1/busqueda/suggestions` - Sugerencias

## 🔐 Autenticación

### Login
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@facturas.com",
    "password": "admin123"
  }'
```

### Usar token
```bash
curl -X GET http://localhost:3001/api/v1/facturas \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📊 Credenciales de Prueba

- **Admin**: `admin@facturas.com` / `admin123`
- **Usuario**: `user@facturas.com` / `user123`

## 🏗️ Estructura del Proyecto

```
src/
├── app.js                 # Configuración de Express
├── server.js              # Punto de entrada
├── config/
│   ├── database.js        # Configuración BD
│   └── jwt.js            # Configuración JWT
├── controllers/
│   ├── authController.js  # Controlador de autenticación
│   ├── facturaController.js # Controlador de facturas
│   ├── dashboardController.js # Controlador dashboard
│   ├── emisorController.js # Controlador emisores
│   └── reporteController.js # Controlador reportes
├── services/
│   ├── authService.js     # Lógica de autenticación
│   ├── facturaService.js  # Lógica de facturas
│   ├── dashboardService.js # Lógica dashboard
│   ├── emisorService.js   # Lógica emisores
│   └── reporteService.js  # Lógica reportes
├── models/
│   ├── User.js           # Modelo de usuario
│   ├── Factura.js        # Modelo de factura
│   ├── FacturaItem.js    # Modelo de items
│   └── FacturaArchivo.js # Modelo de archivos
├── middleware/
│   ├── auth.js           # Middleware de autenticación
│   ├── errorHandler.js   # Manejo de errores
│   └── rateLimiter.js    # Rate limiting
├── routes/
│   ├── auth.js           # Rutas de autenticación
│   ├── facturas.js       # Rutas de facturas
│   ├── dashboard.js      # Rutas de dashboard
│   ├── emisores.js       # Rutas de emisores
│   ├── reportes.js       # Rutas de reportes
│   ├── busqueda.js       # Rutas de búsqueda
│   └── docs.js           # Documentación API
├── utils/                # Utilidades
└── validators/           # Validadores
```

## 🗄️ Base de Datos

### Tablas Principales
- `usuarios` - Usuarios del sistema
- `facturas` - Facturas procesadas
- `factura_items` - Items de cada factura
- `factura_archivos` - Archivos adjuntos
- `factura_raw_data` - Datos raw del OCR
- `procesamiento_logs` - Logs de procesamiento
- `sesiones_usuario` - Sesiones activas
- `logs_acceso` - Logs de acceso

## 🔧 Configuración Avanzada

### Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `NODE_ENV` | Entorno de ejecución | `development` |
| `PORT` | Puerto del servidor | `3001` |
| `DB_HOST` | Host de la base de datos | `localhost` |
| `DB_PORT` | Puerto de la base de datos | `3306` |
| `DB_USER` | Usuario de la base de datos | - |
| `DB_PASSWORD` | Contraseña de la base de datos | - |
| `DB_NAME` | Nombre de la base de datos | - |
| `JWT_SECRET` | Clave secreta para JWT | - |
| `JWT_EXPIRES_IN` | Expiración del token | `24h` |
| `CORS_ORIGINS` | Orígenes permitidos CORS | `http://localhost:3000` |

### Rate Limiting
- **Global**: 100 requests por 15 minutos
- **Auth**: 5 requests por 15 minutos
- **Búsqueda**: 50 requests por 5 minutos

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests con coverage
npm run test:coverage
```

## 📈 Monitoreo

### Health Check
```bash
curl http://localhost:3001/health
```

### Métricas
- Endpoint: `/api/v1/dashboard/metrics`
- Logs: `logs/app.log`
- Errores: `logs/error.log`

## 🚀 Deploy

### Producción
1. Configurar variables de entorno de producción
2. Configurar base de datos de producción
3. Ejecutar `npm start`

### Docker (opcional)
```bash
docker build -t facturas-api .
docker run -p 3001:3001 facturas-api
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia ISC.

## 📞 Soporte

Para soporte técnico, contactar a:
- Email: soporte@facturas.com
- Documentación: `/api/docs`

---

**Desarrollado con ❤️ para el sistema de gestión de facturas** 