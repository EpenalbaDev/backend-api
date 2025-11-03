const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Todas las rutas requieren autenticación y rol super_admin
router.use(authenticateToken);
router.use(requireRole(['super_admin']));

// Rutas de administración
router.get('/empresas', adminController.getTodasEmpresas);
router.get('/estadisticas', adminController.getEstadisticasGlobales);

module.exports = router;

