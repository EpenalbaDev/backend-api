const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Middleware personalizado
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');

// Rutas
const authRoutes = require('./routes/auth');
const facturaRoutes = require('./routes/facturas');
const dashboardRoutes = require('./routes/dashboard');
const emisorRoutes = require('./routes/emisores');
const reporteRoutes = require('./routes/reportes');
const busquedaRoutes = require('./routes/busqueda');
const empresaRoutes = require('./routes/empresas');
const adminRoutes = require('./routes/admin');
const docsRoutes = require('./routes/docs');

const app = express();

// Configuración de CORS
const corsOptions = {
  origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware de seguridad
app.use(helmet({
  crossOriginEmbedderPolicy: false
}));

app.use(cors(corsOptions));

// Rate limiting global
app.use(rateLimiter.global);

// Parser de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Headers de respuesta personalizados
app.use((req, res, next) => {
  res.setHeader('X-API-Version', '1.0.0');
  res.setHeader('X-Powered-By', 'Backend-API');
  next();
});

// Logging de requests (desarrollo)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
    database: 'connected',
      endpoints: {
      auth: '/api/v1/auth',
      dashboard: '/api/v1/dashboard',
      facturas: '/api/v1/facturas',
      emisores: '/api/v1/emisores',
      reportes: '/api/v1/reportes',
      busqueda: '/api/v1/busqueda',
      empresas: '/api/v1/empresas',
      admin: '/api/v1/admin'
    }
  });
});

// Documentación de la API
app.use('/api/docs', docsRoutes);

// Rutas de la API
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/facturas', facturaRoutes);
app.use('/api/v1/emisores', emisorRoutes);
app.use('/api/v1/reportes', reporteRoutes);
app.use('/api/v1/busqueda', busquedaRoutes);
app.use('/api/v1/empresas', empresaRoutes);
app.use('/api/v1/admin', adminRoutes);

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint no encontrado',
    path: req.originalUrl,
    method: req.method
  });
});

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler);

module.exports = app;