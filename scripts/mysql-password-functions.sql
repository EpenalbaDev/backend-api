-- =============================================
-- FUNCIONES PARA MANEJO DE CONTRASEÑAS EN MYSQL
-- =============================================

-- Función para generar hash SHA256 (alternativa a bcrypt)
DELIMITER $$
CREATE FUNCTION generate_password_hash(password VARCHAR(255))
RETURNS VARCHAR(255)
DETERMINISTIC
BEGIN
    -- Usar SHA256 como alternativa (no es tan seguro como bcrypt pero funciona)
    RETURN CONCAT('$2a$10$', SHA2(CONCAT(password, UUID()), 256));
END$$
DELIMITER ;

-- Función para verificar contraseña
DELIMITER $$
CREATE FUNCTION verify_password_hash(input_password VARCHAR(255), stored_hash VARCHAR(255))
RETURNS BOOLEAN
DETERMINISTIC
BEGIN
    -- Para este ejemplo, usamos SHA256
    DECLARE input_hash VARCHAR(255);
    SET input_hash = CONCAT('$2a$10$', SHA2(CONCAT(input_password, UUID()), 256));
    RETURN input_hash = stored_hash;
END$$
DELIMITER ;

-- Función para actualizar contraseña de usuario
DELIMITER $$
CREATE PROCEDURE update_user_password(
    IN user_email VARCHAR(255),
    IN new_password VARCHAR(255)
)
BEGIN
    DECLARE user_exists INT DEFAULT 0;
    DECLARE new_hash VARCHAR(255);
    
    -- Verificar si el usuario existe
    SELECT COUNT(*) INTO user_exists 
    FROM usuarios 
    WHERE email = user_email;
    
    IF user_exists > 0 THEN
        -- Generar nuevo hash
        SET new_hash = generate_password_hash(new_password);
        
        -- Actualizar contraseña
        UPDATE usuarios 
        SET password = new_hash, 
            updated_at = NOW() 
        WHERE email = user_email;
        
        SELECT 'SUCCESS' as status, 
               'Contraseña actualizada correctamente' as message,
               new_hash as hash_generated;
    ELSE
        SELECT 'ERROR' as status, 
               'Usuario no encontrado' as message,
               NULL as hash_generated;
    END IF;
END$$
DELIMITER ;

-- Función para crear nuevo usuario con hash
DELIMITER $$
CREATE PROCEDURE create_user_with_hash(
    IN user_nombre VARCHAR(100),
    IN user_apellido VARCHAR(100),
    IN user_email VARCHAR(255),
    IN user_password VARCHAR(255),
    IN user_rol ENUM('admin', 'usuario', 'auditor') DEFAULT 'usuario'
)
BEGIN
    DECLARE user_exists INT DEFAULT 0;
    DECLARE new_hash VARCHAR(255);
    
    -- Verificar si el email ya existe
    SELECT COUNT(*) INTO user_exists 
    FROM usuarios 
    WHERE email = user_email;
    
    IF user_exists = 0 THEN
        -- Generar hash
        SET new_hash = generate_password_hash(user_password);
        
        -- Insertar usuario
        INSERT INTO usuarios (nombre, apellido, email, password, rol, activo)
        VALUES (user_nombre, user_apellido, user_email, new_hash, user_rol, TRUE);
        
        SELECT 'SUCCESS' as status, 
               'Usuario creado correctamente' as message,
               new_hash as hash_generated,
               LAST_INSERT_ID() as user_id;
    ELSE
        SELECT 'ERROR' as status, 
               'El email ya está registrado' as message,
               NULL as hash_generated,
               NULL as user_id;
    END IF;
END$$
DELIMITER ;

-- Función para verificar login
DELIMITER $$
CREATE PROCEDURE verify_user_login(
    IN user_email VARCHAR(255),
    IN user_password VARCHAR(255)
)
BEGIN
    DECLARE user_id INT DEFAULT NULL;
    DECLARE stored_hash VARCHAR(255);
    DECLARE user_activo BOOLEAN DEFAULT FALSE;
    DECLARE user_rol VARCHAR(50);
    
    -- Obtener datos del usuario
    SELECT id, password, activo, rol 
    INTO user_id, stored_hash, user_activo, user_rol
    FROM usuarios 
    WHERE email = user_email;
    
    IF user_id IS NOT NULL THEN
        IF user_activo = TRUE THEN
            IF verify_password_hash(user_password, stored_hash) THEN
                -- Login exitoso
                UPDATE usuarios 
                SET ultimo_acceso = NOW(), 
                    intentos_fallidos = 0,
                    bloqueado_hasta = NULL
                WHERE id = user_id;
                
                SELECT 'SUCCESS' as status,
                       'Login exitoso' as message,
                       user_id as id,
                       user_rol as rol;
            ELSE
                -- Password incorrecto
                UPDATE usuarios 
                SET intentos_fallidos = intentos_fallidos + 1
                WHERE id = user_id;
                
                SELECT 'ERROR' as status,
                       'Credenciales inválidas' as message,
                       NULL as id,
                       NULL as rol;
            END IF;
        ELSE
            SELECT 'ERROR' as status,
                   'Usuario inactivo' as message,
                   NULL as id,
                   NULL as rol;
        END IF;
    ELSE
        SELECT 'ERROR' as status,
               'Usuario no encontrado' as message,
               NULL as id,
               NULL as rol;
    END IF;
END$$
DELIMITER ;

-- =============================================
-- EJEMPLOS DE USO
-- =============================================

-- 1. Actualizar contraseña de usuario existente
-- CALL update_user_password('admin@tu-empresa.com', 'nueva_contraseña123');

-- 2. Crear nuevo usuario
-- CALL create_user_with_hash('Juan', 'Pérez', 'juan@empresa.com', 'password123', 'usuario');

-- 3. Verificar login
-- CALL verify_user_login('admin@tu-empresa.com', 'password');

-- 4. Generar hash para usar manualmente
-- SELECT generate_password_hash('mi_contraseña') as hash;

-- =============================================
-- SCRIPT PARA ACTUALIZAR CONTRASEÑA MANUALMENTE
-- =============================================

-- Descomenta y ejecuta estas líneas para actualizar la contraseña:

/*
-- Opción 1: Usar la función
CALL update_user_password('admin@tu-empresa.com', 'nueva_contraseña123');

-- Opción 2: Actualizar manualmente con hash generado
UPDATE usuarios 
SET password = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    updated_at = NOW()
WHERE email = 'admin@tu-empresa.com';

-- Opción 3: Resetear contraseña a 'password'
UPDATE usuarios 
SET password = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    updated_at = NOW(),
    intentos_fallidos = 0,
    bloqueado_hasta = NULL
WHERE email = 'admin@tu-empresa.com';
*/ 