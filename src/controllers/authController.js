const authService = require('../services/authService');
const Joi = require('joi');

class AuthController {
  // Login
  async login(req, res, next) {
    try {
      // Validación de entrada
      const schema = Joi.object({
        email: Joi.string().email().required().messages({
          'string.email': 'Formato de email inválido',
          'any.required': 'Email es requerido'
        }),
        password: Joi.string().min(6).required().messages({
          'string.min': 'Password debe tener al menos 6 caracteres',
          'any.required': 'Password es requerido'
        })
      });

      const { error, value } = schema.validate(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      const { email, password } = value;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      const result = await authService.login(email, password, ipAddress, userAgent);

      res.json({
        success: true,
        message: 'Login exitoso',
        data: result
      });

    } catch (error) {
      next(error);
    }
  }

  // Obtener perfil del usuario autenticado
  async getProfile(req, res, next) {
    try {
      const profile = await authService.getProfile(req.user.id);

      res.json({
        success: true,
        data: profile
      });

    } catch (error) {
      next(error);
    }
  }

  // Crear nuevo usuario (solo admins)
  async createUser(req, res, next) {
    try {
      // Validación de entrada
      const schema = Joi.object({
        nombre: Joi.string().min(2).max(100).required().messages({
          'string.min': 'Nombre debe tener al menos 2 caracteres',
          'any.required': 'Nombre es requerido'
        }),
        apellido: Joi.string().min(2).max(100).required().messages({
          'string.min': 'Apellido debe tener al menos 2 caracteres',
          'any.required': 'Apellido es requerido'
        }),
        email: Joi.string().email().required().messages({
          'string.email': 'Formato de email inválido',
          'any.required': 'Email es requerido'
        }),
        password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required().messages({
          'string.min': 'Password debe tener al menos 8 caracteres',
          'string.pattern.base': 'Password debe contener al menos una mayúscula, una minúscula y un número',
          'any.required': 'Password es requerido'
        }),
        rol: Joi.string().valid('admin', 'usuario', 'auditor').default('usuario'),
        empresa_id: Joi.number().integer().positive().optional().allow(null)
      });

      const { error, value } = schema.validate(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      const newUser = await authService.createUser(value, req.user.id);

      res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente',
        data: newUser
      });

    } catch (error) {
      next(error);
    }
  }

  // Cambiar password
  async changePassword(req, res, next) {
    try {
      const schema = Joi.object({
        currentPassword: Joi.string().required().messages({
          'any.required': 'Password actual es requerido'
        }),
        newPassword: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required().messages({
          'string.min': 'Nuevo password debe tener al menos 8 caracteres',
          'string.pattern.base': 'Nuevo password debe contener al menos una mayúscula, una minúscula y un número',
          'any.required': 'Nuevo password es requerido'
        })
      });

      const { error, value } = schema.validate(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      const { currentPassword, newPassword } = value;

      await authService.changePassword(req.user.id, currentPassword, newPassword);

      res.json({
        success: true,
        message: 'Password cambiado exitosamente'
      });

    } catch (error) {
      next(error);
    }
  }

  // Logout
  async logout(req, res, next) {
    try {
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      await authService.logout(req.user.id, req.token, ipAddress, userAgent);

      res.json({
        success: true,
        message: 'Logout exitoso'
      });

    } catch (error) {
      next(error);
    }
  }

  // Verificar token (endpoint para frontend)
  async verifyToken(req, res, next) {
    try {
      // Si llegamos aquí, el token es válido (pasó por el middleware)
      res.json({
        success: true,
        message: 'Token válido',
        user: req.user
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();