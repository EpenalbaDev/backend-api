const { executeQuery } = require('../src/config/database');

async function testSimpleFacturas() {
  try {
    console.log('🔍 Probando consultas simples de facturas...');
    
    // 1. Consulta sin parámetros
    console.log('\n1️⃣ Probando consulta sin parámetros...');
    const facturas1 = await executeQuery(`
      SELECT id, numero_factura, emisor_nombre, estado 
      FROM facturas 
      LIMIT 5
    `);
    console.log('✅ Consulta sin parámetros exitosa:', facturas1.length, 'facturas');
    
    // 2. Consulta con un parámetro
    console.log('\n2️⃣ Probando consulta con un parámetro...');
    const facturas2 = await executeQuery(`
      SELECT id, numero_factura, emisor_nombre, estado 
      FROM facturas 
      WHERE estado = ?
      LIMIT 5
    `, ['procesado']);
    console.log('✅ Consulta con un parámetro exitosa:', facturas2.length, 'facturas');
    
    // 3. Consulta con LIMIT/OFFSET
    console.log('\n3️⃣ Probando consulta con LIMIT/OFFSET...');
    const facturas3 = await executeQuery(`
      SELECT id, numero_factura, emisor_nombre, estado 
      FROM facturas 
      LIMIT ? OFFSET ?
    `, [5, 0]);
    console.log('✅ Consulta con LIMIT/OFFSET exitosa:', facturas3.length, 'facturas');
    
    // 4. Consulta con fecha
    console.log('\n4️⃣ Probando consulta con fecha...');
    const facturas4 = await executeQuery(`
      SELECT id, numero_factura, emisor_nombre, estado, fecha_factura
      FROM facturas 
      WHERE fecha_factura >= ?
      LIMIT 5
    `, ['2024-01-01']);
    console.log('✅ Consulta con fecha exitosa:', facturas4.length, 'facturas');
    
    // 5. Consulta combinada (la que falla)
    console.log('\n5️⃣ Probando consulta combinada...');
    try {
      const facturas5 = await executeQuery(`
        SELECT id, numero_factura, emisor_nombre, estado, fecha_factura
        FROM facturas 
        WHERE estado = ? AND fecha_factura >= ? AND fecha_factura <= ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `, ['procesado', '2024-01-01', '2025-12-31', 25, 0]);
      console.log('✅ Consulta combinada exitosa:', facturas5.length, 'facturas');
    } catch (error) {
      console.log('❌ Consulta combinada falló:', error.message);
    }
    
    // 6. Probar con diferentes tipos de parámetros
    console.log('\n6️⃣ Probando con diferentes tipos...');
    const facturas6 = await executeQuery(`
      SELECT id, numero_factura, emisor_nombre, estado
      FROM facturas 
      WHERE estado = ? AND fecha_factura >= ?
      LIMIT ? OFFSET ?
    `, ['procesado', '2024-01-01', 5, 0]);
    console.log('✅ Consulta con tipos mixtos exitosa:', facturas6.length, 'facturas');
    
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
  testSimpleFacturas()
    .then(() => {
      console.log('\n✅ Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en script:', error);
      process.exit(1);
    });
}

module.exports = { testSimpleFacturas }; 