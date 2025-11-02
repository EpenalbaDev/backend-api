const { executeQuery } = require('../config/database');

class Factura {
  // Obtener factura por ID
  static async findById(id) {
    const query = `
      SELECT f.*, 
             COUNT(DISTINCT fi.id) as total_items,
             COUNT(DISTINCT fa.id) as total_archivos
      FROM facturas f
      LEFT JOIN factura_items fi ON f.id = fi.factura_id
      LEFT JOIN factura_archivos fa ON f.id = fa.factura_id
      WHERE f.id = ?
      GROUP BY f.id
    `;
    const facturas = await executeQuery(query, [id]);
    return facturas[0] || null;
  }

  // Obtener facturas con filtros y paginación
  static async findWithFilters(filters) {
    let whereConditions = [];
    let params = [];

    // Filtros básicos
    if (filters.search) {
      whereConditions.push(`(
        f.numero_factura LIKE ? OR 
        f.emisor_nombre LIKE ? OR 
        f.emisor_ruc LIKE ? OR
        f.receptor_nombre LIKE ?
      )`);
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (filters.estado) {
      whereConditions.push('f.estado = ?');
      params.push(filters.estado);
    }

    if (filters.emisorRuc) {
      whereConditions.push('f.emisor_ruc = ?');
      params.push(filters.emisorRuc);
    }

    if (filters.fechaInicio) {
      whereConditions.push('f.fecha_factura >= ?');
      params.push(filters.fechaInicio);
    }

    if (filters.fechaFin) {
      whereConditions.push('f.fecha_factura <= ?');
      params.push(filters.fechaFin);
    }

    if (filters.montoMin) {
      whereConditions.push('f.total >= ?');
      params.push(filters.montoMin);
    }

    if (filters.montoMax) {
      whereConditions.push('f.total <= ?');
      params.push(filters.montoMax);
    }

    if (filters.confianzaMin) {
      whereConditions.push('f.confianza_ocr >= ?');
      params.push(filters.confianzaMin);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Query principal
    const query = `
      SELECT f.*, 
             COUNT(DISTINCT fi.id) as total_items,
             COUNT(DISTINCT fa.id) as total_archivos
      FROM facturas f
      LEFT JOIN factura_items fi ON f.id = fi.factura_id
      LEFT JOIN factura_archivos fa ON f.id = fa.factura_id
      ${whereClause}
      GROUP BY f.id
      ORDER BY f.${filters.sortBy || 'created_at'} ${filters.sortOrder || 'DESC'}
      LIMIT ? OFFSET ?
    `;

    const limit = filters.limit || 25;
    const offset = ((filters.page || 1) - 1) * limit;
    params.push(limit, offset);

    const facturas = await executeQuery(query, params);

    // Contar total para paginación
    const countQuery = `
      SELECT COUNT(DISTINCT f.id) as total
      FROM facturas f
      ${whereClause}
    `;
    const countResult = await executeQuery(countQuery, params.slice(0, -2));
    const total = countResult[0].total;

    return {
      facturas,
      pagination: {
        page: filters.page || 1,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Crear nueva factura
  static async create(facturaData) {
    const query = `
      INSERT INTO facturas (
        email_from, email_subject, email_date, s3_key,
        emisor_nombre, emisor_ruc, emisor_direccion, emisor_telefono,
        receptor_nombre, receptor_ruc, receptor_direccion,
        numero_factura, fecha_factura, subtotal, descuento, itbms, total,
        estado, confianza_ocr, procesado_por
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await executeQuery(query, [
      facturaData.email_from,
      facturaData.email_subject,
      facturaData.email_date,
      facturaData.s3_key,
      facturaData.emisor_nombre,
      facturaData.emisor_ruc,
      facturaData.emisor_direccion,
      facturaData.emisor_telefono,
      facturaData.receptor_nombre,
      facturaData.receptor_ruc,
      facturaData.receptor_direccion,
      facturaData.numero_factura,
      facturaData.fecha_factura,
      facturaData.subtotal,
      facturaData.descuento || 0,
      facturaData.itbms,
      facturaData.total,
      facturaData.estado || 'pendiente',
      facturaData.confianza_ocr,
      facturaData.procesado_por || 'mistral'
    ]);

    return result.insertId;
  }

  // Actualizar estado de factura
  static async updateEstado(id, estado, userId) {
    const query = `
      UPDATE facturas 
      SET estado = ?, updated_at = NOW() 
      WHERE id = ?
    `;
    
    const result = await executeQuery(query, [estado, id]);
    
    if (result.affectedRows === 0) {
      throw new Error('Factura no encontrada');
    }

    // Registrar log de cambio de estado
    await this.logEstadoChange(id, estado, userId);
    
    return this.findById(id);
  }

  // Eliminar factura
  static async delete(id) {
    // Primero eliminar registros relacionados
    await executeQuery('DELETE FROM factura_items WHERE factura_id = ?', [id]);
    await executeQuery('DELETE FROM factura_archivos WHERE factura_id = ?', [id]);
    await executeQuery('DELETE FROM factura_raw_data WHERE factura_id = ?', [id]);
    await executeQuery('DELETE FROM procesamiento_logs WHERE factura_id = ?', [id]);
    
    // Finalmente eliminar la factura
    const result = await executeQuery('DELETE FROM facturas WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      throw new Error('Factura no encontrada');
    }
  }

  // Registrar cambio de estado
  static async logEstadoChange(facturaId, nuevoEstado, userId) {
    const query = `
      INSERT INTO procesamiento_logs (factura_id, tipo_evento, mensaje, detalles)
      VALUES (?, 'cambio_estado', ?, ?)
    `;
    
    const detalles = JSON.stringify({
      nuevo_estado: nuevoEstado,
      usuario_id: userId,
      timestamp: new Date().toISOString()
    });
    
    await executeQuery(query, [facturaId, `Estado cambiado a: ${nuevoEstado}`, detalles]);
  }

  // Obtener estadísticas generales
  static async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total_facturas,
        COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as facturas_pendientes,
        COUNT(CASE WHEN estado = 'procesado' THEN 1 END) as facturas_procesadas,
        COUNT(CASE WHEN estado = 'error' THEN 1 END) as facturas_error,
        COUNT(CASE WHEN estado = 'revisado' THEN 1 END) as facturas_revisadas,
        SUM(total) as total_monto,
        AVG(total) as promedio_factura,
        AVG(confianza_ocr) as confianza_promedio,
        COUNT(DISTINCT emisor_ruc) as emisores_unicos
      FROM facturas
    `;
    
    const result = await executeQuery(query);
    return result[0];
  }

  // Obtener facturas por período
  static async getByPeriod(startDate, endDate) {
    const query = `
      SELECT 
        DATE(fecha_factura) as fecha,
        COUNT(*) as cantidad,
        SUM(total) as monto_total,
        AVG(confianza_ocr) as confianza_promedio
      FROM facturas 
      WHERE fecha_factura BETWEEN ? AND ?
      GROUP BY DATE(fecha_factura)
      ORDER BY fecha
    `;
    
    return await executeQuery(query, [startDate, endDate]);
  }

  // Buscar facturas por texto
  static async searchByText(searchTerm, limit = 50) {
    const query = `
      SELECT f.*, 
             COUNT(DISTINCT fi.id) as total_items
      FROM facturas f
      LEFT JOIN factura_items fi ON f.id = fi.factura_id
      WHERE f.numero_factura LIKE ? 
         OR f.emisor_nombre LIKE ? 
         OR f.emisor_ruc LIKE ?
         OR f.receptor_nombre LIKE ?
         OR EXISTS (
           SELECT 1 FROM factura_items fi2 
           WHERE fi2.factura_id = f.id 
           AND (fi2.descripcion LIKE ? OR fi2.codigo LIKE ?)
         )
      GROUP BY f.id
      ORDER BY f.created_at DESC
      LIMIT ?
    `;
    
    const searchPattern = `%${searchTerm}%`;
    return await executeQuery(query, [
      searchPattern, searchPattern, searchPattern, searchPattern,
      searchPattern, searchPattern, limit
    ]);
  }
}

module.exports = Factura;
