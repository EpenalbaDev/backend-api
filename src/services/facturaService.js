const { executeQuery } = require('../config/database');

class FacturaService {
  // Obtener lista de facturas con filtros y paginación
  async getFacturas(filtros = {}) {
    try {
      const {
        page = 1,
        limit = 25,
        search,
        estado,
        emisorRuc,
        fechaInicio,
        fechaFin,
        montoMin,
        montoMax,
        confianzaMin,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = filtros;

      // Construir WHERE clause
      let whereClause = 'WHERE 1=1';
      let params = [];

      if (search && typeof search === 'string' && search.trim()) {
        whereClause += ` AND (
          numero_factura LIKE ? OR 
          emisor_nombre LIKE ? OR 
          receptor_nombre LIKE ? OR
          emisor_ruc LIKE ?
        )`;
        const searchTerm = `%${search.trim()}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      if (estado && typeof estado === 'string' && estado.trim()) {
        whereClause += ' AND estado = ?';
        params.push(estado.trim());
      }

      if (emisorRuc && typeof emisorRuc === 'string' && emisorRuc.trim()) {
        whereClause += ' AND emisor_ruc = ?';
        params.push(emisorRuc.trim());
      }

      if (fechaInicio && typeof fechaInicio === 'string' && fechaInicio.trim()) {
        whereClause += ' AND fecha_factura >= ?';
        params.push(fechaInicio.trim());
      }

      if (fechaFin && typeof fechaFin === 'string' && fechaFin.trim()) {
        whereClause += ' AND fecha_factura <= ?';
        params.push(fechaFin.trim());
      }

      if (montoMin && !isNaN(parseFloat(montoMin))) {
        whereClause += ' AND total >= ?';
        params.push(parseFloat(montoMin));
      }

      if (montoMax && !isNaN(parseFloat(montoMax))) {
        whereClause += ' AND total <= ?';
        params.push(parseFloat(montoMax));
      }

      if (confianzaMin && !isNaN(parseFloat(confianzaMin))) {
        whereClause += ' AND confianza_ocr >= ?';
        params.push(parseFloat(confianzaMin));
      }

      // Validar campos de ordenamiento
      const allowedSortFields = ['created_at', 'fecha_factura', 'total', 'numero_factura', 'emisor_nombre', 'confianza_ocr'];
      const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
      const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      // Calcular offset - asegurar que sean números enteros
      const limitInt = parseInt(limit) || 25;
      const pageInt = parseInt(page) || 1;
      const offset = Math.floor((pageInt - 1) * limitInt);

      // Verificar que todos los parámetros sean válidos
      const allParams = [...params, limitInt, offset];
      
      // Filtrar parámetros inválidos y asegurar tipos correctos
      const validParams = allParams.filter(p => p !== undefined && p !== null && p !== '');

      // Query principal
      const facturas = await executeQuery(`
        SELECT 
          id,
          numero_factura,
          emisor_nombre,
          emisor_ruc,
          receptor_nombre,
          fecha_factura,
          subtotal,
          descuento,
          itbms,
          total,
          estado,
          confianza_ocr,
          procesado_por,
          created_at,
          updated_at
        FROM facturas 
        ${whereClause}
        ORDER BY ${sortField} ${order}
        LIMIT ? OFFSET ?
      `, validParams);

      // Contar total para paginación
      const [countResult] = await executeQuery(`
        SELECT COUNT(*) as total FROM facturas ${whereClause}
      `, params);

      const total = countResult.total;
      const totalPages = Math.ceil(total / limitInt);

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
          currentPage: pageInt,
          totalPages,
          totalItems: total,
          itemsPerPage: limitInt,
          hasNextPage: pageInt < totalPages,
          hasPrevPage: pageInt > 1
        }
      };

    } catch (error) {
      console.error('Error en getFacturas:', error);
      throw error;
    }
  }

  // Obtener factura por ID con detalles completos
  async getFacturaById(id) {
    try {
      // Datos principales de la factura
      const facturas = await executeQuery(`
        SELECT * FROM facturas WHERE id = ?
      `, [id]);

      if (facturas.length === 0) {
        throw new Error('Factura no encontrada');
      }

      const factura = facturas[0];

      // Obtener items de la factura
      const items = await executeQuery(`
        SELECT * FROM factura_items WHERE factura_id = ? ORDER BY id
      `, [id]);

      // Obtener archivos adjuntos
      const archivos = await executeQuery(`
        SELECT * FROM factura_archivos WHERE factura_id = ? ORDER BY created_at
      `, [id]);

      // Obtener datos raw (si existen)
      const rawData = await executeQuery(`
        SELECT * FROM factura_raw_data WHERE factura_id = ?
      `, [id]);

      // Obtener logs de procesamiento
      const logs = await executeQuery(`
        SELECT * FROM procesamiento_logs 
        WHERE factura_id = ? 
        ORDER BY created_at DESC 
        LIMIT 50
      `, [id]);

      return {
        ...factura,
        subtotal: parseFloat(factura.subtotal || 0),
        descuento: parseFloat(factura.descuento || 0),
        itbms: parseFloat(factura.itbms || 0),
        total: parseFloat(factura.total || 0),
        confianza_ocr: parseFloat(factura.confianza_ocr || 0),
        items: items.map(item => ({
          ...item,
          cantidad: parseFloat(item.cantidad || 0),
          precio_unitario: parseFloat(item.precio_unitario || 0),
          descuento_item: parseFloat(item.descuento_item || 0),
          impuesto_item: parseFloat(item.impuesto_item || 0),
          total_item: parseFloat(item.total_item || 0)
        })),
        archivos,
        raw_data: rawData[0] || null,
        logs
      };

    } catch (error) {
      console.error('Error en getFacturaById:', error);
      throw error;
    }
  }

  // Actualizar estado de factura
  async updateEstado(id, nuevoEstado, userId, comentario = null) {
    try {
      const estadosValidos = ['pendiente', 'procesado', 'error', 'revision'];
      
      if (!estadosValidos.includes(nuevoEstado)) {
        throw new Error('Estado inválido');
      }

      // Verificar que la factura existe
      const facturas = await executeQuery(`
        SELECT id, estado FROM facturas WHERE id = ?
      `, [id]);

      if (facturas.length === 0) {
        throw new Error('Factura no encontrada');
      }

      const estadoAnterior = facturas[0].estado;

      // Actualizar estado
      await executeQuery(`
        UPDATE facturas SET estado = ?, updated_at = NOW() WHERE id = ?
      `, [nuevoEstado, id]);

      // Registrar log del cambio
      const logDetalles = {
        estado_anterior: estadoAnterior,
        estado_nuevo: nuevoEstado,
        usuario_id: userId,
        timestamp: new Date().toISOString()
      };

      if (comentario) {
        logDetalles.comentario = comentario;
      }

      await executeQuery(`
        INSERT INTO procesamiento_logs (factura_id, tipo_evento, mensaje, detalles) 
        VALUES (?, 'cambio_estado', ?, ?)
      `, [id, comentario || 'Estado cambiado por usuario', JSON.stringify(logDetalles)]);

      return { 
        success: true, 
        estadoAnterior, 
        estadoNuevo: nuevoEstado,
        comentario: comentario || null
      };

    } catch (error) {
      console.error('Error en updateEstado:', error);
      throw error;
    }
  }

  // Obtener items de una factura específica
  async getFacturaItems(facturaId) {
    try {
      const items = await executeQuery(`
        SELECT * FROM factura_items WHERE factura_id = ? ORDER BY id
      `, [facturaId]);

      return items.map(item => ({
        ...item,
        cantidad: parseFloat(item.cantidad || 0),
        precio_unitario: parseFloat(item.precio_unitario || 0),
        descuento_item: parseFloat(item.descuento_item || 0),
        impuesto_item: parseFloat(item.impuesto_item || 0),
        total_item: parseFloat(item.total_item || 0)
      }));

    } catch (error) {
      console.error('Error en getFacturaItems:', error);
      throw error;
    }
  }

  // Obtener archivos de una factura
  async getFacturaArchivos(facturaId) {
    try {
      const archivos = await executeQuery(`
        SELECT * FROM factura_archivos WHERE factura_id = ? ORDER BY created_at
      `, [facturaId]);

      return archivos;

    } catch (error) {
      console.error('Error en getFacturaArchivos:', error);
      throw error;
    }
  }

  // Eliminar factura (soft delete - cambiar estado)
  async deleteFactura(id, userId) {
    try {
      // Verificar que la factura existe
      const facturas = await executeQuery(`
        SELECT id FROM facturas WHERE id = ?
      `, [id]);

      if (facturas.length === 0) {
        throw new Error('Factura no encontrada');
      }

      // En lugar de eliminar, marcamos como eliminada
      await executeQuery(`
        UPDATE facturas SET estado = 'eliminado', updated_at = NOW() WHERE id = ?
      `, [id]);

      // Registrar log
      await executeQuery(`
        INSERT INTO procesamiento_logs (factura_id, tipo_evento, mensaje, detalles) 
        VALUES (?, 'factura_eliminada', 'Factura eliminada por usuario', ?)
      `, [id, JSON.stringify({
        usuario_id: userId,
        timestamp: new Date().toISOString()
      })]);

      return { success: true };

    } catch (error) {
      console.error('Error en deleteFactura:', error);
      throw error;
    }
  }

  // Búsqueda avanzada de facturas
  async searchFacturas(query, filtros = {}) {
    try {
      const { limit = 20, estado, emisorRuc, page = 1 } = filtros;

      let whereClause = `WHERE (
        numero_factura LIKE ? OR 
        emisor_nombre LIKE ? OR 
        receptor_nombre LIKE ? OR
        emisor_ruc LIKE ? OR
        EXISTS (
          SELECT 1 FROM factura_items fi 
          WHERE fi.factura_id = facturas.id 
          AND fi.descripcion LIKE ?
        )
      )`;

      const searchTerm = `%${query}%`;
      let params = [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm];

      if (estado) {
        whereClause += ' AND estado = ?';
        params.push(estado);
      }

      if (emisorRuc) {
        whereClause += ' AND emisor_ruc = ?';
        params.push(emisorRuc);
      }

      // Calcular offset para paginación
      const limitInt = parseInt(limit) || 20;
      const pageInt = parseInt(page) || 1;
      const offset = Math.floor((pageInt - 1) * limitInt);

      const facturas = await executeQuery(`
        SELECT 
          id,
          numero_factura,
          emisor_nombre,
          emisor_ruc,
          fecha_factura,
          total,
          estado,
          confianza_ocr
        FROM facturas 
        ${whereClause}
        ORDER BY 
          CASE 
            WHEN numero_factura LIKE ? THEN 1
            WHEN emisor_nombre LIKE ? THEN 2
            ELSE 3
          END,
          created_at DESC
        LIMIT ? OFFSET ?
      `, [...params, searchTerm, searchTerm, limitInt, offset]);

      // Contar total para paginación
      const [countResult] = await executeQuery(`
        SELECT COUNT(*) as total FROM facturas ${whereClause}
      `, params);

      const total = countResult.total;
      const totalPages = Math.ceil(total / limitInt);

      return {
        facturas: facturas.map(factura => ({
          ...factura,
          total: parseFloat(factura.total || 0),
          confianza_ocr: parseFloat(factura.confianza_ocr || 0)
        })),
        pagination: {
          currentPage: pageInt,
          totalPages,
          totalItems: total,
          itemsPerPage: limitInt,
          hasNextPage: pageInt < totalPages,
          hasPrevPage: pageInt > 1
        }
      };

    } catch (error) {
      console.error('Error en searchFacturas:', error);
      throw error;
    }
  }

  // Obtener sugerencias para búsqueda
  async getSuggestions(query) {
    try {
      const searchTerm = `%${query}%`;

      // Sugerencias de emisores
      const emisores = await executeQuery(`
        SELECT DISTINCT emisor_nombre, emisor_ruc 
        FROM facturas 
        WHERE (emisor_nombre LIKE ? OR emisor_ruc LIKE ?) 
        AND emisor_nombre IS NOT NULL 
        ORDER BY emisor_nombre 
        LIMIT 5
      `, [searchTerm, searchTerm]);

      // Sugerencias de números de factura
      const numeroFacturas = await executeQuery(`
        SELECT DISTINCT numero_factura 
        FROM facturas 
        WHERE numero_factura LIKE ? 
        AND numero_factura IS NOT NULL 
        ORDER BY numero_factura 
        LIMIT 5
      `, [searchTerm]);

      return {
        emisores: emisores.map(e => ({
          label: `${e.emisor_nombre} (${e.emisor_ruc})`,
          value: e.emisor_ruc,
          type: 'emisor'
        })),
        numeros_factura: numeroFacturas.map(nf => ({
          label: nf.numero_factura,
          value: nf.numero_factura,
          type: 'numero_factura'
        }))
      };

    } catch (error) {
      console.error('Error en getSuggestions:', error);
      throw error;
    }
  }
}

module.exports = new FacturaService();