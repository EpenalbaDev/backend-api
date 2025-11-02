const express = require('express');
const router = express.Router();
const empresaController = require('../controllers/empresaController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas de empresas
router.get('/', empresaController.getEmpresas);
router.get('/count', empresaController.countEmpresas);
router.get('/ruc/:ruc', empresaController.getEmpresaByRuc);
router.get('/:id', empresaController.getEmpresaById);
router.get('/:id/usuarios', empresaController.getUsuariosByEmpresa);

// Rutas que requieren permisos de admin
router.post('/', requireRole(['admin']), empresaController.createEmpresa);
router.put('/:id', requireRole(['admin']), empresaController.updateEmpresa);

module.exports = router;

