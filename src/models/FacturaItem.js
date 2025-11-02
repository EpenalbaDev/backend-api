const { executeQuery } = require('../config/database');

class FacturaItem {
  // Obtener items de una factura
  static async findByFacturaId(facturaId) {
    const query = `
      SELECT * FROM factura_items 
      WHERE factura_id = ? 
      ORDER BY id
    `;
    return await executeQuery(query, [facturaId]);
  }

  // Crear item de factura
  static async create(itemData) {
    const query = `
      INSERT INTO factura_items (
        factura_id, codigo, descripcion, cantidad, unidad,
        precio_unitario, descuento_item, impuesto_item, total_item
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await executeQuery(query, [
      itemData.factura_id,
      itemData.codigo,
      itemData.descripcion,
      itemData.cantidad,
      itemData.unidad,
      itemData.precio_unitario,
      itemData.descuento_item || 0,
      itemData.impuesto_item || 0,
      itemData.total_item
    ]);
    
    return result.insertId;
  }

  // Crear múltiples items de una factura
  static async createMany(items, facturaId) {
    if (!items || items.length === 0) return [];
    
    const values = items.map(item => [
      facturaId,
      item.codigo,
      item.descripcion,
      item.cantidad,
      item.unidad,
      item.precio_unitario,
      item.descuento_item || 0,
      item.impuesto_item || 0,
      item.total_item
    ]);
    
    const query = `
      INSERT INTO factura_items (
        factura_id, codigo, descripcion, cantidad, unidad,
        precio_unitario, descuento_item, impuesto_item, total_item
      ) VALUES ?
    `;
    
    const result = await executeQuery(query, [values]);
    return result.insertId;
  }

  // Actualizar item
  static async update(id, itemData) {
    const query = `
      UPDATE factura_items 
      SET codigo = ?, descripcion = ?, cantidad = ?, unidad = ?,
          precio_unitario = ?, descuento_item = ?, impuesto_item = ?, 
          total_item = ?
      WHERE id = ?
    `;
    
    const result = await executeQuery(query, [
      itemData.codigo,
      itemData.descripcion,
      itemData.cantidad,
      itemData.unidad,
      itemData.precio_unitario,
      itemData.descuento_item || 0,
      itemData.impuesto_item || 0,
      itemData.total_item,
      id
    ]);
    
    if (result.affectedRows === 0) {
      throw new Error('Item no encontrado');
    }
  }

  // Eliminar item
  static async delete(id) {
    const result = await executeQuery('DELETE FROM factura_items WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      throw new Error('Item no encontrado');
    }
  }

  // Eliminar todos los items de una factura
  static async deleteByFacturaId(facturaId) {
    await executeQuery('DELETE FROM factura_items WHERE factura_id = ?', [facturaId]);
  }

  // Obtener estadísticas de items
  static async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total_items,
        COUNT(DISTINCT factura_id) as facturas_con_items,
        AVG(cantidad) as cantidad_promedio,
        AVG(precio_unitario) as precio_promedio,
        AVG(total_item) as total_promedio,
        SUM(total_item) as total_general
      FROM factura_items
    `;
    
    const result = await executeQuery(query);
    return result[0];
  }

  // Buscar items por descripción
  static async searchByDescription(searchTerm, limit = 50) {
    const query = `
      SELECT fi.*, f.numero_factura, f.emisor_nombre
      FROM factura_items fi
      JOIN facturas f ON fi.factura_id = f.id
      WHERE fi.descripcion LIKE ? OR fi.codigo LIKE ?
      ORDER BY fi.created_at DESC
      LIMIT ?
    `;
    
    const searchPattern = `%${searchTerm}%`;
    return await executeQuery(query, [searchPattern, searchPattern, limit]);
  }

  // Obtener items más comunes
  static async getMostCommonItems(limit = 20) {
    const query = `
      SELECT 
        codigo,
        descripcion,
        COUNT(*) as frecuencia,
        AVG(precio_unitario) as precio_promedio,
        SUM(cantidad) as cantidad_total
      FROM factura_items
      WHERE codigo IS NOT NULL AND codigo != ''
      GROUP BY codigo, descripcion
      ORDER BY frecuencia DESC
      LIMIT ?
    `;
    
    return await executeQuery(query, [limit]);
  }

  // Obtener resumen de items por factura
  static async getSummaryByFactura(facturaId) {
    const query = `
      SELECT 
        COUNT(*) as total_items,
        SUM(cantidad) as cantidad_total,
        SUM(total_item) as subtotal_items,
        SUM(descuento_item) as descuento_total,
        SUM(impuesto_item) as impuesto_total
      FROM factura_items
      WHERE factura_id = ?
    `;
    
    const result = await executeQuery(query, [facturaId]);
    return result[0];
  }
}

module.exports = FacturaItem;
