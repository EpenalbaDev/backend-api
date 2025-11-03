-- Script para agregar rol 'super_admin' al enum de usuarios.rol
-- No borra datos existentes

-- Paso 1: Modificar la columna rol para incluir 'super_admin' como primer valor
ALTER TABLE usuarios 
MODIFY COLUMN rol ENUM('super_admin', 'admin', 'usuario', 'auditor') 
DEFAULT 'usuario';

-- Paso 2: Crear índice en empresa_id si no existe
CREATE INDEX IF NOT EXISTS idx_usuarios_empresa_id ON usuarios(empresa_id);

-- Paso 3: Verificar cambios
SELECT COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'usuarios' 
  AND COLUMN_NAME = 'rol';

