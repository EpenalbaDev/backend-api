const { executeQuery } = require('../config/database');

class User {
  // Obtener usuario por ID
  static async findById(id) {
    const query = `
      SELECT id, empresa_id, nombre, apellido, email, rol, activo, ultimo_acceso, 
             avatar_url, configuraciones, created_at, updated_at
      FROM usuarios 
      WHERE id = ? AND activo = TRUE
    `;
    const users = await executeQuery(query, [id]);
    return users[0] || null;
  }

  // Obtener usuario por email
  static async findByEmail(email) {
    const query = `
      SELECT id, empresa_id, nombre, apellido, email, password, rol, activo, 
             ultimo_acceso, intentos_fallidos, bloqueado_hasta,
             avatar_url, configuraciones, created_at, updated_at
      FROM usuarios 
      WHERE email = ? AND activo = TRUE
    `;
    const users = await executeQuery(query, [email]);
    return users[0] || null;
  }

  // Crear nuevo usuario
  static async create(userData) {
    const query = `
      INSERT INTO usuarios (empresa_id, nombre, apellido, email, password, rol, activo)
      VALUES (?, ?, ?, ?, ?, ?, TRUE)
    `;
    const result = await executeQuery(query, [
      userData.empresa_id || null,
      userData.nombre,
      userData.apellido,
      userData.email,
      userData.password,
      userData.rol || 'usuario'
    ]);
    return result.insertId;
  }

  // Actualizar último acceso
  static async updateLastAccess(id) {
    const query = `
      UPDATE usuarios 
      SET ultimo_acceso = NOW() 
      WHERE id = ?
    `;
    await executeQuery(query, [id]);
  }

  // Incrementar intentos fallidos
  static async incrementFailedAttempts(id) {
    const query = `
      UPDATE usuarios 
      SET intentos_fallidos = intentos_fallidos + 1 
      WHERE id = ?
    `;
    await executeQuery(query, [id]);
  }

  // Bloquear usuario temporalmente
  static async blockUser(id, until) {
    const query = `
      UPDATE usuarios 
      SET bloqueado_hasta = ? 
      WHERE id = ?
    `;
    await executeQuery(query, [until, id]);
  }

  // Resetear intentos fallidos
  static async resetFailedAttempts(id) {
    const query = `
      UPDATE usuarios 
      SET intentos_fallidos = 0, bloqueado_hasta = NULL 
      WHERE id = ?
    `;
    await executeQuery(query, [id]);
  }

  // Cambiar password
  static async updatePassword(id, newPassword) {
    const query = `
      UPDATE usuarios 
      SET password = ?, updated_at = NOW() 
      WHERE id = ?
    `;
    await executeQuery(query, [newPassword, id]);
  }

  // Obtener todos los usuarios (para admin)
  static async findAll(limit = 50, offset = 0, empresaId = null) {
    let query = `
      SELECT id, empresa_id, nombre, apellido, email, rol, activo, ultimo_acceso, 
             intentos_fallidos, created_at, updated_at
      FROM usuarios 
    `;
    const params = [];
    
    if (empresaId) {
      query += ' WHERE empresa_id = ?';
      params.push(empresaId);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    return await executeQuery(query, params);
  }

  // Contar usuarios
  static async count() {
    const query = 'SELECT COUNT(*) as total FROM usuarios WHERE activo = TRUE';
    const result = await executeQuery(query);
    return result[0].total;
  }
}

module.exports = User;

