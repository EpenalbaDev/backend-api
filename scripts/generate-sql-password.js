const bcrypt = require('bcryptjs');

async function generateSQLPassword(email, password) {
  try {
    console.log('🔐 Generando comando SQL para actualizar contraseña...');
    console.log(`Email: ${email}`);
    console.log(`Contraseña: ${password}`);
    
    // Generar hash bcrypt
    const hash = await bcrypt.hash(password, 12);
    
    console.log('\n📋 Comando SQL generado:');
    console.log('='.repeat(60));
    console.log(`UPDATE usuarios SET password = '${hash}', updated_at = NOW(), intentos_fallidos = 0, bloqueado_hasta = NULL WHERE email = '${email}';`);
    console.log('='.repeat(60));
    
    // Verificar que funciona
    const isValid = await bcrypt.compare(password, hash);
    console.log(`\n✅ Verificación: ${isValid ? 'CORRECTO' : 'INCORRECTO'}`);
    
    return hash;
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  const email = process.argv[2] || 'admin@tu-empresa.com';
  const password = process.argv[3] || 'password';
  
  generateSQLPassword(email, password)
    .then(() => {
      console.log('\n✅ Script completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

module.exports = { generateSQLPassword }; 