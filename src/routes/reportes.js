const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporteController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const rateLimiter = require('../middleware/rateLimiter');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas de reportes
router.get('/dashboard', reporteController.getDashboardReportes);
router.get('/ventas', reporteController.getReporteVentas);
router.get('/itbms', reporteController.getReporteITBMS);
router.get('/ocr-performance', reporteController.getReportePerformanceOCR);
router.get('/actividad-emisores', reporteController.getReporteActividadEmisores);

// Exportación (rate limited)
router.post('/export', rateLimiter.sensitive, reporteController.exportarDatos);

module.exports = router;