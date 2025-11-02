const express = require('express');
const router = express.Router();
const facturaController = require('../controllers/facturaController');
const { authenticateToken } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas de búsqueda
router.get('/facturas', facturaController.searchFacturas);
router.get('/suggestions', facturaController.getSuggestions);

module.exports = router;