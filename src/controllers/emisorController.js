const emisorService = require('../services/emisorService');
const Joi = require('joi');

class EmisorController {
  // Obtener lista de emisores
  async getEmisores(req, res, next) {
    try {
      const schema = Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(25),
        search: Joi.string().max(200).optional(),
        sortBy: Joi.string().valid('total_facturas', 'monto_total', 'emisor_nombre', 'ultima_factura').default('total_facturas'),
        sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC')
      });

      const { error, value } = schema.validate(req.query);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      const result = await emisorService.getEmisores(value);

      res.json({
        success: true,
        data: result.emisores,
        pagination: result.pagination,
        filtros: value
      });

    } catch (error) {
      next(error);
    }
  }

  // Obtener emisor por RUC
  async getEmisorByRuc(req, res, next) {
    try {
      const schema = Joi.object({
        ruc: Joi.string().max(50).required()
      });

      const { error, value } = schema.validate(req.params);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      const emisor = await emisorService.getEmisorByRuc(value.ruc);

      res.json({
        success: true,
        data: emisor
      });

    } catch (error) {
      if (error.message === 'Emisor no encontrado') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }

  // Obtener facturas de un emisor
  async getFacturasByEmisor(req, res, next) {
    try {
      const paramsSchema = Joi.object({
        ruc: Joi.string().max(50).required()
      });

      const querySchema = Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(25),
        estado: Joi.string().valid('pendiente', 'procesado', 'error', 'revision').optional(),
        fechaInicio: Joi.date().iso().optional(),
        fechaFin: Joi.date().iso().min(Joi.ref('fechaInicio')).optional(),
        sortBy: Joi.string().valid('fecha_factura', 'total', 'numero_factura', 'created_at').default('fecha_factura'),
        sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC')
      });

      const { error: paramsError, value: paramsValue } = paramsSchema.validate(req.params);
      const { error: queryError, value: queryValue } = querySchema.validate(req.query);
      
      if (paramsError) {
        return res.status(400).json({
          success: false,
          message: paramsError.details[0].message
        });
      }

      if (queryError) {
        return res.status(400).json({
          success: false,
          message: queryError.details[0].message
        });
      }

      const result = await emisorService.getFacturasByEmisor(paramsValue.ruc, queryValue);

      res.json({
        success: true,
        data: result.facturas,
        pagination: result.pagination,
        emisor_ruc: paramsValue.ruc,
        filtros: queryValue
      });

    } catch (error) {
      next(error);
    }
  }

  // Obtener top emisores
  async getTopEmisores(req, res, next) {
    try {
      const schema = Joi.object({
        metric: Joi.string().valid('facturas', 'monto', 'promedio').default('facturas'),
        metrica: Joi.string().valid('total_facturas', 'monto_total', 'promedio_factura').default('total_facturas'),
        limit: Joi.number().integer().min(1).max(50).default(10)
      });

      const { error, value } = schema.validate(req.query);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      // Mapear metric a metrica para compatibilidad
      const metrica = value.metric === 'facturas' ? 'total_facturas' : 
                     value.metric === 'monto' ? 'monto_total' : 
                     value.metric === 'promedio' ? 'promedio_factura' : 
                     value.metrica;

      const emisores = await emisorService.getTopEmisores(metrica, value.limit);

      res.json({
        success: true,
        data: emisores,
        metric: value.metric || 'facturas',
        metrica: metrica,
        limit: value.limit
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EmisorController();