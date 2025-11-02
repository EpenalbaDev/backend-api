const { executeQuery } = require('../config/database');

class DashboardService {
  // Obtener métricas generales (overview)
  async getOverview() {
    try {
      // Métricas principales
      const [totalFacturas] = await executeQuery(`
        SELECT COUNT(*) as count FROM facturas
      `);

      const [facturasMesActual] = await executeQuery(`
        SELECT COUNT(*) as count FROM facturas 
        WHERE MONTH(fecha_factura) = MONTH(CURRENT_DATE()) 
        AND YEAR(fecha_factura) = YEAR(CURRENT_DATE())
      `);

      const [totalMonto] = await executeQuery(`
        SELECT COALESCE(SUM(total), 0) as sum FROM facturas
      `);

      const [montoMesActual] = await executeQuery(`
        SELECT COALESCE(SUM(total), 0) as sum FROM facturas 
        WHERE MONTH(fecha_factura) = MONTH(CURRENT_DATE()) 
        AND YEAR(fecha_factura) = YEAR(CURRENT_DATE())
      `);

      const [promedioFactura] = await executeQuery(`
        SELECT COALESCE(AVG(total), 0) as avg FROM facturas WHERE total > 0
      `);

      const [facturasPorEstado] = await executeQuery(`
        SELECT 
          COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as pendientes,
          COUNT(CASE WHEN estado = 'procesado' THEN 1 END) as procesadas,
          COUNT(CASE WHEN estado = 'error' THEN 1 END) as errores,
          COUNT(CASE WHEN estado = 'revisado' THEN 1 END) as revisadas
        FROM facturas
      `);

      const [confianzaPromedio] = await executeQuery(`
        SELECT COALESCE(AVG(confianza_ocr), 0) as avg FROM facturas WHERE confianza_ocr IS NOT NULL
      `);

      const [emisoresActivos] = await executeQuery(`
        SELECT COUNT(DISTINCT emisor_ruc) as count FROM facturas 
        WHERE emisor_ruc IS NOT NULL AND emisor_ruc != ''
      `);

      // Calcular alertas
      const alertas = await this.getAlertas();

      return {
        total_facturas: totalFacturas.count,
        facturas_mes_actual: facturasMesActual.count,
        total_monto: parseFloat(totalMonto.sum),
        monto_mes_actual: parseFloat(montoMesActual.sum),
        promedio_factura: parseFloat(promedioFactura.avg),
        facturas_pendientes: facturasPorEstado.pendientes,
        facturas_procesadas: facturasPorEstado.procesadas,
        facturas_error: facturasPorEstado.errores,
        facturas_revisadas: facturasPorEstado.revisadas,
        confianza_ocr_promedio: parseFloat(confianzaPromedio.avg),
        emisores_activos: emisoresActivos.count,
        alertas
      };

    } catch (error) {
      console.error('Error en getOverview:', error);
      throw error;
    }
  }

  // Obtener alertas del sistema
  async getAlertas() {
    const alertas = [];

    try {
      // Facturas con baja confianza OCR (< 80%)
      const [bajaConfianza] = await executeQuery(`
        SELECT COUNT(*) as count FROM facturas 
        WHERE confianza_ocr < 80 AND estado = 'pendiente'
      `);

      if (bajaConfianza.count > 0) {
        alertas.push({
          tipo: 'baja_confianza',
          cantidad: bajaConfianza.count,
          mensaje: `${bajaConfianza.count} facturas con baja confianza OCR`,
          severidad: 'warning'
        });
      }

      // Facturas en error
      const [facturesError] = await executeQuery(`
        SELECT COUNT(*) as count FROM facturas WHERE estado = 'error'
      `);

      if (facturesError.count > 0) {
        alertas.push({
          tipo: 'facturas_error',
          cantidad: facturesError.count,
          mensaje: `${facturesError.count} facturas con errores de procesamiento`,
          severidad: 'error'
        });
      }

      // Facturas pendientes por más de 24 horas
      const [facturasPendientes] = await executeQuery(`
        SELECT COUNT(*) as count FROM facturas 
        WHERE estado = 'pendiente' AND created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)
      `);

      if (facturasPendientes.count > 0) {
        alertas.push({
          tipo: 'pendientes_antiguas',
          cantidad: facturasPendientes.count,
          mensaje: `${facturasPendientes.count} facturas pendientes por más de 24 horas`,
          severidad: 'info'
        });
      }

      return alertas;

    } catch (error) {
      console.error('Error obteniendo alertas:', error);
      return [];
    }
  }

  // Obtener datos para gráficos
  async getCharts() {
    try {
      // Facturas por mes (últimos 12 meses)
      const facturasPorMes = await executeQuery(`
        SELECT 
          DATE_FORMAT(fecha_factura, '%Y-%m') as mes,
          COUNT(*) as cantidad,
          SUM(total) as monto_total
        FROM facturas 
        WHERE fecha_factura >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(fecha_factura, '%Y-%m')
        ORDER BY mes
      `);

      // Top 10 emisores por volumen
      const topEmisores = await executeQuery(`
        SELECT 
          emisor_nombre,
          emisor_ruc,
          COUNT(*) as cantidad_facturas,
          SUM(total) as monto_total
        FROM facturas 
        WHERE emisor_nombre IS NOT NULL AND emisor_nombre != ''
        GROUP BY emisor_ruc, emisor_nombre
        ORDER BY cantidad_facturas DESC
        LIMIT 10
      `);

      // Distribución por estado
      const distribucionEstado = await executeQuery(`
        SELECT 
          estado,
          COUNT(*) as cantidad,
          ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM facturas)), 2) as porcentaje
        FROM facturas 
        GROUP BY estado
      `);

      // Actividad por día de la semana
      const actividadSemanal = await executeQuery(`
        SELECT 
          DAYNAME(created_at) as dia,
          DAYOFWEEK(created_at) as dia_num,
          COUNT(*) as cantidad
        FROM facturas 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DAYOFWEEK(created_at), DAYNAME(created_at)
        ORDER BY dia_num
      `);

      // Tendencia de confianza OCR
      const tendenciaOCR = await executeQuery(`
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m-%d') as fecha,
          AVG(confianza_ocr) as confianza_promedio,
          COUNT(*) as total_facturas
        FROM facturas 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
        AND confianza_ocr IS NOT NULL
        GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
        ORDER BY fecha
      `);

      return {
        facturas_por_mes: facturasPorMes.map(row => ({
          mes: row.mes,
          cantidad: row.cantidad,
          monto_total: parseFloat(row.monto_total || 0)
        })),
        top_emisores: topEmisores.map(row => ({
          emisor: row.emisor_nombre,
          ruc: row.emisor_ruc,
          cantidad: row.cantidad_facturas,
          monto: parseFloat(row.monto_total || 0)
        })),
        distribucion_estado: distribucionEstado.map(row => ({
          estado: row.estado,
          cantidad: row.cantidad,
          porcentaje: parseFloat(row.porcentaje)
        })),
        actividad_semanal: actividadSemanal.map(row => ({
          dia: row.dia,
          cantidad: row.cantidad
        })),
        tendencia_ocr: tendenciaOCR.map(row => ({
          fecha: row.fecha,
          confianza: parseFloat(row.confianza_promedio || 0),
          total: row.total_facturas
        }))
      };

    } catch (error) {
      console.error('Error en getCharts:', error);
      throw error;
    }
  }

  // Obtener métricas específicas con filtros
  async getMetrics(filtros = {}) {
    try {
      const { fechaInicio, fechaFin, emisorRuc } = filtros;
      
      let whereClause = 'WHERE 1=1';
      let params = [];

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

      // Métricas con filtros aplicados
      const metrics = await executeQuery(`
        SELECT 
          COUNT(*) as total_facturas,
          SUM(total) as monto_total,
          AVG(total) as promedio_factura,
          MIN(total) as monto_minimo,
          MAX(total) as monto_maximo,
          SUM(itbms) as total_itbms,
          AVG(confianza_ocr) as confianza_promedio,
          COUNT(DISTINCT emisor_ruc) as emisores_unicos
        FROM facturas ${whereClause}
      `, params);

      return {
        ...metrics[0],
        monto_total: parseFloat(metrics[0].monto_total || 0),
        promedio_factura: parseFloat(metrics[0].promedio_factura || 0),
        monto_minimo: parseFloat(metrics[0].monto_minimo || 0),
        monto_maximo: parseFloat(metrics[0].monto_maximo || 0),
        total_itbms: parseFloat(metrics[0].total_itbms || 0),
        confianza_promedio: parseFloat(metrics[0].confianza_promedio || 0)
      };

    } catch (error) {
      console.error('Error en getMetrics:', error);
      throw error;
    }
  }

  // Obtener estadísticas de rendimiento del sistema
  async getPerformanceStats() {
    try {
      // Tiempo promedio de procesamiento (simulado basado en logs)
      const processingStats = await executeQuery(`
        SELECT 
          AVG(TIMESTAMPDIFF(MINUTE, created_at, updated_at)) as tiempo_promedio_minutos,
          COUNT(*) as total_procesadas
        FROM facturas 
        WHERE estado IN ('procesado', 'revisado') 
        AND updated_at > created_at
      `);

      // Errores por día (últimos 7 días)
      const erroresPorDia = await executeQuery(`
        SELECT 
          DATE(created_at) as fecha,
          COUNT(*) as errores
        FROM procesamiento_logs 
        WHERE tipo_evento IN ('error', 'procesamiento_error') 
        AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at)
        ORDER BY fecha
      `);

      return {
        tiempo_promedio_procesamiento: parseFloat(processingStats[0]?.tiempo_promedio_minutos || 0),
        total_procesadas: processingStats[0]?.total_procesadas || 0,
        errores_por_dia: erroresPorDia.map(row => ({
          fecha: row.fecha,
          errores: row.errores
        }))
      };

    } catch (error) {
      console.error('Error en getPerformanceStats:', error);
      throw error;
    }
  }
}

module.exports = new DashboardService();