const { executeQuery } = require('../src/config/database');
const bcrypt = require('bcryptjs');

async function updateUserPassword(email, newPassword) {
  try {
    console.log('🔐 Actualizando contraseña de usuario...');
    console.log(`Email: ${email}`);
    console.log(`Nueva contraseña: ${newPassword}`);
    
    // Generar hash bcrypt
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    console.log(`Hash generado: ${hashedPassword}`);
    
    // Actualizar en la base de datos
    const result = await executeQuery(
      'UPDATE usuarios SET password = ?, updated_at = NOW() WHERE email = ?',
      [hashedPassword, email]
    );
    
    if (result.affectedRows > 0) {
      console.log('✅ Contraseña actualizada exitosamente');
      
      // Verificar que funciona
      const users = await executeQuery(
        'SELECT password FROM usuarios WHERE email = ?',
        [email]
      );
      
      if (users.length > 0) {
        const isValid = await bcrypt.compare(newPassword, users[0].password);
        console.log(`✅ Verificación: ${isValid ? 'CORRECTO' : 'INCORRECTO'}`);
        
        if (isValid) {
          console.log('🎉 ¡La contraseña se actualizó correctamente y es válida!');
        } else {
          console.log('❌ Error: La contraseña no se verificó correctamente');
        }
      }
    } else {
      console.log('❌ No se encontró el usuario con ese email');
    }
    
  } catch (error) {
    console.error('❌ Error actualizando contraseña:', error);
    throw error;
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  const email = process.argv[2];
  const password = process.argv[3];
  
  if (!email || !password) {
    console.log('❌ Uso: node scripts/update-password.js <email> <nueva_contraseña>');
    console.log('Ejemplo: node scripts/update-password.js admin@tu-empresa.com nueva123');
    process.exit(1);
  }
  
  updateUserPassword(email, password)
    .then(() => {
      console.log('\n✅ Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en script:', error);
      process.exit(1);
    });
}

module.exports = { updateUserPassword }; 