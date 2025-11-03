// Middleware para aplicar filtro multi-tenant por empresa_id
// Super_admin ve todo, otros roles solo ven datos de su empresa

const applyEmpresaFilter = (req, res, next) => {
  try {
    // Si no hay usuario autenticado, no aplicar filtro (debería haber pasado por authenticateToken antes)
    if (!req.user) {
      return next();
    }

    // Super admin ve todo - no aplicar filtro
    if (req.user.rol === 'super_admin') {
      req.empresaFilter = {};
      return next();
    }

    // Otros roles: filtrar por empresa_id
    // Si el usuario no tiene empresa_id, no puede ver datos (empresa_id será NULL)
    req.empresaFilter = {
      empresa_id: req.user.empresa_id
    };

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  applyEmpresaFilter
};

