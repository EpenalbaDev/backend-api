const express = require('express');
const router = express.Router();
const facturaController = require('../controllers/facturaController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// IMPORTANTE: Las rutas específicas ANTES que las rutas con parámetros
// Rutas de búsqueda y utilidades (sin parámetros)
router.get('/search', facturaController.searchFacturas);
router.get('/suggestions', facturaController.getSuggestions);

// Ruta de prueba
router.get('/test/endpoint', (req, res) => {
  res.json({
    success: true,
    message: 'Rutas de facturas funcionando',
    endpoint: '/api/v1/facturas/test',
    user: req.user,
    availableEndpoints: [
      'GET /api/v1/facturas/',
      'GET /api/v1/facturas/search',
      'GET /api/v1/facturas/suggestions',
      'GET /api/v1/facturas/:id',
      'GET /api/v1/facturas/:id/items',
      'GET /api/v1/facturas/:id/archivos',
      'PUT /api/v1/facturas/:id/estado',
      'DELETE /api/v1/facturas/:id'
    ]
  });
});

// Rutas principales
router.get('/', facturaController.getFacturas);

// Rutas con parámetros ID (DESPUÉS de las rutas específicas)
router.get('/:id', facturaController.getFacturaById);
router.get('/:id/items', facturaController.getFacturaItems);
router.get('/:id/archivos', facturaController.getFacturaArchivos);

// Rutas que requieren permisos específicos
router.put('/:id/estado', facturaController.updateEstado);
router.delete('/:id', requireRole(['admin', 'usuario']), facturaController.deleteFactura);

module.exports = router;