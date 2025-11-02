const empresaService = require('../services/empresaService');
const Joi = require('joi');

class EmpresaController {
  // Obtener lista de empresas
  async getEmpresas(req, res, next) {
    try {
      const schema = Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(25),
        search: Joi.string().max(200).optional(),
        activo: Joi.boolean().optional(),
        plan: Joi.string().max(50).optional(),
        sortBy: Joi.string().valid('nombre', 'ruc', 'created_at', 'updated_at', 'plan').default('created_at'),
        sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC')
      });

      const { error, value } = schema.validate(req.query);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      const result = await empresaService.getEmpresas(value);

      res.json({
        success: true,
        data: result.empresas,
        pagination: result.pagination,
        filtros: value
      });

    } catch (error) {
      next(error);
    }
  }

  // Obtener empresa por ID
  async getEmpresaById(req, res, next) {
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

      const empresa = await empresaService.getEmpresaById(value.id);

      res.json({
        success: true,
        data: empresa
      });

    } catch (error) {
      if (error.message === 'Empresa no encontrada') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }

  // Obtener empresa por RUC
  async getEmpresaByRuc(req, res, next) {
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

      const empresa = await empresaService.getEmpresaByRuc(value.ruc);

      res.json({
        success: true,
        data: empresa
      });

    } catch (error) {
      if (error.message === 'Empresa no encontrada') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }

  // Crear nueva empresa
  async createEmpresa(req, res, next) {
    try {
      const schema = Joi.object({
        nombre: Joi.string().min(2).max(255).required().messages({
          'string.min': 'El nombre debe tener al menos 2 caracteres',
          'any.required': 'El nombre es requerido'
        }),
        ruc: Joi.string().min(8).max(50).required().messages({
          'string.min': 'El RUC debe tener al menos 8 caracteres',
          'any.required': 'El RUC es requerido'
        }),
        email_procesamiento: Joi.string().email().required().messages({
          'string.email': 'Formato de email inválido',
          'any.required': 'El email de procesamiento es requerido'
        }),
        direccion: Joi.string().max(500).optional().allow(null, ''),
        telefono: Joi.string().max(50).optional().allow(null, ''),
        plan: Joi.string().max(50).default('basico').optional()
      });

      const { error, value } = schema.validate(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      const nuevaEmpresa = await empresaService.createEmpresa(value);

      res.status(201).json({
        success: true,
        message: 'Empresa creada exitosamente',
        data: nuevaEmpresa
      });

    } catch (error) {
      if (error.message === 'El RUC ya está registrado' || 
          error.message === 'El email de procesamiento ya está registrado') {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }

  // Actualizar empresa
  async updateEmpresa(req, res, next) {
    try {
      const paramsSchema = Joi.object({
        id: Joi.number().integer().positive().required()
      });

      const bodySchema = Joi.object({
        nombre: Joi.string().min(2).max(255).optional(),
        ruc: Joi.string().min(8).max(50).optional(),
        email_procesamiento: Joi.string().email().optional(),
        direccion: Joi.string().max(500).optional().allow(null, ''),
        telefono: Joi.string().max(50).optional().allow(null, ''),
        activo: Joi.boolean().optional(),
        plan: Joi.string().max(50).optional()
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

      if (Object.keys(bodyValue).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Debe proporcionar al menos un campo para actualizar'
        });
      }

      const empresaActualizada = await empresaService.updateEmpresa(paramsValue.id, bodyValue);

      res.json({
        success: true,
        message: 'Empresa actualizada exitosamente',
        data: empresaActualizada
      });

    } catch (error) {
      if (error.message === 'Empresa no encontrada') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      if (error.message === 'El RUC ya está registrado en otra empresa' ||
          error.message === 'El email de procesamiento ya está registrado en otra empresa') {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }

  // Obtener usuarios de una empresa
  async getUsuariosByEmpresa(req, res, next) {
    try {
      const paramsSchema = Joi.object({
        id: Joi.number().integer().positive().required()
      });

      const querySchema = Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(25),
        activo: Joi.boolean().optional(),
        rol: Joi.string().valid('admin', 'usuario', 'auditor').optional(),
        search: Joi.string().max(200).optional()
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

      const result = await empresaService.getUsuariosByEmpresa(paramsValue.id, queryValue);

      res.json({
        success: true,
        data: result.usuarios,
        empresa: result.empresa,
        pagination: result.pagination,
        filtros: queryValue
      });

    } catch (error) {
      if (error.message === 'Empresa no encontrada') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }

  // Contar empresas
  async countEmpresas(req, res, next) {
    try {
      const schema = Joi.object({
        activo: Joi.boolean().optional(),
        plan: Joi.string().max(50).optional()
      });

      const { error, value } = schema.validate(req.query);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      const result = await empresaService.countEmpresas(value);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EmpresaController();

