const { executeQuery } = require('../config/database');
const Empresa = require('../models/Empresa');

class AdminService {
  // Obtener todas las empresas (super admin only)
  async getTodasEmpresas(filtros = {}) {
    try {
      const {
        page = 1,
        limit = 25,
        search,
        activo,
        plan
      } = filtros;

      let whereConditions = [];
      const params = [];

      if (search) {
        whereConditions.push('(e.nombre LIKE ? OR e.ruc LIKE ? OR e.email_procesamiento LIKE ?)');
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      if (activo !== undefined) {
        whereConditions.push('e.activo = ?');
        params.push(activo ? 1 : 0);
      }

      if (plan) {
        whereConditions.push('e.plan = ?');
        params.push(plan);
      }

      const whereClause = whereConditions.length > 0
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      const offset = (page - 1) * limit;

      // Obtener empresas con conteo de usuarios
      // Nota: facturas no tienen empresa_id directo, se omite conteo de facturas por ahora
      const empresas = await executeQuery(`
        SELECT 
          e.id,
          e.nombre,
          e.ruc,
          e.email_procesamiento,
          e.direccion,
          e.telefono,
          e.activo,
          e.plan,
          e.created_at,
          e.updated_at,
          COUNT(DISTINCT u.id) as total_usuarios,
          COUNT(DISTINCT CASE WHEN u.activo = TRUE THEN u.id END) as usuarios_activos
        FROM empresas e
        LEFT JOIN usuarios u ON e.id = u.empresa_id
        ${whereClause}
        GROUP BY e.id
        ORDER BY e.created_at DESC
        LIMIT ? OFFSET ?
      `, [...params, parseInt(limit), offset]);

      // Contar total
      const [countResult] = await executeQuery(`
        SELECT COUNT(*) as total 
        FROM empresas e
        ${whereClause}
      `, params);

      const total = countResult.total;
      const totalPages = Math.ceil(total / limit);

      return {
        empresas: empresas.map(empresa => ({
          id: empresa.id,
          nombre: empresa.nombre,
          ruc: empresa.ruc,
          email_procesamiento: empresa.email_procesamiento,
          direccion: empresa.direccion,
          telefono: empresa.telefono,
          activo: empresa.activo === 1,
          plan: empresa.plan,
          total_usuarios: parseInt(empresa.total_usuarios || 0),
          usuarios_activos: parseInt(empresa.usuarios_activos || 0),
          created_at: empresa.created_at,
          updated_at: empresa.updated_at
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
      console.error('Error en getTodasEmpresas:', error);
      throw error;
    }
  }

  // Obtener estadísticas globales (super admin only)
  async getEstadisticasGlobales() {
    try {
      // Total empresas
      const [empresasResult] = await executeQuery(
        'SELECT COUNT(*) as total, COUNT(CASE WHEN activo = TRUE THEN 1 END) as activas FROM empresas'
      );

      // Total usuarios
      const [usuariosResult] = await executeQuery(
        'SELECT COUNT(*) as total, COUNT(CASE WHEN activo = TRUE THEN 1 END) as activos FROM usuarios'
      );

      // Total facturas
      const [facturasResult] = await executeQuery(
        'SELECT COUNT(*) as total FROM facturas'
      );

      // Facturas últimas 24 horas
      const [facturas24hResult] = await executeQuery(
        'SELECT COUNT(*) as total FROM facturas WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)'
      );

      // Usuarios por rol
      const usuariosPorRol = await executeQuery(`
        SELECT rol, COUNT(*) as total 
        FROM usuarios 
        GROUP BY rol
      `);

      // Empresas por plan
      const empresasPorPlan = await executeQuery(`
        SELECT plan, COUNT(*) as total 
        FROM empresas 
        WHERE activo = TRUE
        GROUP BY plan
      `);

      return {
        empresas: {
          total: parseInt(empresasResult.total || 0),
          activas: parseInt(empresasResult.activas || 0),
          inactivas: parseInt(empresasResult.total || 0) - parseInt(empresasResult.activas || 0)
        },
        usuarios: {
          total: parseInt(usuariosResult.total || 0),
          activos: parseInt(usuariosResult.activos || 0),
          inactivos: parseInt(usuariosResult.total || 0) - parseInt(usuariosResult.activos || 0),
          por_rol: usuariosPorRol.map(row => ({
            rol: row.rol,
            total: parseInt(row.total || 0)
          }))
        },
        facturas: {
          total: parseInt(facturasResult.total || 0),
          ultimas_24h: parseInt(facturas24hResult.total || 0)
        },
        empresas_por_plan: empresasPorPlan.map(row => ({
          plan: row.plan,
          total: parseInt(row.total || 0)
        }))
      };

    } catch (error) {
      console.error('Error en getEstadisticasGlobales:', error);
      throw error;
    }
  }
}

module.exports = new AdminService();

