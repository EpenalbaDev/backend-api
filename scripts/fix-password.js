const { executeQuery } = require('../src/config/database');
const bcrypt = require('bcryptjs');

async function fixUserPassword(email, newPassword) {
  try {
    console.log('🔐 Actualizando contraseña de usuario...');
    console.log(`Email: ${email}`);
    console.log(`Nueva contraseña: ${newPassword}`);
    
    // Verificar si el usuario existe
    const users = await executeQuery(
      'SELECT id, nombre, apellido, email, password FROM usuarios WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      console.log('❌ Usuario no encontrado');
      return;
    }
    
    console.log('✅ Usuario encontrado:', users[0].nombre, users[0].apellido);
    console.log('🔍 Hash actual:', users[0].password);
    
    // Generar nuevo hash bcrypt
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    console.log('🔐 Nuevo hash generado:', hashedPassword);
    
    // Actualizar contraseña
    const result = await executeQuery(
      'UPDATE usuarios SET password = ?, updated_at = NOW(), intentos_fallidos = 0, bloqueado_hasta = NULL WHERE email = ?',
      [hashedPassword, email]
    );
    
    console.log('✅ Contraseña actualizada en la base de datos');
    
    // Verificar que funciona
    const updatedUsers = await executeQuery(
      'SELECT password FROM usuarios WHERE email = ?',
      [email]
    );
    
    if (updatedUsers.length > 0) {
      const isValid = await bcrypt.compare(newPassword, updatedUsers[0].password);
      console.log(`✅ Verificación bcrypt: ${isValid ? 'CORRECTO' : 'INCORRECTO'}`);
      
      if (isValid) {
        console.log('🎉 ¡La contraseña se actualizó correctamente y es válida!');
        console.log('\n📋 Ahora puedes hacer login con:');
        console.log(`Email: ${email}`);
        console.log(`Password: ${newPassword}`);
      } else {
        console.log('❌ Error: La contraseña no se verificó correctamente');
      }
    }
    
  } catch (error) {
    console.error('❌ Error actualizando contraseña:', error);
    throw error;
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  const email = process.argv[2] || 'admin@tu-empresa.com';
  const password = process.argv[3] || 'panda2024';
  
  fixUserPassword(email, password)
    .then(() => {
      console.log('\n✅ Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en script:', error);
      process.exit(1);
    });
}

module.exports = { fixUserPassword }; 