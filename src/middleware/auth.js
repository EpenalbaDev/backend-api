const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');

// Middleware para verificar JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar que el usuario aún existe y está activo
    const user = await executeQuery(
      'SELECT id, empresa_id, nombre, apellido, email, rol, activo FROM usuarios WHERE id = ? AND activo = TRUE',
      [decoded.userId]
    );

    if (user.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado o inactivo'
      });
    }

    // Agregar información del usuario al request
    req.user = {
      id: user[0].id,
      empresa_id: user[0].empresa_id,
      nombre: user[0].nombre,
      apellido: user[0].apellido,
      email: user[0].email,
      rol: user[0].rol
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }

    console.error('Error en autenticación:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Middleware para verificar roles específicos
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticación requerida'
      });
    }

    const userRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!userRoles.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este recurso'
      });
    }

    next();
  };
};

// Middleware opcional (no falla si no hay token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await executeQuery(
        'SELECT id, empresa_id, nombre, apellido, email, rol FROM usuarios WHERE id = ? AND activo = TRUE',
        [decoded.userId]
      );

      if (user.length > 0) {
        req.user = {
          id: user[0].id,
          empresa_id: user[0].empresa_id,
          nombre: user[0].nombre,
          apellido: user[0].apellido,
          email: user[0].email,
          rol: user[0].rol
        };
      }
    }

    next();
  } catch (error) {
    // En autenticación opcional, continúamos sin usuario
    next();
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  optionalAuth
};