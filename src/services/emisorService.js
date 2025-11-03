const { executeQuery } = require('../config/database');

class EmisorService {
  // Obtener lista de emisores con estadísticas
  async getEmisores(filtros = {}) {
    try {
      const { page = 1, limit = 25, search, empresa_id, sortBy = 'total_facturas', sortOrder = 'DESC' } = filtros;

      let whereClause = 'WHERE emisor_ruc IS NOT NULL AND emisor_ruc != ""';
      let params = [];

      // Aplicar filtro multi-tenant si existe empresa_id
      // Nota: Si facturas no tiene empresa_id, este filtro no aplicará
      // Se puede implementar JOIN con usuarios si es necesario en el futuro
      if (empresa_id !== undefined && empresa_id !== null) {
        whereClause += ' AND empresa_id = ?';
        params.push(empresa_id);
      }

      if (search) {
        whereClause += ' AND (emisor_nombre LIKE ? OR emisor_ruc LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm);
      }

      // Validar campos de ordenamiento
      const allowedSortFields = ['total_facturas', 'monto_total', 'emisor_nombre', 'ultima_factura'];
      const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'total_facturas';
      const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      const offset = (page - 1) * limit;

      const emisores = await executeQuery(`
        SELECT 
          emisor_ruc,
          emisor_nombre,
          emisor_direccion,
          emisor_telefono,
          COUNT(*) as total_facturas,
          SUM(total) as monto_total,
          AVG(total) as promedio_factura,
          MIN(fecha_factura) as primera_factura,
          MAX(fecha_factura) as ultima_factura,
          MAX(created_at) as ultimo_procesamiento,
          COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as facturas_pendientes,
          COUNT(CASE WHEN estado = 'error' THEN 1 END) as facturas_error,
          AVG(confianza_ocr) as confianza_promedio
        FROM facturas 
        ${whereClause}
        GROUP BY emisor_ruc, emisor_nombre, emisor_direccion, emisor_telefono
        ORDER BY ${sortField} ${order}
        LIMIT ? OFFSET ?
      `, [...params, parseInt(limit), offset]);

      // Contar total para paginación
      const [countResult] = await executeQuery(`
        SELECT COUNT(DISTINCT emisor_ruc) as total 
        FROM facturas 
        ${whereClause}
      `, params);

      const total = countResult.total;
      const totalPages = Math.ceil(total / limit);

      return {
        emisores: emisores.map(emisor => ({
          ...emisor,
          monto_total: parseFloat(emisor.monto_total || 0),
          promedio_factura: parseFloat(emisor.promedio_factura || 0),
          confianza_promedio: parseFloat(emisor.confianza_promedio || 0)
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };

    } catch (error) {
      console.error('Error en getEmisores:', error);
      throw error;
    }
  }

  // Obtener detalles de un emisor específico
  async getEmisorByRuc(ruc) {
    try {
      // Datos básicos del emisor
      const emisores = await executeQuery(`
        SELECT 
          emisor_ruc,
          emisor_nombre,
          emisor_direccion,
          emisor_telefono,
          COUNT(*) as total_facturas,
          SUM(total) as monto_total,
          AVG(total) as promedio_factura,
          MIN(fecha_factura) as primera_factura,
          MAX(fecha_factura) as ultima_factura,
          MAX(created_at) as ultimo_procesamiento,
          COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as facturas_pendientes,
          COUNT(CASE WHEN estado = 'procesado' THEN 1 END) as facturas_procesadas,
          COUNT(CASE WHEN estado = 'error' THEN 1 END) as facturas_error,
          COUNT(CASE WHEN estado = 'revision' THEN 1 END) as facturas_revisadas,
          AVG(confianza_ocr) as confianza_promedio,
          MIN(confianza_ocr) as confianza_minima,
          MAX(confianza_ocr) as confianza_maxima
        FROM facturas 
        WHERE emisor_ruc = ?
        GROUP BY emisor_ruc, emisor_nombre, emisor_direccion, emisor_telefono
      `, [ruc]);

      if (emisores.length === 0) {
        throw new Error('Emisor no encontrado');
      }

      const emisor = emisores[0];

      // Estadísticas mensuales (últimos 12 meses)
      const estadisticasMensuales = await executeQuery(`
        SELECT 
          DATE_FORMAT(fecha_factura, '%Y-%m') as mes,
          COUNT(*) as cantidad_facturas,
          SUM(total) as monto_total,
          AVG(total) as promedio_factura
        FROM facturas 
        WHERE emisor_ruc = ? 
        AND fecha_factura >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(fecha_factura, '%Y-%m')
        ORDER BY mes
      `, [ruc]);

      // Productos/servicios más frecuentes
      const topProductos = await executeQuery(`
        SELECT 
          fi.descripcion,
          COUNT(*) as frecuencia,
          SUM(fi.cantidad) as cantidad_total,
          AVG(fi.precio_unitario) as precio_promedio
        FROM factura_items fi
        INNER JOIN facturas f ON fi.factura_id = f.id
        WHERE f.emisor_ruc = ?
        AND fi.descripcion IS NOT NULL
        GROUP BY fi.descripcion
        ORDER BY frecuencia DESC
        LIMIT 10
      `, [ruc]);

      return {
        ...emisor,
        monto_total: parseFloat(emisor.monto_total || 0),
        promedio_factura: parseFloat(emisor.promedio_factura || 0),
        confianza_promedio: parseFloat(emisor.confianza_promedio || 0),
        confianza_minima: parseFloat(emisor.confianza_minima || 0),
        confianza_maxima: parseFloat(emisor.confianza_maxima || 0),
        estadisticas_mensuales: estadisticasMensuales.map(row => ({
          mes: row.mes,
          cantidad_facturas: row.cantidad_facturas,
          monto_total: parseFloat(row.monto_total || 0),
          promedio_factura: parseFloat(row.promedio_factura || 0)
        })),
        top_productos: topProductos.map(row => ({
          descripcion: row.descripcion,
          frecuencia: row.frecuencia,
          cantidad_total: parseFloat(row.cantidad_total || 0),
          precio_promedio: parseFloat(row.precio_promedio || 0)
        }))
      };

    } catch (error) {
      console.error('Error en getEmisorByRuc:', error);
      throw error;
    }
  }

  // Obtener facturas de un emisor específico
  async getFacturasByEmisor(ruc, filtros = {}) {
    try {
      const {
        page = 1,
        limit = 25,
        estado,
        fechaInicio,
        fechaFin,
        sortBy = 'fecha_factura',
        sortOrder = 'DESC'
      } = filtros;

      let whereClause = 'WHERE emisor_ruc = ?';
      let params = [ruc];

      if (estado) {
        whereClause += ' AND estado = ?';
        params.push(estado);
      }

      if (fechaInicio) {
        whereClause += ' AND fecha_factura >= ?';
        params.push(fechaInicio);
      }

      if (fechaFin) {
        whereClause += ' AND fecha_factura <= ?';
        params.push(fechaFin);
      }

      const allowedSortFields = ['fecha_factura', 'total', 'numero_factura', 'created_at'];
      const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'fecha_factura';
      const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      const offset = (page - 1) * limit;

      const facturas = await executeQuery(`
        SELECT 
          id,
          numero_factura,
          fecha_factura,
          receptor_nombre,
          subtotal,
          descuento,
          itbms,
          total,
          estado,
          confianza_ocr,
          created_at
        FROM facturas 
        ${whereClause}
        ORDER BY ${sortField} ${order}
        LIMIT ? OFFSET ?
      `, [...params, parseInt(limit), offset]);

      const [countResult] = await executeQuery(`
        SELECT COUNT(*) as total FROM facturas ${whereClause}
      `, params);

      const total = countResult.total;
      const totalPages = Math.ceil(total / limit);

      return {
        facturas: facturas.map(factura => ({
          ...factura,
          subtotal: parseFloat(factura.subtotal || 0),
          descuento: parseFloat(factura.descuento || 0),
          itbms: parseFloat(factura.itbms || 0),
          total: parseFloat(factura.total || 0),
          confianza_ocr: parseFloat(factura.confianza_ocr || 0)
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };

    } catch (error) {
      console.error('Error en getFacturasByEmisor:', error);
      throw error;
    }
  }

  // Obtener top emisores por diferentes métricas
  async getTopEmisores(metrica = 'total_facturas', limit = 10) {
    try {
      const allowedMetricas = ['total_facturas', 'monto_total', 'promedio_factura'];
      const sortField = allowedMetricas.includes(metrica) ? metrica : 'total_facturas';

      const emisores = await executeQuery(`
        SELECT 
          emisor_ruc,
          emisor_nombre,
          COUNT(*) as total_facturas,
          SUM(total) as monto_total,
          AVG(total) as promedio_factura,
          MAX(fecha_factura) as ultima_factura
        FROM facturas 
        WHERE emisor_ruc IS NOT NULL AND emisor_ruc != ""
        GROUP BY emisor_ruc, emisor_nombre
        ORDER BY ${sortField} DESC
        LIMIT ?
      `, [parseInt(limit)]);

      return emisores.map(emisor => ({
        ...emisor,
        monto_total: parseFloat(emisor.monto_total || 0),
        promedio_factura: parseFloat(emisor.promedio_factura || 0)
      }));

    } catch (error) {
      console.error('Error en getTopEmisores:', error);
      throw error;
    }
  }
}

module.exports = new EmisorService();