const reporteService = require('../services/reporteService');
const Joi = require('joi');

// Función auxiliar para convertir datos a CSV
function convertToCSV(data) {
  if (!data || !Array.isArray(data)) {
    return '';
  }
  
  if (data.length === 0) {
    return '';
  }
  
  // Obtener headers del primer objeto
  const headers = Object.keys(data[0]);
  
  // Crear línea de headers
  const headerRow = headers.join(',');
  
  // Crear líneas de datos
  const dataRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      // Escapar comillas y envolver en comillas si contiene coma
      const escapedValue = String(value).replace(/"/g, '""');
      return escapedValue.includes(',') ? `"${escapedValue}"` : escapedValue;
    }).join(',');
  });
  
  return [headerRow, ...dataRows].join('\n');
}

class ReporteController {
  // Reporte de dashboard
  async getDashboardReportes(req, res, next) {
    try {
      const schema = Joi.object({
        fechaInicio: Joi.date().iso().optional(),
        fechaFin: Joi.date().iso().min(Joi.ref('fechaInicio')).optional(),
        emisorRuc: Joi.string().max(50).optional()
      });

      const { error, value } = schema.validate(req.query);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      // Aplicar filtro multi-tenant desde middleware
      if (req.empresaFilter && req.empresaFilter.empresa_id !== undefined) {
        value.empresa_id = req.empresaFilter.empresa_id;
      }
      const reporte = await reporteService.getDashboardReportes(value);

      res.json({
        success: true,
        data: reporte
      });

    } catch (error) {
      next(error);
    }
  }

  // Reporte de ventas
  async getReporteVentas(req, res, next) {
    try {
      const schema = Joi.object({
        fechaInicio: Joi.date().iso().optional(),
        fechaFin: Joi.date().iso().min(Joi.ref('fechaInicio')).optional(),
        emisorRuc: Joi.string().max(50).optional(),
        agruparPor: Joi.string().valid('dia', 'semana', 'mes', 'año').default('mes'),
        formato: Joi.string().valid('json', 'csv', 'excel').default('json')
      });

      const { error, value } = schema.validate(req.query);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      // Aplicar filtro multi-tenant desde middleware
      if (req.empresaFilter && req.empresaFilter.empresa_id !== undefined) {
        value.empresa_id = req.empresaFilter.empresa_id;
      }
      const reporte = await reporteService.getReporteVentas(value);

      // Manejar diferentes formatos de respuesta
      if (value.formato === 'csv') {
        // Configurar headers para descarga CSV
        const filename = `reporte_ventas_${new Date().toISOString().split('T')[0]}.csv`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        // Convertir datos a CSV (implementación básica)
        const csvData = convertToCSV(reporte);
        return res.send(csvData);
      } else if (value.formato === 'excel') {
        // Configurar headers para descarga Excel
        const filename = `reporte_ventas_${new Date().toISOString().split('T')[0]}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        // Para Excel necesitaríamos una librería como xlsx
        return res.json({
          success: true,
          message: 'Formato Excel no implementado aún',
          data: reporte
        });
      } else {
        // Formato JSON (por defecto)
        res.json({
          success: true,
          data: reporte,
          formato: value.formato
        });
      }

    } catch (error) {
      next(error);
    }
  }

  // Reporte de ITBMS
  async getReporteITBMS(req, res, next) {
    try {
      const schema = Joi.object({
        fechaInicio: Joi.date().iso().optional(),
        fechaFin: Joi.date().iso().min(Joi.ref('fechaInicio')).optional(),
        emisorRuc: Joi.string().max(50).optional(),
        mes: Joi.number().integer().min(1).max(12).optional(),
        año: Joi.number().integer().min(2000).max(2100).optional(),
        formato: Joi.string().valid('json', 'csv', 'excel').default('json')
      });

      const { error, value } = schema.validate(req.query);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      // Si se proporcionan mes y año, calcular las fechas
      if (value.mes && value.año) {
        const fechaInicio = new Date(value.año, value.mes - 1, 1);
        const fechaFin = new Date(value.año, value.mes, 0); // Último día del mes
        
        value.fechaInicio = fechaInicio.toISOString().split('T')[0];
        value.fechaFin = fechaFin.toISOString().split('T')[0];
      }

      // Aplicar filtro multi-tenant desde middleware
      if (req.empresaFilter && req.empresaFilter.empresa_id !== undefined) {
        value.empresa_id = req.empresaFilter.empresa_id;
      }
      const reporte = await reporteService.getReporteITBMS(value);

      // Manejar diferentes formatos de respuesta
      if (value.formato === 'csv') {
        // Configurar headers para descarga CSV
        const filename = `reporte_itbms_${new Date().toISOString().split('T')[0]}.csv`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        // Convertir datos a CSV
        const csvData = convertToCSV(reporte);
        return res.send(csvData);
      } else if (value.formato === 'excel') {
        // Configurar headers para descarga Excel
        const filename = `reporte_itbms_${new Date().toISOString().split('T')[0]}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        // Para Excel necesitaríamos una librería como xlsx
        return res.json({
          success: true,
          message: 'Formato Excel no implementado aún',
          data: reporte
        });
      } else {
        // Formato JSON (por defecto)
        res.json({
          success: true,
          data: reporte,
          formato: value.formato,
          filtros: {
            mes: value.mes,
            año: value.año,
            fechaInicio: value.fechaInicio,
            fechaFin: value.fechaFin
          }
        });
      }

    } catch (error) {
      next(error);
    }
  }

  // Reporte de performance OCR
  async getReportePerformanceOCR(req, res, next) {
    try {
      const schema = Joi.object({
        fechaInicio: Joi.date().iso().optional(),
        fechaFin: Joi.date().iso().min(Joi.ref('fechaInicio')).optional(),
        emisorRuc: Joi.string().max(50).optional()
      });

      const { error, value } = schema.validate(req.query);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      // Aplicar filtro multi-tenant desde middleware
      if (req.empresaFilter && req.empresaFilter.empresa_id !== undefined) {
        value.empresa_id = req.empresaFilter.empresa_id;
      }
      const reporte = await reporteService.getReportePerformanceOCR(value);

      res.json({
        success: true,
        data: reporte
      });

    } catch (error) {
      next(error);
    }
  }

  // Reporte de actividad de emisores
  async getReporteActividadEmisores(req, res, next) {
    try {
      const schema = Joi.object({
        fechaInicio: Joi.date().iso().optional(),
        fechaFin: Joi.date().iso().min(Joi.ref('fechaInicio')).optional(),
        periodo: Joi.number().integer().min(1).max(365).default(30),
        limit: Joi.number().integer().min(1).max(100).default(20),
        formato: Joi.string().valid('json', 'csv', 'excel').default('json')
      });

      const { error, value } = schema.validate(req.query);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      // Si se proporciona periodo, calcular las fechas
      if (value.periodo && !value.fechaInicio && !value.fechaFin) {
        const fechaFin = new Date();
        const fechaInicio = new Date();
        fechaInicio.setDate(fechaInicio.getDate() - value.periodo);
        
        value.fechaInicio = fechaInicio.toISOString().split('T')[0];
        value.fechaFin = fechaFin.toISOString().split('T')[0];
      }

      // Aplicar filtro multi-tenant desde middleware
      if (req.empresaFilter && req.empresaFilter.empresa_id !== undefined) {
        value.empresa_id = req.empresaFilter.empresa_id;
      }
      const reporte = await reporteService.getReporteActividadEmisores(value);

      // Manejar diferentes formatos de respuesta
      if (value.formato === 'csv') {
        // Configurar headers para descarga CSV
        const filename = `reporte_actividad_emisores_${new Date().toISOString().split('T')[0]}.csv`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        // Convertir datos a CSV
        const csvData = convertToCSV(reporte);
        return res.send(csvData);
      } else if (value.formato === 'excel') {
        // Configurar headers para descarga Excel
        const filename = `reporte_actividad_emisores_${new Date().toISOString().split('T')[0]}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        // Para Excel necesitaríamos una librería como xlsx
        return res.json({
          success: true,
          message: 'Formato Excel no implementado aún',
          data: reporte
        });
      } else {
        // Formato JSON (por defecto)
        res.json({
          success: true,
          data: reporte,
          formato: value.formato,
          filtros: {
            periodo: value.periodo,
            fechaInicio: value.fechaInicio,
            fechaFin: value.fechaFin,
            limit: value.limit
          }
        });
      }

    } catch (error) {
      next(error);
    }
  }

  // Exportar datos
  async exportarDatos(req, res, next) {
    try {
      const schema = Joi.object({
        tipo: Joi.string().valid('facturas', 'ventas', 'emisores', 'itbms').required(),
        formato: Joi.string().valid('csv', 'excel', 'json').default('csv'),
        fechaInicio: Joi.date().iso().optional(),
        fechaFin: Joi.date().iso().min(Joi.ref('fechaInicio')).optional(),
        emisorRuc: Joi.string().max(50).optional()
      });

      const { error, value } = schema.validate(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      // Aplicar filtro multi-tenant desde middleware
      if (req.empresaFilter && req.empresaFilter.empresa_id !== undefined) {
        value.empresa_id = req.empresaFilter.empresa_id;
      }
      const resultado = await reporteService.exportarDatos(value);

      // Configurar headers para descarga
      const filename = `reporte_${value.tipo}_${new Date().toISOString().split('T')[0]}.${value.formato}`;
      
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      res.json({
        success: true,
        message: 'Datos exportados correctamente',
        data: resultado
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReporteController();