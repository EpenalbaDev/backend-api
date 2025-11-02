const { executeQuery } = require('../src/config/database');

async function checkDatabase() {
  try {
    console.log('🔍 Verificando estructura de la base de datos...');

    // Verificar qué tablas existen
    const tables = await executeQuery('SHOW TABLES');
    console.log('\n📋 Tablas encontradas:');
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`  - ${tableName}`);
    });

    // Verificar si existe tabla de usuarios
    const userTables = tables.filter(table => {
      const tableName = Object.values(table)[0];
      return tableName.toLowerCase().includes('user');
    });

    if (userTables.length > 0) {
      console.log('\n👥 Tablas de usuarios encontradas:');
      userTables.forEach(table => {
        const tableName = Object.values(table)[0];
        console.log(`  - ${tableName}`);
      });

      // Verificar estructura de la primera tabla de usuarios
      const firstUserTable = Object.values(userTables[0])[0];
      console.log(`\n📊 Estructura de la tabla '${firstUserTable}':`);
      
      const columns = await executeQuery(`DESCRIBE ${firstUserTable}`);
      columns.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''} ${col.Key === 'PRI' ? 'PRIMARY KEY' : ''}`);
      });

      // Verificar datos de usuarios
      const users = await executeQuery(`SELECT id, nombre, apellido, email, rol, activo FROM ${firstUserTable} LIMIT 5`);
      console.log(`\n👤 Usuarios en la tabla '${firstUserTable}':`);
      users.forEach(user => {
        console.log(`  - ID: ${user.id}, Nombre: ${user.nombre} ${user.apellido}, Email: ${user.email}, Rol: ${user.rol}`);
      });

    } else {
      console.log('\n❌ No se encontraron tablas de usuarios');
    }

    // Verificar tabla de facturas
    const facturaTables = tables.filter(table => {
      const tableName = Object.values(table)[0];
      return tableName.toLowerCase().includes('factura');
    });

    if (facturaTables.length > 0) {
      console.log('\n📄 Tablas de facturas encontradas:');
      facturaTables.forEach(table => {
        const tableName = Object.values(table)[0];
        console.log(`  - ${tableName}`);
      });
    }

    console.log('\n✅ Verificación completada');

  } catch (error) {
    console.error('❌ Error verificando base de datos:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  checkDatabase()
    .then(() => {
      console.log('✅ Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en script:', error);
      process.exit(1);
    });
}

module.exports = { checkDatabase }; 