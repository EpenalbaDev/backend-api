const express = require('express');
const router = express.Router();
const emisorController = require('../controllers/emisorController');
const { authenticateToken } = require('../middleware/auth');
const { applyEmpresaFilter } = require('../middleware/empresaFilter');

// Todas las rutas requieren autenticación y filtro multi-tenant
router.use(authenticateToken);
router.use(applyEmpresaFilter);

// Rutas de emisores
router.get('/', emisorController.getEmisores);
router.get('/top', emisorController.getTopEmisores);
router.get('/:ruc', emisorController.getEmisorByRuc);
router.get('/:ruc/facturas', emisorController.getFacturasByEmisor);

module.exports = router;