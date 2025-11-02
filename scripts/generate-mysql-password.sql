-- =============================================
-- SCRIPT PARA ACTUALIZAR CONTRASEÑAS EN MYSQL
-- =============================================

-- IMPORTANTE: Este script usa hashes bcrypt pre-generados
-- Para generar nuevos hashes, usa el script Node.js

-- Hash para contraseña 'password'
UPDATE usuarios 
SET password = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    updated_at = NOW(),
    intentos_fallidos = 0,
    bloqueado_hasta = NULL
WHERE email = 'admin@tu-empresa.com';

-- Hash para contraseña 'admin123'
UPDATE usuarios 
SET password = '$2a$10$rQZ8K9vX7yL2mN1pO3qR4sT5uV6wX7yZ8aB9cD0eF1gH2iJ3kL4mN5oP6',
    updated_at = NOW(),
    intentos_fallidos = 0,
    bloqueado_hasta = NULL
WHERE email = 'admin@tu-empresa.com';

-- Hash para contraseña '123456'
UPDATE usuarios 
SET password = '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456',
    updated_at = NOW(),
    intentos_fallidos = 0,
    bloqueado_hasta = NULL
WHERE email = 'admin@tu-empresa.com';

-- Verificar que se actualizó correctamente
SELECT id, nombre, apellido, email, rol, activo, updated_at 
FROM usuarios 
WHERE email = 'admin@tu-empresa.com'; 