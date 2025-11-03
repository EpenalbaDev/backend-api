const rateLimit = require('express-rate-limit');

// Rate limiter global (menos restrictivo)
const globalLimiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutos por defecto
  limit: process.env.RATE_LIMIT_MAX || 100, // 100 requests por ventana (cambié max por limit)
  message: {
    success: false,
    message: 'Demasiadas peticiones desde esta IP, inténtalo más tarde'
  },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting para health check
    return req.path === '/health';
  }
});

// Rate limiter para autenticación (más restrictivo)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 5, // 5 intentos de login por IP (cambié max por limit)
  message: {
    success: false,
    message: 'Demasiados intentos de login, inténtalo en 15 minutos'
  },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true // No contar requests exitosos
});

// Rate limiter para endpoints sensibles
const sensitiveLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  limit: 10, // 10 requests por ventana (cambié max por limit)
  message: {
    success: false,
    message: 'Demasiadas peticiones a este endpoint sensible'
  },
  standardHeaders: 'draft-7',
  legacyHeaders: false
});

// Rate limiter para registro público (5 requests/hour)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  limit: 5, // 5 registros por hora por IP
  message: {
    success: false,
    message: 'Demasiados intentos de registro desde esta IP. Intenta en una hora.'
  },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: false // Contar todos los requests
});

module.exports = {
  global: globalLimiter,
  auth: authLimiter,
  sensitive: sensitiveLimiter,
  register: registerLimiter
};