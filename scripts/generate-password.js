const bcrypt = require('bcryptjs');

async function generatePasswordHash(password) {
  try {
    console.log('🔐 Generando hash bcrypt...');
    console.log(`Contraseña original: ${password}`);
    
    // Generar hash con salt rounds = 12 (mismo que usa la app)
    const hash = await bcrypt.hash(password, 12);
    
    console.log(`Hash generado: ${hash}`);
    console.log('\n📋 Query SQL para actualizar:');
    console.log(`UPDATE usuarios SET password = '${hash}' WHERE email = 'admin@tu-empresa.com';`);
    
    // Verificar que funciona
    const isValid = await bcrypt.compare(password, hash);
    console.log(`\n✅ Verificación: ${isValid ? 'CORRECTO' : 'INCORRECTO'}`);
    
    return hash;
  } catch (error) {
    console.error('❌ Error generando hash:', error);
    throw error;
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  const password = process.argv[2] || 'password';
  
  generatePasswordHash(password)
    .then(() => {
      console.log('\n✅ Hash generado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

module.exports = { generatePasswordHash }; 