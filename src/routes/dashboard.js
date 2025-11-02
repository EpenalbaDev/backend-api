const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas del dashboard
router.get('/overview', dashboardController.getOverview);
router.get('/metrics', dashboardController.getMetrics);
router.get('/charts', dashboardController.getCharts);
router.get('/alertas', dashboardController.getAlertas);
router.get('/performance', dashboardController.getPerformanceStats);
router.get('/data', dashboardController.getDashboardData);

// Ruta de prueba
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Rutas de dashboard funcionando',
    endpoint: '/api/v1/dashboard/test',
    user: req.user,
    availableEndpoints: [
      'GET /api/v1/dashboard/overview',
      'GET /api/v1/dashboard/metrics',
      'GET /api/v1/dashboard/charts',
      'GET /api/v1/dashboard/alertas',
      'GET /api/v1/dashboard/performance',
      'GET /api/v1/dashboard/data'
    ]
  });
});

module.exports = router;