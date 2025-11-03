# Backend API - Dashboard de Facturas

API REST para el sistema de gestión de facturas procesadas automáticamente con OCR.

## 🚀 Características

- **Autenticación JWT** con gestión de sesiones
- **Multi-tenant completo** con aislamiento por empresa
- **Registro público** de nuevos clientes con creación automática de empresa
- **Roles**: super_admin, admin, usuario, auditor
- **CRUD completo** de facturas, items y archivos
- **Dashboard con métricas** en tiempo real
- **Búsqueda avanzada** con filtros múltiples
- **Reportes y análisis** de datos
- **Gestión de empresas** y usuarios
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

6. **Actualizar roles para multi-tenant (requerido)**
```bash
# Ejecutar script SQL para agregar rol super_admin
mysql -u your_user -p facturas_db < scripts/update_roles_super_admin.sql
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
- `POST /api/v1/auth/register` - Registro público (crea empresa + usuario admin) ⭐ NUEVO
- `GET /api/v1/auth/me` - Obtener perfil
- `POST /api/v1/auth/logout` - Cerrar sesión
- `POST /api/v1/auth/change-password` - Cambiar contraseña
- `POST /api/v1/auth/users` - Crear usuario (admin only)

### Empresas ⭐ NUEVO
- `GET /api/v1/empresas` - Lista de empresas
- `GET /api/v1/empresas/:id` - Detalle de empresa
- `GET /api/v1/empresas/ruc/:ruc` - Buscar empresa por RUC
- `GET /api/v1/empresas/:id/usuarios` - Usuarios de una empresa
- `POST /api/v1/empresas/:empresaId/usuarios/invite` - Invitar usuario a empresa (admin only)
- `POST /api/v1/empresas` - Crear empresa (admin only)
- `PUT /api/v1/empresas/:id` - Actualizar empresa (admin only)

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

### Administración (Super Admin) ⭐ NUEVO
- `GET /api/v1/admin/empresas` - Lista todas las empresas
- `GET /api/v1/admin/estadisticas` - Métricas globales del sistema

## 🔐 Autenticación

### Registro Público ⭐ NUEVO
```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan",
    "apellido": "Pérez",
    "email": "juan@empresa.com",
    "password": "Password123!",
    "empresa_nombre": "Mi Empresa S.A.",
    "empresa_ruc": "12345678901",
    "empresa_direccion": "Av. Principal 123",
    "empresa_telefono": "+507 1234-5678"
  }'
```
**Nota**: Rate limit de 5 registros por hora por IP.

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

### Invitar Usuario a Empresa (Admin) ⭐ NUEVO
```bash
curl -X POST http://localhost:3001/api/v1/empresas/1/usuarios/invite \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "María",
    "apellido": "González",
    "email": "maria@empresa.com",
    "password": "Password123!",
    "rol": "usuario"
  }'
```

## 📊 Credenciales de Prueba

- **Super Admin**: `super_admin@facturas.com` / `superadmin123` (crear manualmente)
- **Admin**: `admin@facturas.com` / `admin123`
- **Usuario**: `user@facturas.com` / `user123`
- **Auditor**: `auditor@facturas.com` / `auditor123`

**Nota**: Para crear un super_admin, ejecutar:
```sql
INSERT INTO usuarios (nombre, apellido, email, password, rol, activo) 
VALUES ('Super', 'Admin', 'super_admin@facturas.com', '$2a$12$...', 'super_admin', TRUE);
```

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
│   ├── empresaController.js # Controlador empresas ⭐ NUEVO
│   ├── reporteController.js # Controlador reportes
│   └── adminController.js # Controlador admin (super_admin) ⭐ NUEVO
├── services/
│   ├── authService.js     # Lógica de autenticación
│   ├── facturaService.js  # Lógica de facturas
│   ├── dashboardService.js # Lógica dashboard
│   ├── emisorService.js   # Lógica emisores
│   ├── empresaService.js  # Lógica empresas ⭐ NUEVO
│   ├── reporteService.js  # Lógica reportes
│   └── adminService.js    # Lógica admin (super_admin) ⭐ NUEVO
├── models/
│   ├── User.js           # Modelo de usuario
│   ├── Empresa.js        # Modelo de empresa ⭐ NUEVO
│   ├── Factura.js        # Modelo de factura
│   ├── FacturaItem.js    # Modelo de items
│   └── FacturaArchivo.js # Modelo de archivos
├── middleware/
│   ├── auth.js           # Middleware de autenticación
│   ├── empresaFilter.js  # Filtro multi-tenant ⭐ NUEVO
│   ├── errorHandler.js   # Manejo de errores
│   └── rateLimiter.js    # Rate limiting
├── routes/
│   ├── auth.js           # Rutas de autenticación
│   ├── facturas.js       # Rutas de facturas
│   ├── dashboard.js      # Rutas de dashboard
│   ├── emisores.js       # Rutas de emisores
│   ├── empresas.js       # Rutas de empresas ⭐ NUEVO
│   ├── reportes.js       # Rutas de reportes
│   ├── busqueda.js       # Rutas de búsqueda
│   ├── admin.js          # Rutas admin (super_admin) ⭐ NUEVO
│   └── docs.js           # Documentación API
├── utils/                # Utilidades
└── validators/           # Validadores
```

## 🗄️ Base de Datos

### Tablas Principales
- `empresas` - Empresas/clientes del sistema ⭐ NUEVO
- `usuarios` - Usuarios del sistema (con empresa_id para multi-tenant)
- `facturas` - Facturas procesadas
- `factura_items` - Items de cada factura
- `factura_archivos` - Archivos adjuntos
- `factura_raw_data` - Datos raw del OCR
- `procesamiento_logs` - Logs de procesamiento
- `sesiones_usuario` - Sesiones activas
- `logs_acceso` - Logs de acceso

### Multi-Tenant
El sistema implementa aislamiento automático por empresa:
- **Super Admin**: Ve todos los datos sin filtro
- **Admin/Usuario/Auditor**: Solo ven datos de su empresa (`empresa_id`)
- El filtro se aplica automáticamente en facturas, dashboard, emisores y reportes

#### Validaciones de Permisos Implementadas

**Empresas:**
- Admin solo puede ver/modificar su propia empresa
- Admin solo puede invitar usuarios a su empresa
- Super Admin puede acceder a todas las empresas
- Endpoints protegidos: `GET/PUT /empresas/:id`, `GET /empresas/:id/usuarios`, `POST /empresas/:empresaId/usuarios/invite`

**Facturas, Dashboard, Emisores y Reportes:**
- Filtro automático por `empresa_id` aplicado en todos los endpoints
- Super Admin ve todos los datos
- Otros roles solo ven datos de su empresa

**Nota:** Si la tabla `facturas` no tiene columna `empresa_id`, el filtro no se aplicará hasta agregar esta columna o implementar JOIN con usuarios.

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
- **Auth (login)**: 5 requests por 15 minutos
- **Registro público**: 5 requests por hora ⭐ NUEVO
- **Búsqueda**: 50 requests por 5 minutos
- **Endpoints sensibles**: 10 requests por 10 minutos

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

## 🔑 Roles y Permisos

### Super Admin
- Acceso total al sistema
- Ve todas las empresas y datos
- Puede invitar usuarios a cualquier empresa
- Endpoints: `/api/v1/admin/*`

### Admin
- Gestión completa de su empresa
- Puede invitar usuarios a su empresa (solo a su empresa)
- Ve solo datos de su empresa (validación en cada endpoint)
- Puede crear/actualizar empresas (solo su empresa)
- Validaciones: No puede acceder a empresas de otros (403 Forbidden)

### Usuario
- Acceso de lectura/escritura limitado
- Ve solo datos de su empresa
- No puede invitar usuarios

### Auditor
- Solo lectura
- Ve solo datos de su empresa
- Acceso a reportes y análisis

## 📄 Licencia

Este proyecto está bajo la Licencia ISC.

## 📞 Soporte

Para soporte técnico, contactar a:
- Email: soporte@facturas.com
- Documentación: `/api/docs`

## 📚 Documentación Adicional

- [API de Empresas](./API_EMPRESAS.md) - Documentación completa de endpoints de empresas
- [Actualización Frontend](./ACTUALIZACION_EMPRESAS_FRONTEND.md) - Guía para integrar cambios en el frontend

---

**Desarrollado con ❤️ para el sistema de gestión de facturas con soporte multi-tenant** 