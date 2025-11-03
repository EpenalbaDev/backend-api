const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const rateLimiter = require('../middleware/rateLimiter');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Rutas públicas (no requieren autenticación)
router.post('/login', rateLimiter.auth, authController.login);
router.post('/register', rateLimiter.register, authController.register);

// Rutas protegidas (requieren autenticación)
router.get('/me', authenticateToken, authController.getProfile);
router.post('/logout', authenticateToken, authController.logout);
router.post('/change-password', authenticateToken, authController.changePassword);
router.get('/verify', authenticateToken, authController.verifyToken);

// Rutas de admin (requieren rol admin)
router.post('/users', authenticateToken, requireRole('admin'), authController.createUser);

// Ruta de prueba (temporal)
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Rutas de autenticación funcionando',
    endpoint: '/api/v1/auth/test',
    availableEndpoints: [
      'POST /api/v1/auth/login',
      'GET /api/v1/auth/me',
      'POST /api/v1/auth/logout',
      'POST /api/v1/auth/change-password',
      'GET /api/v1/auth/verify',
      'POST /api/v1/auth/users (admin only)'
    ]
  });
});

module.exports = router;