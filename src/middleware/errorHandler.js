// Middleware para manejo centralizado de errores

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log del error
  console.error('❌ Error:', err);

  // Error de validación de Joi
  if (err.isJoi) {
    const message = err.details.map(detail => detail.message).join(', ');
    error = {
      statusCode: 400,
      message: `Error de validación: ${message}`
    };
  }

  // Error de MySQL
  if (err.code) {
    switch (err.code) {
      case 'ER_DUP_ENTRY':
        error = {
          statusCode: 400,
          message: 'El registro ya existe'
        };
        break;
      case 'ER_NO_REFERENCED_ROW_2':
        error = {
          statusCode: 400,
          message: 'Referencia inválida'
        };
        break;
      case 'ECONNREFUSED':
        error = {
          statusCode: 500,
          message: 'Error de conexión a la base de datos'
        };
        break;
      case 'ER_ACCESS_DENIED_ERROR':
        error = {
          statusCode: 500,
          message: 'Error de autenticación con la base de datos'
        };
        break;
      default:
        error = {
          statusCode: 500,
          message: 'Error interno del servidor'
        };
    }
  }

  // Error de JWT
  if (err.name === 'JsonWebTokenError') {
    error = {
      statusCode: 401,
      message: 'Token inválido'
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      statusCode: 401,
      message: 'Token expirado'
    };
  }

  // Error de validación de Express
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = {
      statusCode: 400,
      message: `Error de validación: ${message}`
    };
  }

  // Errores personalizados de la aplicación
  if (err.message === 'Credenciales inválidas' || 
      err.message === 'Usuario no encontrado' || 
      err.message === 'Factura no encontrada' ||
      err.message === 'Emisor no encontrado') {
    error = {
      statusCode: 404,
      message: err.message
    };
  }

  if (err.message === 'Usuario inactivo' || 
      err.message === 'Usuario temporalmente bloqueado. Intenta más tarde.') {
    error = {
      statusCode: 403,
      message: err.message
    };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      originalError: err.code ? { code: err.code, errno: err.errno } : undefined
    })
  });
};

module.exports = errorHandler;