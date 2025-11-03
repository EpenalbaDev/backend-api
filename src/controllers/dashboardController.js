const dashboardService = require('../services/dashboardService');
const Joi = require('joi');

class DashboardController {
  // Obtener overview general del dashboard
  async getOverview(req, res, next) {
    try {
      // Aplicar filtro multi-tenant desde middleware
      const filtros = {};
      if (req.empresaFilter && req.empresaFilter.empresa_id !== undefined) {
        filtros.empresa_id = req.empresaFilter.empresa_id;
      }
      const overview = await dashboardService.getOverview(filtros);

      res.json({
        success: true,
        data: overview
      });

    } catch (error) {
      next(error);
    }
  }

  // Obtener métricas con filtros opcionales
  async getMetrics(req, res, next) {
    try {
      // Validar parámetros de query
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
      const metrics = await dashboardService.getMetrics(value);

      res.json({
        success: true,
        data: metrics,
        filtros: value
      });

    } catch (error) {
      next(error);
    }
  }

  // Obtener datos para gráficos
  async getCharts(req, res, next) {
    try {
      // Aplicar filtro multi-tenant desde middleware
      const filtros = {};
      if (req.empresaFilter && req.empresaFilter.empresa_id !== undefined) {
        filtros.empresa_id = req.empresaFilter.empresa_id;
      }
      const charts = await dashboardService.getCharts(filtros);

      res.json({
        success: true,
        data: charts
      });

    } catch (error) {
      next(error);
    }
  }

  // Obtener alertas del sistema
  async getAlertas(req, res, next) {
    try {
      const alertas = await dashboardService.getAlertas();

      res.json({
        success: true,
        data: alertas
      });

    } catch (error) {
      next(error);
    }
  }

  // Obtener estadísticas de rendimiento
  async getPerformanceStats(req, res, next) {
    try {
      const stats = await dashboardService.getPerformanceStats();

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      next(error);
    }
  }

  // Endpoint combinado para el dashboard principal
  async getDashboardData(req, res, next) {
    try {
      const [overview, charts, alertas] = await Promise.all([
        dashboardService.getOverview(),
        dashboardService.getCharts(),
        dashboardService.getAlertas()
      ]);

      res.json({
        success: true,
        data: {
          overview,
          charts,
          alertas,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DashboardController();