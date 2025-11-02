const { executeQuery } = require('../config/database');

class FacturaArchivo {
  // Obtener archivos de una factura
  static async findByFacturaId(facturaId) {
    const query = `
      SELECT * FROM factura_archivos 
      WHERE factura_id = ? 
      ORDER BY created_at DESC
    `;
    return await executeQuery(query, [facturaId]);
  }

  // Crear archivo de factura
  static async create(archivoData) {
    const query = `
      INSERT INTO factura_archivos (
        factura_id, nombre_archivo, tipo_archivo, s3_url, tamaño_bytes
      ) VALUES (?, ?, ?, ?, ?)
    `;
    
    const result = await executeQuery(query, [
      archivoData.factura_id,
      archivoData.nombre_archivo,
      archivoData.tipo_archivo,
      archivoData.s3_url,
      archivoData.tamaño_bytes
    ]);
    
    return result.insertId;
  }

  // Crear múltiples archivos
  static async createMany(archivos, facturaId) {
    if (!archivos || archivos.length === 0) return [];
    
    const values = archivos.map(archivo => [
      facturaId,
      archivo.nombre_archivo,
      archivo.tipo_archivo,
      archivo.s3_url,
      archivo.tamaño_bytes
    ]);
    
    const query = `
      INSERT INTO factura_archivos (
        factura_id, nombre_archivo, tipo_archivo, s3_url, tamaño_bytes
      ) VALUES ?
    `;
    
    const result = await executeQuery(query, [values]);
    return result.insertId;
  }

  // Eliminar archivo
  static async delete(id) {
    const result = await executeQuery('DELETE FROM factura_archivos WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      throw new Error('Archivo no encontrado');
    }
  }

  // Eliminar todos los archivos de una factura
  static async deleteByFacturaId(facturaId) {
    await executeQuery('DELETE FROM factura_archivos WHERE factura_id = ?', [facturaId]);
  }

  // Obtener estadísticas de archivos
  static async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total_archivos,
        COUNT(DISTINCT factura_id) as facturas_con_archivos,
        SUM(tamaño_bytes) as tamaño_total_bytes,
        AVG(tamaño_bytes) as tamaño_promedio_bytes,
        COUNT(CASE WHEN tipo_archivo LIKE '%pdf%' THEN 1 END) as archivos_pdf,
        COUNT(CASE WHEN tipo_archivo LIKE '%image%' THEN 1 END) as archivos_imagen
      FROM factura_archivos
    `;
    
    const result = await executeQuery(query);
    return result[0];
  }

  // Obtener archivos por tipo
  static async getByType(tipoArchivo, limit = 50) {
    const query = `
      SELECT fa.*, f.numero_factura, f.emisor_nombre
      FROM factura_archivos fa
      JOIN facturas f ON fa.factura_id = f.id
      WHERE fa.tipo_archivo LIKE ?
      ORDER BY fa.created_at DESC
      LIMIT ?
    `;
    
    const searchPattern = `%${tipoArchivo}%`;
    return await executeQuery(query, [searchPattern, limit]);
  }

  // Obtener archivos más grandes
  static async getLargestFiles(limit = 20) {
    const query = `
      SELECT fa.*, f.numero_factura, f.emisor_nombre
      FROM factura_archivos fa
      JOIN facturas f ON fa.factura_id = f.id
      ORDER BY fa.tamaño_bytes DESC
      LIMIT ?
    `;
    
    return await executeQuery(query, [limit]);
  }
}

module.exports = FacturaArchivo; 