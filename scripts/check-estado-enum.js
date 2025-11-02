const { executeQuery } = require('../src/config/database');

async function checkEstadoEnum() {
  try {
    console.log('🔍 Verificando valores permitidos del campo estado...');
    
    // Verificar la estructura de la tabla facturas
    console.log('\n1️⃣ Estructura de la tabla facturas:');
    const estructura = await executeQuery(`
      DESCRIBE facturas
    `);
    
    estructura.forEach(col => {
      if (col.Field === 'estado') {
        console.log(`   Campo: ${col.Field}`);
        console.log(`   Tipo: ${col.Type}`);
        console.log(`   Null: ${col.Null}`);
        console.log(`   Key: ${col.Key}`);
        console.log(`   Default: ${col.Default}`);
        console.log(`   Extra: ${col.Extra}`);
      }
    });
    
    // Verificar valores únicos actuales en el campo estado
    console.log('\n2️⃣ Valores únicos actuales en el campo estado:');
    const estadosUnicos = await executeQuery(`
      SELECT DISTINCT estado FROM facturas WHERE estado IS NOT NULL
    `);
    
    console.log('📊 Estados encontrados:', estadosUnicos.length);
    estadosUnicos.forEach(e => {
      console.log(`   - "${e.estado}"`);
    });
    
    // Verificar si hay algún registro con estado NULL
    console.log('\n3️⃣ Verificando registros con estado NULL:');
    const estadosNull = await executeQuery(`
      SELECT COUNT(*) as count FROM facturas WHERE estado IS NULL
    `);
    
    console.log(`📊 Registros con estado NULL: ${estadosNull[0].count}`);
    
    // Mostrar información completa de las facturas
    console.log('\n4️⃣ Información completa de las facturas:');
    const facturas = await executeQuery(`
      SELECT id, numero_factura, estado, LENGTH(estado) as estado_length
      FROM facturas 
      ORDER BY id
    `);
    
    facturas.forEach(f => {
      console.log(`   ID: ${f.id}, Número: ${f.numero_factura}, Estado: "${f.estado}" (longitud: ${f.estado_length})`);
    });
    
  } catch (error) {
    console.error('❌ Error en consulta:', error);
    console.error('📋 Detalles del error:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlMessage: error.sqlMessage
    });
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  checkEstadoEnum()
    .then(() => {
      console.log('\n✅ Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en script:', error);
      process.exit(1);
    });
}

module.exports = { checkEstadoEnum }; 