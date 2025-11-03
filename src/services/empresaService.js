const Empresa = require('../models/Empresa');
const User = require('../models/User');
const { executeQuery } = require('../config/database');

class EmpresaService {
  // Obtener lista de empresas con paginación y filtros
  async getEmpresas(filtros = {}) {
    try {
      const {
        page = 1,
        limit = 25,
        search,
        activo,
        plan,
        empresa_id,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = filtros;

      // Construir WHERE clause (especificar tabla 'e' para evitar ambigüedad)
      const whereConditions = ['e.activo = TRUE'];
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

      // Filtro por empresa_id (para admin que solo ve su empresa)
      if (empresa_id) {
        whereConditions.push('e.id = ?');
        params.push(empresa_id);
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      // Validar campos de ordenamiento (usar prefijo de tabla)
      const allowedSortFields = ['nombre', 'ruc', 'created_at', 'updated_at', 'plan'];
      const sortField = allowedSortFields.includes(sortBy) ? `e.${sortBy}` : 'e.created_at';
      const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      const offset = (page - 1) * limit;

      // Obtener empresas con conteo de usuarios
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
          COUNT(u.id) as total_usuarios,
          COUNT(CASE WHEN u.activo = TRUE THEN 1 END) as usuarios_activos
        FROM empresas e
        LEFT JOIN usuarios u ON e.id = u.empresa_id
        ${whereClause}
        GROUP BY e.id
        ORDER BY ${sortField} ${order}
        LIMIT ? OFFSET ?
      `, [...params, parseInt(limit), offset]);

      // Contar total para paginación (usar prefijo de tabla en whereClause)
      const countWhereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';
      const [countResult] = await executeQuery(`
        SELECT COUNT(*) as total 
        FROM empresas e
        ${countWhereClause}
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
      console.error('Error en getEmpresas:', error);
      throw error;
    }
  }

  // Obtener empresa por ID
  async getEmpresaById(id) {
    try {
      const empresa = await Empresa.findById(id);
      
      if (!empresa) {
        throw new Error('Empresa no encontrada');
      }

      // Obtener usuarios de la empresa
      const usuarios = await Empresa.getUsers(id, 10, 0);
      
      // Contar total de usuarios
      const [countResult] = await executeQuery(
        'SELECT COUNT(*) as total FROM usuarios WHERE empresa_id = ? AND activo = TRUE',
        [id]
      );

      return {
        ...empresa,
        activo: empresa.activo === 1,
        total_usuarios: parseInt(countResult.total || 0),
        usuarios_recientes: usuarios.map(usuario => ({
          id: usuario.id,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          email: usuario.email,
          rol: usuario.rol,
          ultimo_acceso: usuario.ultimo_acceso
        }))
      };

    } catch (error) {
      console.error('Error en getEmpresaById:', error);
      throw error;
    }
  }

  // Obtener empresa por RUC
  async getEmpresaByRuc(ruc) {
    try {
      const empresa = await Empresa.findByRuc(ruc);
      
      if (!empresa) {
        throw new Error('Empresa no encontrada');
      }

      return {
        ...empresa,
        activo: empresa.activo === 1
      };

    } catch (error) {
      console.error('Error en getEmpresaByRuc:', error);
      throw error;
    }
  }

  // Crear nueva empresa
  async createEmpresa(empresaData) {
    try {
      // Verificar si el RUC ya existe
      const existingByRuc = await Empresa.findByRuc(empresaData.ruc);
      if (existingByRuc) {
        throw new Error('El RUC ya está registrado');
      }

      // Verificar si el email de procesamiento ya existe
      const existingByEmail = await Empresa.findByEmail(empresaData.email_procesamiento);
      if (existingByEmail) {
        throw new Error('El email de procesamiento ya está registrado');
      }

      const empresaId = await Empresa.create(empresaData);
      const nuevaEmpresa = await Empresa.findById(empresaId);

      return {
        ...nuevaEmpresa,
        activo: nuevaEmpresa.activo === 1
      };

    } catch (error) {
      console.error('Error en createEmpresa:', error);
      throw error;
    }
  }

  // Actualizar empresa
  async updateEmpresa(id, empresaData, currentUser = null) {
    try {
      // Verificar que la empresa existe
      const empresa = await Empresa.findById(id);
      if (!empresa) {
        throw new Error('Empresa no encontrada');
      }

      // Validar permisos si se proporciona currentUser
      if (currentUser && currentUser.rol !== 'super_admin') {
        if (currentUser.empresa_id !== id) {
          throw new Error('No tienes permisos para actualizar esta empresa');
        }
      }

      // Si se actualiza el RUC, verificar que no existe otro con ese RUC
      if (empresaData.ruc && empresaData.ruc !== empresa.ruc) {
        const existingByRuc = await Empresa.findByRuc(empresaData.ruc);
        if (existingByRuc && existingByRuc.id !== id) {
          throw new Error('El RUC ya está registrado en otra empresa');
        }
      }

      // Si se actualiza el email, verificar que no existe otro con ese email
      if (empresaData.email_procesamiento && empresaData.email_procesamiento !== empresa.email_procesamiento) {
        const existingByEmail = await Empresa.findByEmail(empresaData.email_procesamiento);
        if (existingByEmail && existingByEmail.id !== id) {
          throw new Error('El email de procesamiento ya está registrado en otra empresa');
        }
      }

      const empresaActualizada = await Empresa.update(id, empresaData);

      return {
        ...empresaActualizada,
        activo: empresaActualizada.activo === 1
      };

    } catch (error) {
      console.error('Error en updateEmpresa:', error);
      throw error;
    }
  }

  // Obtener usuarios de una empresa
  async getUsuariosByEmpresa(empresaId, filtros = {}) {
    try {
      // Verificar que la empresa existe
      const empresa = await Empresa.findById(empresaId);
      if (!empresa) {
        throw new Error('Empresa no encontrada');
      }

      const {
        page = 1,
        limit = 25,
        activo,
        rol,
        search
      } = filtros;

      let whereClause = 'WHERE empresa_id = ?';
      const params = [empresaId];

      if (activo !== undefined) {
        whereClause += ' AND activo = ?';
        params.push(activo ? 1 : 0);
      }

      if (rol) {
        whereClause += ' AND rol = ?';
        params.push(rol);
      }

      if (search) {
        whereClause += ' AND (nombre LIKE ? OR apellido LIKE ? OR email LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      const offset = (page - 1) * limit;

      const usuarios = await executeQuery(`
        SELECT 
          id,
          nombre,
          apellido,
          email,
          rol,
          activo,
          ultimo_acceso,
          created_at,
          updated_at
        FROM usuarios 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `, [...params, parseInt(limit), offset]);

      const [countResult] = await executeQuery(`
        SELECT COUNT(*) as total 
        FROM usuarios 
        ${whereClause}
      `, params);

      const total = countResult.total;
      const totalPages = Math.ceil(total / limit);

      return {
        usuarios: usuarios.map(usuario => ({
          ...usuario,
          activo: usuario.activo === 1
        })),
        empresa: {
          id: empresa.id,
          nombre: empresa.nombre,
          ruc: empresa.ruc
        },
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
      console.error('Error en getUsuariosByEmpresa:', error);
      throw error;
    }
  }

  // Contar empresas
  async countEmpresas(filtros = {}) {
    try {
      const { activo, plan } = filtros;

      const whereConditions = [];
      const params = [];

      if (activo !== undefined) {
        whereConditions.push('activo = ?');
        params.push(activo ? 1 : 0);
      }

      if (plan) {
        whereConditions.push('plan = ?');
        params.push(plan);
      }

      const whereClause = whereConditions.length > 0
        ? `WHERE ${whereConditions.join(' AND ')}`
        : 'WHERE activo = TRUE';

      const result = await Empresa.count(whereClause, params);
      return { total: result };

    } catch (error) {
      console.error('Error en countEmpresas:', error);
      throw error;
    }
  }

  // Invitar usuario a una empresa
  async inviteUsuario(empresaId, userData, currentUser) {
    try {
      const { nombre, apellido, email, password, rol = 'usuario' } = userData;

      // 1. Validar permisos
      // Super admin puede invitar a cualquier empresa
      // Admin solo puede invitar a su propia empresa
      if (currentUser.rol !== 'super_admin') {
        if (currentUser.empresa_id !== empresaId) {
          throw new Error('No tienes permisos para invitar usuarios a esta empresa');
        }
      }

      // 2. Validar que la empresa existe y está activa
      const empresa = await Empresa.findById(empresaId);
      if (!empresa || !empresa.activo) {
        throw new Error('La empresa no existe o está inactiva');
      }

      // 3. Validar que el email no exista
      const existingUsers = await executeQuery(
        'SELECT id FROM usuarios WHERE email = ?',
        [email.toLowerCase()]
      );

      if (existingUsers.length > 0) {
        throw new Error('El email ya está registrado');
      }

      // 4. Hash password
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 12);

      // 5. Crear usuario
      const result = await executeQuery(
        'INSERT INTO usuarios (empresa_id, nombre, apellido, email, password, rol) VALUES (?, ?, ?, ?, ?, ?)',
        [empresaId, nombre, apellido, email.toLowerCase(), hashedPassword, rol]
      );

      // 6. Obtener usuario creado
      const usuarioCreado = await executeQuery(
        'SELECT id, empresa_id, nombre, apellido, email, rol, activo, created_at FROM usuarios WHERE id = ?',
        [result.insertId]
      );

      return {
        ...usuarioCreado[0],
        activo: usuarioCreado[0].activo === 1
      };

    } catch (error) {
      console.error('Error en inviteUsuario:', error);
      throw error;
    }
  }
}

module.exports = new EmpresaService();

