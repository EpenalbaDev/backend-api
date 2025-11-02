const { executeQuery } = require('../config/database');

class Empresa {
  // Obtener empresa por ID
  static async findById(id) {
    const query = `
      SELECT id, nombre, ruc, email_procesamiento, direccion, telefono, 
             activo, plan, created_at, updated_at
      FROM empresas 
      WHERE id = ? AND activo = TRUE
    `;
    const empresas = await executeQuery(query, [id]);
    return empresas[0] || null;
  }

  // Obtener empresa por RUC
  static async findByRuc(ruc) {
    const query = `
      SELECT id, nombre, ruc, email_procesamiento, direccion, telefono, 
             activo, plan, created_at, updated_at
      FROM empresas 
      WHERE ruc = ? AND activo = TRUE
    `;
    const empresas = await executeQuery(query, [ruc]);
    return empresas[0] || null;
  }

  // Obtener empresa por email de procesamiento
  static async findByEmail(email) {
    const query = `
      SELECT id, nombre, ruc, email_procesamiento, direccion, telefono, 
             activo, plan, created_at, updated_at
      FROM empresas 
      WHERE email_procesamiento = ? AND activo = TRUE
    `;
    const empresas = await executeQuery(query, [email]);
    return empresas[0] || null;
  }

  // Crear nueva empresa
  static async create(empresaData) {
    const query = `
      INSERT INTO empresas (nombre, ruc, email_procesamiento, direccion, telefono, activo, plan)
      VALUES (?, ?, ?, ?, ?, TRUE, ?)
    `;
    const result = await executeQuery(query, [
      empresaData.nombre,
      empresaData.ruc,
      empresaData.email_procesamiento,
      empresaData.direccion || null,
      empresaData.telefono || null,
      empresaData.plan || 'basico'
    ]);
    return result.insertId;
  }

  // Actualizar empresa
  static async update(id, empresaData) {
    const fields = [];
    const values = [];

    if (empresaData.nombre !== undefined) {
      fields.push('nombre = ?');
      values.push(empresaData.nombre);
    }
    if (empresaData.ruc !== undefined) {
      fields.push('ruc = ?');
      values.push(empresaData.ruc);
    }
    if (empresaData.email_procesamiento !== undefined) {
      fields.push('email_procesamiento = ?');
      values.push(empresaData.email_procesamiento);
    }
    if (empresaData.direccion !== undefined) {
      fields.push('direccion = ?');
      values.push(empresaData.direccion);
    }
    if (empresaData.telefono !== undefined) {
      fields.push('telefono = ?');
      values.push(empresaData.telefono);
    }
    if (empresaData.activo !== undefined) {
      fields.push('activo = ?');
      values.push(empresaData.activo);
    }
    if (empresaData.plan !== undefined) {
      fields.push('plan = ?');
      values.push(empresaData.plan);
    }

    if (fields.length === 0) {
      throw new Error('No hay campos para actualizar');
    }

    fields.push('updated_at = NOW()');
    values.push(id);

    const query = `
      UPDATE empresas 
      SET ${fields.join(', ')} 
      WHERE id = ?
    `;
    await executeQuery(query, values);
    return await this.findById(id);
  }

  // Obtener todas las empresas
  static async findAll(limit = 50, offset = 0) {
    const query = `
      SELECT id, nombre, ruc, email_procesamiento, direccion, telefono, 
             activo, plan, created_at, updated_at
      FROM empresas 
      WHERE activo = TRUE
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    return await executeQuery(query, [limit, offset]);
  }

  // Contar empresas
  static async count(whereClause = 'WHERE activo = TRUE', params = []) {
    const query = `SELECT COUNT(*) as total FROM empresas ${whereClause}`;
    const result = await executeQuery(query, params);
    return result[0].total;
  }

  // Obtener usuarios de una empresa
  static async getUsers(empresaId, limit = 50, offset = 0) {
    const query = `
      SELECT id, nombre, apellido, email, rol, activo, ultimo_acceso, 
             created_at, updated_at
      FROM usuarios 
      WHERE empresa_id = ? AND activo = TRUE
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    return await executeQuery(query, [empresaId, limit, offset]);
  }
}

module.exports = Empresa;

