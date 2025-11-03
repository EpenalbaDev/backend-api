const adminService = require('../services/adminService');
const Joi = require('joi');

class AdminController {
  // Obtener todas las empresas (super admin only)
  async getTodasEmpresas(req, res, next) {
    try {
      const schema = Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(25),
        search: Joi.string().max(200).optional(),
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

      const result = await adminService.getTodasEmpresas(value);

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

  // Obtener estadísticas globales (super admin only)
  async getEstadisticasGlobales(req, res, next) {
    try {
      const estadisticas = await adminService.getEstadisticasGlobales();

      res.json({
        success: true,
        data: estadisticas
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();

