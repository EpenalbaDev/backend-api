const facturaService = require('../services/facturaService');
const Joi = require('joi');

class FacturaController {
  // Obtener lista de facturas con filtros
  async getFacturas(req, res, next) {
    try {
      // Validar parámetros de query
      const schema = Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(25),
        search: Joi.string().max(200).optional(),
        estado: Joi.string().valid('pendiente', 'procesado', 'error', 'revision').optional(),
        emisorRuc: Joi.string().max(50).optional(),
        fechaInicio: Joi.date().iso().optional(),
        fechaFin: Joi.date().iso().min(Joi.ref('fechaInicio')).optional(),
        montoMin: Joi.number().min(0).optional(),
        montoMax: Joi.number().min(Joi.ref('montoMin')).optional(),
        confianzaMin: Joi.number().min(0).max(100).optional(),
        sortBy: Joi.string().valid('created_at', 'fecha_factura', 'total', 'numero_factura', 'emisor_nombre', 'confianza_ocr').default('created_at'),
        sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC')
      });

      const { error, value } = schema.validate(req.query);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      const result = await facturaService.getFacturas(value);

      res.json({
        success: true,
        data: result.facturas,
        pagination: result.pagination,
        filtros: value
      });

    } catch (error) {
      next(error);
    }
  }

  // Obtener factura por ID
  async getFacturaById(req, res, next) {
    try {
      const schema = Joi.object({
        id: Joi.number().integer().positive().required()
      });

      const { error, value } = schema.validate(req.params);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      const factura = await facturaService.getFacturaById(value.id);

      res.json({
        success: true,
        data: factura
      });

    } catch (error) {
      if (error.message === 'Factura no encontrada') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }

  // Actualizar estado de factura
  async updateEstado(req, res, next) {
    try {
      const paramsSchema = Joi.object({
        id: Joi.number().integer().positive().required()
      });

      const bodySchema = Joi.object({
        estado: Joi.string().valid('pendiente', 'procesado', 'error', 'revision').required().messages({
          'any.only': 'Estado debe ser: pendiente, procesado, error o revision'
        }),
        comentario: Joi.string().max(500).optional().messages({
          'string.max': 'El comentario no puede exceder 500 caracteres'
        })
      });

      const { error: paramsError, value: paramsValue } = paramsSchema.validate(req.params);
      const { error: bodyError, value: bodyValue } = bodySchema.validate(req.body);
      
      if (paramsError) {
        return res.status(400).json({
          success: false,
          message: paramsError.details[0].message
        });
      }

      if (bodyError) {
        return res.status(400).json({
          success: false,
          message: bodyError.details[0].message
        });
      }

      const result = await facturaService.updateEstado(
        paramsValue.id, 
        bodyValue.estado, 
        req.user.id,
        bodyValue.comentario
      );

      res.json({
        success: true,
        message: 'Estado actualizado correctamente',
        data: result
      });

    } catch (error) {
      if (error.message === 'Factura no encontrada') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }

  // Obtener items de una factura
  async getFacturaItems(req, res, next) {
    try {
      const schema = Joi.object({
        id: Joi.number().integer().positive().required()
      });

      const { error, value } = schema.validate(req.params);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      const items = await facturaService.getFacturaItems(value.id);

      res.json({
        success: true,
        data: items
      });

    } catch (error) {
      next(error);
    }
  }

  // Obtener archivos de una factura
  async getFacturaArchivos(req, res, next) {
    try {
      const schema = Joi.object({
        id: Joi.number().integer().positive().required()
      });

      const { error, value } = schema.validate(req.params);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      const archivos = await facturaService.getFacturaArchivos(value.id);

      res.json({
        success: true,
        data: archivos
      });

    } catch (error) {
      next(error);
    }
  }

  // Eliminar factura
  async deleteFactura(req, res, next) {
    try {
      const schema = Joi.object({
        id: Joi.number().integer().positive().required()
      });

      const { error, value } = schema.validate(req.params);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      await facturaService.deleteFactura(value.id, req.user.id);

      res.json({
        success: true,
        message: 'Factura eliminada correctamente'
      });

    } catch (error) {
      if (error.message === 'Factura no encontrada') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }

  // Búsqueda avanzada
  async searchFacturas(req, res, next) {
    try {
      const schema = Joi.object({
        search: Joi.string().min(2).max(200).optional(),
        q: Joi.string().min(2).max(200).optional(),
        limit: Joi.number().integer().min(1).max(50).default(20),
        estado: Joi.string().valid('pendiente', 'procesado', 'error', 'revision').optional(),
        emisorRuc: Joi.string().max(50).optional(),
        page: Joi.number().integer().min(1).default(1)
      });

      const { error, value } = schema.validate(req.query);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      // Usar 'search' o 'q' como parámetro de búsqueda
      const searchTerm = value.search || value.q;
      
      if (!searchTerm) {
        return res.status(400).json({
          success: false,
          message: 'Parámetro de búsqueda requerido (search o q)'
        });
      }

      const { search, q, ...filtros } = value;
      const result = await facturaService.searchFacturas(searchTerm, filtros);

      res.json({
        success: true,
        data: result.facturas,
        pagination: result.pagination,
        query: searchTerm,
        resultados: result.facturas.length
      });

    } catch (error) {
      next(error);
    }
  }

  // Obtener sugerencias para búsqueda
  async getSuggestions(req, res, next) {
    try {
      const schema = Joi.object({
        q: Joi.string().min(1).max(100).optional(),
        search: Joi.string().min(1).max(100).optional()
      });

      const { error, value } = schema.validate(req.query);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      // Usar 'search' o 'q' como parámetro de búsqueda
      const searchTerm = value.search || value.q;
      
      if (!searchTerm) {
        return res.status(400).json({
          success: false,
          message: 'Parámetro de búsqueda requerido (search o q)'
        });
      }

      const suggestions = await facturaService.getSuggestions(searchTerm);

      res.json({
        success: true,
        data: suggestions
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FacturaController();