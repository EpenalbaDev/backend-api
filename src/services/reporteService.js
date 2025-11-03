const { executeQuery } = require('../config/database');

class ReporteService {
  // Reporte de dashboard
  async getDashboardReportes(filtros = {}) {
    try {
      const { fechaInicio, fechaFin, emisorRuc, empresa_id } = filtros;

      let whereClause = 'WHERE 1=1';
      let params = [];

      // Aplicar filtro multi-tenant si existe empresa_id
      if (empresa_id !== undefined && empresa_id !== null) {
        whereClause += ' AND empresa_id = ?';
        params.push(empresa_id);
      }

      if (fechaInicio) {
        whereClause += ' AND fecha_factura >= ?';
        params.push(fechaInicio);
      }

      if (fechaFin) {
        whereClause += ' AND fecha_factura <= ?';
        params.push(fechaFin);
      }

      if (emisorRuc) {
        whereClause += ' AND emisor_ruc = ?';
        params.push(emisorRuc);
      }

      // Métricas generales
      const [metricas] = await executeQuery(`
        SELECT 
          COUNT(*) as total_facturas,
          COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as facturas_pendientes,
          COUNT(CASE WHEN estado = 'procesado' THEN 1 END) as facturas_procesadas,
          COUNT(CASE WHEN estado = 'error' THEN 1 END) as facturas_error,
          COUNT(CASE WHEN estado = 'revision' THEN 1 END) as facturas_revisadas,
          SUM(total) as total_monto,
          AVG(total) as promedio_factura,
          AVG(confianza_ocr) as confianza_promedio,
          COUNT(DISTINCT emisor_ruc) as emisores_unicos
        FROM facturas 
        ${whereClause}
      `, params);

      // Facturas por mes (últimos 12 meses)
      const facturasPorMes = await executeQuery(`
        SELECT 
          DATE_FORMAT(fecha_factura, '%Y-%m') as mes,
          COUNT(*) as cantidad,
          SUM(total) as monto_total
        FROM facturas 
        ${whereClause}
        AND fecha_factura >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(fecha_factura, '%Y-%m')
        ORDER BY mes
      `, params);

      // Top emisores
      const topEmisores = await executeQuery(`
        SELECT 
          emisor_nombre,
          emisor_ruc,
          COUNT(*) as total_facturas,
          SUM(total) as monto_total
        FROM facturas 
        ${whereClause}
        AND emisor_nombre IS NOT NULL
        GROUP BY emisor_ruc, emisor_nombre
        ORDER BY total_facturas DESC
        LIMIT 10
      `, params);

      return {
        metricas: {
          total_facturas: metricas.total_facturas,
          facturas_pendientes: metricas.facturas_pendientes,
          facturas_procesadas: metricas.facturas_procesadas,
          facturas_error: metricas.facturas_error,
          facturas_revisadas: metricas.facturas_revisadas,
          total_monto: parseFloat(metricas.total_monto || 0),
          promedio_factura: parseFloat(metricas.promedio_factura || 0),
          confianza_promedio: parseFloat(metricas.confianza_promedio || 0),
          emisores_unicos: metricas.emisores_unicos
        },
        facturas_por_mes: facturasPorMes.map(row => ({
          mes: row.mes,
          cantidad: row.cantidad,
          monto_total: parseFloat(row.monto_total || 0)
        })),
        top_emisores: topEmisores.map(row => ({
          emisor_nombre: row.emisor_nombre,
          emisor_ruc: row.emisor_ruc,
          total_facturas: row.total_facturas,
          monto_total: parseFloat(row.monto_total || 0)
        }))
      };

    } catch (error) {
      console.error('Error en getDashboardReportes:', error);
      throw error;
    }
  }

  // Reporte de ventas por período
  async getReporteVentas(filtros = {}) {
    try {
      const { fechaInicio, fechaFin, emisorRuc, empresa_id, agruparPor = 'mes' } = filtros;

      let whereClause = 'WHERE 1=1';
      let params = [];

      // Aplicar filtro multi-tenant si existe empresa_id
      if (empresa_id !== undefined && empresa_id !== null) {
        whereClause += ' AND empresa_id = ?';
        params.push(empresa_id);
      }

      if (fechaInicio) {
        whereClause += ' AND fecha_factura >= ?';
        params.push(fechaInicio);
      }

      if (fechaFin) {
        whereClause += ' AND fecha_factura <= ?';
        params.push(fechaFin);
      }

      if (emisorRuc) {
        whereClause += ' AND emisor_ruc = ?';
        params.push(emisorRuc);
      }

      // Determinar formato de agrupación
      let formatoFecha;
      let labelFecha;
      
      switch (agruparPor) {
        case 'dia':
          formatoFecha = '%Y-%m-%d';
          labelFecha = 'fecha';
          break;
        case 'semana':
          formatoFecha = '%Y-%u';
          labelFecha = 'semana';
          break;
        case 'mes':
          formatoFecha = '%Y-%m';
          labelFecha = 'mes';
          break;
        case 'año':
          formatoFecha = '%Y';
          labelFecha = 'año';
          break;
        default:
          formatoFecha = '%Y-%m';
          labelFecha = 'mes';
      }

      const ventas = await executeQuery(`
        SELECT 
          DATE_FORMAT(fecha_factura, '${formatoFecha}') as ${labelFecha},
          COUNT(*) as total_facturas,
          SUM(subtotal) as total_subtotal,
          SUM(descuento) as total_descuento,
          SUM(itbms) as total_itbms,
          SUM(total) as total_ventas,
          AVG(total) as promedio_factura,
          MIN(total) as venta_minima,
          MAX(total) as venta_maxima,
          COUNT(DISTINCT emisor_ruc) as emisores_activos
        FROM facturas 
        ${whereClause}
        AND total > 0
        GROUP BY DATE_FORMAT(fecha_factura, '${formatoFecha}')
        ORDER BY ${labelFecha}
      `, params);

      // Calcular totales generales
      const [totales] = await executeQuery(`
        SELECT 
          COUNT(*) as total_facturas,
          SUM(subtotal) as total_subtotal,
          SUM(descuento) as total_descuento,
          SUM(itbms) as total_itbms,
          SUM(total) as total_ventas,
          AVG(total) as promedio_factura
        FROM facturas 
        ${whereClause}
        AND total > 0
      `, params);

      return {
        resumen: {
          total_facturas: totales.total_facturas,
          total_subtotal: parseFloat(totales.total_subtotal || 0),
          total_descuento: parseFloat(totales.total_descuento || 0),
          total_itbms: parseFloat(totales.total_itbms || 0),
          total_ventas: parseFloat(totales.total_ventas || 0),
          promedio_factura: parseFloat(totales.promedio_factura || 0)
        },
        detalle: ventas.map(venta => ({
          periodo: venta[labelFecha],
          total_facturas: venta.total_facturas,
          total_subtotal: parseFloat(venta.total_subtotal || 0),
          total_descuento: parseFloat(venta.total_descuento || 0),
          total_itbms: parseFloat(venta.total_itbms || 0),
          total_ventas: parseFloat(venta.total_ventas || 0),
          promedio_factura: parseFloat(venta.promedio_factura || 0),
          venta_minima: parseFloat(venta.venta_minima || 0),
          venta_maxima: parseFloat(venta.venta_maxima || 0),
          emisores_activos: venta.emisores_activos
        })),
        filtros: {
          fechaInicio,
          fechaFin,
          emisorRuc,
          agruparPor
        }
      };

    } catch (error) {
      console.error('Error en getReporteVentas:', error);
      throw error;
    }
  }

  // Reporte de ITBMS
  async getReporteITBMS(filtros = {}) {
    try {
      const { fechaInicio, fechaFin, emisorRuc, empresa_id } = filtros;

      let whereClause = 'WHERE itbms > 0';
      let params = [];

      // Aplicar filtro multi-tenant si existe empresa_id
      if (empresa_id !== undefined && empresa_id !== null) {
        whereClause += ' AND empresa_id = ?';
        params.push(empresa_id);
      }

      if (fechaInicio) {
        whereClause += ' AND fecha_factura >= ?';
        params.push(fechaInicio);
      }

      if (fechaFin) {
        whereClause += ' AND fecha_factura <= ?';
        params.push(fechaFin);
      }

      if (emisorRuc) {
        whereClause += ' AND emisor_ruc = ?';
        params.push(emisorRuc);
      }

      // Resumen general de ITBMS
      const [resumen] = await executeQuery(`
        SELECT 
          COUNT(*) as facturas_con_itbms,
          SUM(subtotal) as base_gravable,
          SUM(itbms) as total_itbms,
          AVG(itbms) as promedio_itbms,
          SUM(total) as total_con_itbms,
          AVG((itbms / subtotal) * 100) as tasa_promedio_itbms
        FROM facturas 
        ${whereClause}
        AND subtotal > 0
      `, params);

      // ITBMS por mes
      const itbmsPorMes = await executeQuery(`
        SELECT 
          DATE_FORMAT(fecha_factura, '%Y-%m') as mes,
          COUNT(*) as facturas,
          SUM(subtotal) as base_gravable,
          SUM(itbms) as total_itbms,
          AVG((itbms / subtotal) * 100) as tasa_promedio
        FROM facturas 
        ${whereClause}
        AND subtotal > 0
        GROUP BY DATE_FORMAT(fecha_factura, '%Y-%m')
        ORDER BY mes
      `, params);

      // ITBMS por emisor (top 20)
      const itbmsPorEmisor = await executeQuery(`
        SELECT 
          emisor_ruc,
          emisor_nombre,
          COUNT(*) as facturas,
          SUM(subtotal) as base_gravable,
          SUM(itbms) as total_itbms,
          AVG((itbms / subtotal) * 100) as tasa_promedio
        FROM facturas 
        ${whereClause}
        AND subtotal > 0
        AND emisor_nombre IS NOT NULL
        GROUP BY emisor_ruc, emisor_nombre
        ORDER BY total_itbms DESC
        LIMIT 20
      `, params);

      return {
        resumen: {
          facturas_con_itbms: resumen.facturas_con_itbms,
          base_gravable: parseFloat(resumen.base_gravable || 0),
          total_itbms: parseFloat(resumen.total_itbms || 0),
          promedio_itbms: parseFloat(resumen.promedio_itbms || 0),
          total_con_itbms: parseFloat(resumen.total_con_itbms || 0),
          tasa_promedio_itbms: parseFloat(resumen.tasa_promedio_itbms || 0)
        },
        por_mes: itbmsPorMes.map(row => ({
          mes: row.mes,
          facturas: row.facturas,
          base_gravable: parseFloat(row.base_gravable || 0),
          total_itbms: parseFloat(row.total_itbms || 0),
          tasa_promedio: parseFloat(row.tasa_promedio || 0)
        })),
        por_emisor: itbmsPorEmisor.map(row => ({
          emisor_ruc: row.emisor_ruc,
          emisor_nombre: row.emisor_nombre,
          facturas: row.facturas,
          base_gravable: parseFloat(row.base_gravable || 0),
          total_itbms: parseFloat(row.total_itbms || 0),
          tasa_promedio: parseFloat(row.tasa_promedio || 0)
        }))
      };

    } catch (error) {
      console.error('Error en getReporteITBMS:', error);
      throw error;
    }
  }

  // Reporte de performance del OCR
  async getReportePerformanceOCR(filtros = {}) {
    try {
      const { fechaInicio, fechaFin, empresa_id } = filtros;

      let whereClause = 'WHERE confianza_ocr IS NOT NULL';
      let params = [];

      // Aplicar filtro multi-tenant si existe empresa_id
      if (empresa_id !== undefined && empresa_id !== null) {
        whereClause += ' AND empresa_id = ?';
        params.push(empresa_id);
      }

      if (fechaInicio) {
        whereClause += ' AND created_at >= ?';
        params.push(fechaInicio);
      }

      if (fechaFin) {
        whereClause += ' AND created_at <= ?';
        params.push(fechaFin);
      }

      // Estadísticas generales
      const [estadisticas] = await executeQuery(`
        SELECT 
          COUNT(*) as total_procesadas,
          AVG(confianza_ocr) as confianza_promedio,
          MIN(confianza_ocr) as confianza_minima,
          MAX(confianza_ocr) as confianza_maxima,
          COUNT(CASE WHEN confianza_ocr >= 90 THEN 1 END) as alta_confianza,
          COUNT(CASE WHEN confianza_ocr >= 70 AND confianza_ocr < 90 THEN 1 END) as media_confianza,
          COUNT(CASE WHEN confianza_ocr < 70 THEN 1 END) as baja_confianza,
          COUNT(CASE WHEN estado = 'error' THEN 1 END) as errores_procesamiento
        FROM facturas 
        ${whereClause}
      `, params);

      // Tendencia de confianza por día
      const tendenciaDiaria = await executeQuery(`
        SELECT 
          DATE(created_at) as fecha,
          COUNT(*) as total_procesadas,
          AVG(confianza_ocr) as confianza_promedio,
          COUNT(CASE WHEN confianza_ocr >= 90 THEN 1 END) as alta_confianza,
          COUNT(CASE WHEN estado = 'error' THEN 1 END) as errores
        FROM facturas 
        ${whereClause}
        GROUP BY DATE(created_at)
        ORDER BY fecha
      `, params);

      // Performance por procesador
      const porProcesador = await executeQuery(`
        SELECT 
          procesado_por,
          COUNT(*) as total_procesadas,
          AVG(confianza_ocr) as confianza_promedio,
          COUNT(CASE WHEN confianza_ocr >= 90 THEN 1 END) as alta_confianza,
          COUNT(CASE WHEN estado = 'error' THEN 1 END) as errores
        FROM facturas 
        ${whereClause}
        GROUP BY procesado_por
        ORDER BY total_procesadas DESC
      `, params);

      return {
        estadisticas: {
          total_procesadas: estadisticas.total_procesadas,
          confianza_promedio: parseFloat(estadisticas.confianza_promedio || 0),
          confianza_minima: parseFloat(estadisticas.confianza_minima || 0),
          confianza_maxima: parseFloat(estadisticas.confianza_maxima || 0),
          alta_confianza: estadisticas.alta_confianza,
          media_confianza: estadisticas.media_confianza,
          baja_confianza: estadisticas.baja_confianza,
          errores_procesamiento: estadisticas.errores_procesamiento,
          tasa_exito: parseFloat(((estadisticas.total_procesadas - estadisticas.errores_procesamiento) / estadisticas.total_procesadas * 100) || 0)
        },
        tendencia_diaria: tendenciaDiaria.map(row => ({
          fecha: row.fecha,
          total_procesadas: row.total_procesadas,
          confianza_promedio: parseFloat(row.confianza_promedio || 0),
          alta_confianza: row.alta_confianza,
          errores: row.errores
        })),
        por_procesador: porProcesador.map(row => ({
          procesado_por: row.procesado_por,
          total_procesadas: row.total_procesadas,
          confianza_promedio: parseFloat(row.confianza_promedio || 0),
          alta_confianza: row.alta_confianza,
          errores: row.errores,
          tasa_exito: parseFloat(((row.total_procesadas - row.errores) / row.total_procesadas * 100) || 0)
        }))
      };

    } catch (error) {
      console.error('Error en getReportePerformanceOCR:', error);
      throw error;
    }
  }

  // Reporte de actividad de emisores
  async getReporteActividadEmisores(filtros = {}) {
    try {
      const { fechaInicio, fechaFin, empresa_id, limit = 50 } = filtros;

      let whereClause = 'WHERE emisor_ruc IS NOT NULL AND emisor_ruc != ""';
      let params = [];

      // Aplicar filtro multi-tenant si existe empresa_id
      if (empresa_id !== undefined && empresa_id !== null) {
        whereClause += ' AND empresa_id = ?';
        params.push(empresa_id);
      }

      if (fechaInicio) {
        whereClause += ' AND fecha_factura >= ?';
        params.push(fechaInicio);
      }

      if (fechaFin) {
        whereClause += ' AND fecha_factura <= ?';
        params.push(fechaFin);
      }

      // Análisis de emisores
      const actividadEmisores = await executeQuery(`
        SELECT 
          emisor_ruc,
          emisor_nombre,
          COUNT(*) as total_facturas,
          SUM(total) as monto_total,
          AVG(total) as promedio_factura,
          MIN(fecha_factura) as primera_factura,
          MAX(fecha_factura) as ultima_factura,
          DATEDIFF(MAX(fecha_factura), MIN(fecha_factura)) as dias_activo,
          COUNT(DISTINCT DATE(fecha_factura)) as dias_con_facturas,
          AVG(confianza_ocr) as confianza_promedio,
          COUNT(CASE WHEN estado = 'error' THEN 1 END) as facturas_error
        FROM facturas 
        ${whereClause}
        GROUP BY emisor_ruc, emisor_nombre
        HAVING total_facturas > 0
        ORDER BY total_facturas DESC
        LIMIT ?
      `, [...params, parseInt(limit)]);

      // Emisores nuevos (primera factura en el período)
      const emisoresNuevos = await executeQuery(`
        SELECT 
          emisor_ruc,
          emisor_nombre,
          MIN(fecha_factura) as primera_factura,
          COUNT(*) as facturas_periodo
        FROM facturas 
        WHERE emisor_ruc IS NOT NULL AND emisor_ruc != ""
        AND fecha_factura >= ?
        AND fecha_factura <= ?
        GROUP BY emisor_ruc, emisor_nombre
        HAVING MIN(fecha_factura) >= ?
        AND MIN(fecha_factura) <= ?
        ORDER BY primera_factura DESC
        LIMIT 20
      `, [...params, ...params]); // Duplicar parámetros para WHERE y HAVING

      return {
        actividad_emisores: actividadEmisores.map(row => ({
          emisor_ruc: row.emisor_ruc,
          emisor_nombre: row.emisor_nombre,
          total_facturas: row.total_facturas,
          monto_total: parseFloat(row.monto_total || 0),
          promedio_factura: parseFloat(row.promedio_factura || 0),
          primera_factura: row.primera_factura,
          ultima_factura: row.ultima_factura,
          dias_activo: row.dias_activo,
          dias_con_facturas: row.dias_con_facturas,
          frecuencia_facturacion: row.dias_activo > 0 ? parseFloat((row.dias_con_facturas / row.dias_activo * 100)) : 0,
          confianza_promedio: parseFloat(row.confianza_promedio || 0),
          facturas_error: row.facturas_error
        })),
        emisores_nuevos: emisoresNuevos.map(row => ({
          emisor_ruc: row.emisor_ruc,
          emisor_nombre: row.emisor_nombre,
          primera_factura: row.primera_factura,
          facturas_periodo: row.facturas_periodo
        }))
      };

    } catch (error) {
      console.error('Error en getReporteActividadEmisores:', error);
      throw error;
    }
  }

  // Exportar datos
  async exportarDatos(filtros) {
    try {
      const { tipo, formato, fechaInicio, fechaFin, emisorRuc, empresa_id } = filtros;

      let datos = [];

      switch (tipo) {
        case 'facturas':
          datos = await this.exportarFacturas({ fechaInicio, fechaFin, emisorRuc, empresa_id });
          break;
        case 'emisores':
          datos = await this.exportarEmisores({ fechaInicio, fechaFin, empresa_id });
          break;
        case 'ventas':
          const reporteVentas = await this.getReporteVentas({ fechaInicio, fechaFin, emisorRuc, empresa_id });
          datos = reporteVentas.detalle;
          break;
        case 'itbms':
          const reporteITBMS = await this.getReporteITBMS({ fechaInicio, fechaFin, emisorRuc, empresa_id });
          datos = reporteITBMS.por_emisor;
          break;
        default:
          throw new Error('Tipo de exportación no válido');
      }

      return {
        tipo,
        formato,
        cantidad_registros: datos.length,
        datos,
        generado_en: new Date().toISOString(),
        filtros: { fechaInicio, fechaFin, emisorRuc }
      };

    } catch (error) {
      console.error('Error en exportarDatos:', error);
      throw error;
    }
  }

  // Métodos auxiliares para exportación
  async exportarFacturas(filtros) {
    const { fechaInicio, fechaFin, emisorRuc, estado, empresa_id } = filtros;
    
    let whereClause = 'WHERE 1=1';
    let params = [];

    // Aplicar filtro multi-tenant si existe empresa_id
    if (empresa_id !== undefined && empresa_id !== null) {
      whereClause += ' AND empresa_id = ?';
      params.push(empresa_id);
    }

    if (fechaInicio) {
      whereClause += ' AND fecha_factura >= ?';
      params.push(fechaInicio);
    }

    if (fechaFin) {
      whereClause += ' AND fecha_factura <= ?';
      params.push(fechaFin);
    }

    if (emisorRuc) {
      whereClause += ' AND emisor_ruc = ?';
      params.push(emisorRuc);
    }

    if (estado) {
      whereClause += ' AND estado = ?';
      params.push(estado);
    }

    return await executeQuery(`
      SELECT 
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
        created_at
      FROM facturas 
      ${whereClause}
      ORDER BY fecha_factura DESC
    `, params);
  }

  async exportarEmisores(filtros) {
    const { fechaInicio, fechaFin, empresa_id } = filtros;
    
    let whereClause = 'WHERE emisor_ruc IS NOT NULL AND emisor_ruc != ""';
    let params = [];

    // Aplicar filtro multi-tenant si existe empresa_id
    if (empresa_id !== undefined && empresa_id !== null) {
      whereClause += ' AND empresa_id = ?';
      params.push(empresa_id);
    }

    if (fechaInicio) {
      whereClause += ' AND fecha_factura >= ?';
      params.push(fechaInicio);
    }

    if (fechaFin) {
      whereClause += ' AND fecha_factura <= ?';
      params.push(fechaFin);
    }

    return await executeQuery(`
      SELECT 
        emisor_ruc,
        emisor_nombre,
        emisor_direccion,
        emisor_telefono,
        COUNT(*) as total_facturas,
        SUM(total) as monto_total,
        AVG(total) as promedio_factura,
        MIN(fecha_factura) as primera_factura,
        MAX(fecha_factura) as ultima_factura
      FROM facturas 
      ${whereClause}
      GROUP BY emisor_ruc, emisor_nombre, emisor_direccion, emisor_telefono
      ORDER BY total_facturas DESC
    `, params);
  }
}

module.exports = new ReporteService();