const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');

class AuthService {
  // Generar JWT token
  generateToken(userId, email, rol) {
    return jwt.sign(
      { 
        userId, 
        email, 
        rol,
        iat: Math.floor(Date.now() / 1000)
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
  }

  // Login de usuario
  async login(email, password, ipAddress, userAgent) {
    try {
      // Buscar usuario por email
      const users = await executeQuery(
        'SELECT id, empresa_id, nombre, apellido, email, password, rol, activo, intentos_fallidos, bloqueado_hasta FROM usuarios WHERE email = ?',
        [email.toLowerCase()]
      );

      if (users.length === 0) {
        // Log intento fallido
        await this.logAccess(null, email, 'login_fallido', ipAddress, userAgent, { razon: 'usuario_no_encontrado' });
        throw new Error('Credenciales inválidas');
      }

      const user = users[0];

      // Verificar si el usuario está activo
      if (!user.activo) {
        await this.logAccess(user.id, email, 'login_fallido', ipAddress, userAgent, { razon: 'usuario_inactivo' });
        throw new Error('Usuario inactivo');
      }

      // Verificar si está bloqueado
      if (user.bloqueado_hasta && new Date() < new Date(user.bloqueado_hasta)) {
        await this.logAccess(user.id, email, 'login_fallido', ipAddress, userAgent, { razon: 'usuario_bloqueado' });
        throw new Error('Usuario temporalmente bloqueado. Intenta más tarde.');
      }

      // Verificar password
      const passwordValido = await bcrypt.compare(password, user.password);
      
      if (!passwordValido) {
        // Incrementar intentos fallidos
        await this.incrementarIntentosFallidos(user.id);
        await this.logAccess(user.id, email, 'login_fallido', ipAddress, userAgent, { razon: 'password_incorrecto' });
        throw new Error('Credenciales inválidas');
      }

      // Login exitoso - resetear intentos fallidos y actualizar último acceso
      await executeQuery(
        'UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL, ultimo_acceso = NOW() WHERE id = ?',
        [user.id]
      );

      // Generar token
      const token = this.generateToken(user.id, user.email, user.rol);

      // Log acceso exitoso
      await this.logAccess(user.id, email, 'login_exitoso', ipAddress, userAgent);

      return {
        token,
        user: {
          id: user.id,
          empresa_id: user.empresa_id,
          nombre: user.nombre,
          apellido: user.apellido,
          email: user.email,
          rol: user.rol
        }
      };

    } catch (error) {
      throw error;
    }
  }

  // Incrementar intentos fallidos
  async incrementarIntentosFallidos(userId) {
    const result = await executeQuery(
      'UPDATE usuarios SET intentos_fallidos = intentos_fallidos + 1 WHERE id = ?',
      [userId]
    );

    // Si tiene 5 o más intentos, bloquear por 30 minutos
    const user = await executeQuery(
      'SELECT intentos_fallidos FROM usuarios WHERE id = ?',
      [userId]
    );

    if (user[0].intentos_fallidos >= 5) {
      await executeQuery(
        'UPDATE usuarios SET bloqueado_hasta = DATE_ADD(NOW(), INTERVAL 30 MINUTE) WHERE id = ?',
        [userId]
      );
    }
  }

  // Obtener perfil de usuario
  async getProfile(userId) {
    const users = await executeQuery(
      'SELECT id, empresa_id, nombre, apellido, email, rol, ultimo_acceso, created_at FROM usuarios WHERE id = ? AND activo = TRUE',
      [userId]
    );

    if (users.length === 0) {
      throw new Error('Usuario no encontrado');
    }

    return users[0];
  }

  // Crear nuevo usuario (solo para admins)
  async createUser(userData, createdBy) {
    const { nombre, apellido, email, password, rol = 'usuario', empresa_id } = userData;

    // Verificar si el email ya existe
    const existingUsers = await executeQuery(
      'SELECT id FROM usuarios WHERE email = ?',
      [email.toLowerCase()]
    );

    if (existingUsers.length > 0) {
      throw new Error('El email ya está registrado');
    }

    // Verificar que la empresa existe si se proporciona empresa_id
    if (empresa_id) {
      const empresas = await executeQuery(
        'SELECT id FROM empresas WHERE id = ? AND activo = TRUE',
        [empresa_id]
      );
      if (empresas.length === 0) {
        throw new Error('La empresa especificada no existe o está inactiva');
      }
    }

    // Hash del password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insertar usuario
    const result = await executeQuery(
      'INSERT INTO usuarios (empresa_id, nombre, apellido, email, password, rol) VALUES (?, ?, ?, ?, ?, ?)',
      [empresa_id || null, nombre, apellido, email.toLowerCase(), hashedPassword, rol]
    );

    return {
      id: result.insertId,
      empresa_id: empresa_id || null,
      nombre,
      apellido,
      email: email.toLowerCase(),
      rol
    };
  }

  // Cambiar password
  async changePassword(userId, currentPassword, newPassword) {
    // Verificar password actual
    const users = await executeQuery(
      'SELECT password FROM usuarios WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      throw new Error('Usuario no encontrado');
    }

    const passwordValido = await bcrypt.compare(currentPassword, users[0].password);
    
    if (!passwordValido) {
      throw new Error('Password actual incorrecto');
    }

    // Hash del nuevo password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Actualizar password
    await executeQuery(
      'UPDATE usuarios SET password = ? WHERE id = ?',
      [hashedPassword, userId]
    );

    return { success: true };
  }

  // Log de accesos
  async logAccess(userId, email, accion, ipAddress, userAgent, detalles = null) {
    await executeQuery(
      'INSERT INTO logs_acceso (usuario_id, email, accion, ip_address, user_agent, detalles) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, email, accion, ipAddress, userAgent, detalles ? JSON.stringify(detalles) : null]
    );
  }

  // Logout (para blacklist de tokens si se implementa)
  async logout(userId, token, ipAddress, userAgent) {
    await this.logAccess(userId, null, 'logout', ipAddress, userAgent);
    return { success: true };
  }

  // Registro público de nuevos clientes
  async register(registerData, ipAddress, userAgent) {
    const { executeQuery, executeTransaction } = require('../config/database');
    const Empresa = require('../models/Empresa');
    
    try {
      const {
        nombre,
        apellido,
        email,
        password,
        empresa_nombre,
        empresa_ruc,
        empresa_direccion,
        empresa_telefono
      } = registerData;

      // 1. Validar que el email no exista
      const existingUsers = await executeQuery(
        'SELECT id FROM usuarios WHERE email = ?',
        [email.toLowerCase()]
      );

      if (existingUsers.length > 0) {
        throw new Error('El email ya está registrado');
      }

      // 2. Validar que el RUC no exista
      const existingEmpresa = await Empresa.findByRuc(empresa_ruc);
      if (existingEmpresa) {
        throw new Error('El RUC ya está registrado');
      }

      // 3. Generar email de procesamiento
      const email_procesamiento = `${empresa_ruc}@facturas.grupocodev.com`;

      // 4. Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // 5. Crear empresa y usuario en transacción
      const queries = [
        {
          query: `
            INSERT INTO empresas (nombre, ruc, email_procesamiento, direccion, telefono, activo, plan)
            VALUES (?, ?, ?, ?, ?, TRUE, 'basico')
          `,
          params: [
            empresa_nombre,
            empresa_ruc,
            email_procesamiento,
            empresa_direccion || null,
            empresa_telefono || null
          ]
        }
      ];

      const results = await executeTransaction(queries);
      const empresaId = results[0].insertId;

      // 6. Crear usuario
      const userResult = await executeQuery(
        'INSERT INTO usuarios (empresa_id, nombre, apellido, email, password, rol) VALUES (?, ?, ?, ?, ?, ?)',
        [empresaId, nombre, apellido, email.toLowerCase(), hashedPassword, 'admin']
      );

      const userId = userResult.insertId;

      // 7. Generar token JWT
      const token = this.generateToken(userId, email.toLowerCase(), 'admin');

      // 8. Log de acceso
      await this.logAccess(userId, email.toLowerCase(), 'registro_exitoso', ipAddress, userAgent);

      // 9. Retornar resultado
      return {
        token,
        user: {
          id: userId,
          empresa_id: empresaId,
          nombre,
          apellido,
          email: email.toLowerCase(),
          rol: 'admin'
        }
      };

    } catch (error) {
      console.error('Error en registro:', error);
      throw error;
    }
  }
}

module.exports = new AuthService();