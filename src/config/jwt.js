const jwt = require('jsonwebtoken');
const { executeQuery } = require('./database');

// Configuración JWT
const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  issuer: 'facturas-api',
  audience: 'facturas-dashboard'
};

// Generar token de acceso
function generateAccessToken(userId, userRole) {
  return jwt.sign(
    {
      userId,
      role: userRole,
      type: 'access'
    },
    JWT_CONFIG.secret,
    {
      expiresIn: JWT_CONFIG.expiresIn,
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience
    }
  );
}

// Generar token de refresh
function generateRefreshToken(userId) {
  return jwt.sign(
    {
      userId,
      type: 'refresh'
    },
    JWT_CONFIG.secret,
    {
      expiresIn: JWT_CONFIG.refreshExpiresIn,
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience
    }
  );
}

// Verificar token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_CONFIG.secret, {
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience
    });
  } catch (error) {
    throw error;
  }
}

// Registrar sesión en base de datos
async function registerSession(userId, token, ipAddress, userAgent) {
  const decoded = verifyToken(token);
  
  const query = `
    INSERT INTO sesiones_usuario (usuario_id, token_jti, expires_at, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?)
  `;
  
  const expiresAt = new Date(decoded.exp * 1000);
  
  await executeQuery(query, [
    userId,
    decoded.jti || token.substring(-20), // Usar últimos 20 chars como JTI
    expiresAt,
    ipAddress,
    userAgent
  ]);
}

// Revocar sesión
async function revokeSession(token, userId) {
  const query = `
    UPDATE sesiones_usuario 
    SET revoked_at = NOW() 
    WHERE token_jti = ? AND usuario_id = ? AND revoked_at IS NULL
  `;
  
  const decoded = verifyToken(token);
  const jti = decoded.jti || token.substring(-20);
  
  await executeQuery(query, [jti, userId]);
}

// Verificar si sesión está activa
async function isSessionActive(token) {
  try {
    const decoded = verifyToken(token);
    const jti = decoded.jti || token.substring(-20);
    
    const query = `
      SELECT COUNT(*) as count 
      FROM sesiones_usuario 
      WHERE token_jti = ? AND revoked_at IS NULL AND expires_at > NOW()
    `;
    
    const result = await executeQuery(query, [jti]);
    return result[0].count > 0;
  } catch (error) {
    return false;
  }
}

// Limpiar sesiones expiradas
async function cleanupExpiredSessions() {
  const query = `
    DELETE FROM sesiones_usuario 
    WHERE expires_at < NOW() OR revoked_at IS NOT NULL
  `;
  
  await executeQuery(query);
}

// Obtener sesiones activas de un usuario
async function getUserActiveSessions(userId) {
  const query = `
    SELECT id, token_jti, expires_at, ip_address, user_agent, created_at
    FROM sesiones_usuario 
    WHERE usuario_id = ? AND revoked_at IS NULL AND expires_at > NOW()
    ORDER BY created_at DESC
  `;
  
  return await executeQuery(query, [userId]);
}

// Revocar todas las sesiones de un usuario
async function revokeAllUserSessions(userId) {
  const query = `
    UPDATE sesiones_usuario 
    SET revoked_at = NOW() 
    WHERE usuario_id = ? AND revoked_at IS NULL
  `;
  
  await executeQuery(query, [userId]);
}

module.exports = {
  JWT_CONFIG,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  registerSession,
  revokeSession,
  isSessionActive,
  cleanupExpiredSessions,
  getUserActiveSessions,
  revokeAllUserSessions
};
