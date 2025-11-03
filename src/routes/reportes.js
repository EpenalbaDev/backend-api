const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporteController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { applyEmpresaFilter } = require('../middleware/empresaFilter');
const rateLimiter = require('../middleware/rateLimiter');

// Todas las rutas requieren autenticación y filtro multi-tenant
router.use(authenticateToken);
router.use(applyEmpresaFilter);

// Rutas de reportes
router.get('/dashboard', reporteController.getDashboardReportes);
router.get('/ventas', reporteController.getReporteVentas);
router.get('/itbms', reporteController.getReporteITBMS);
router.get('/ocr-performance', reporteController.getReportePerformanceOCR);
router.get('/actividad-emisores', reporteController.getReporteActividadEmisores);

// Exportación (rate limited)
router.post('/export', rateLimiter.sensitive, reporteController.exportarDatos);

module.exports = router;