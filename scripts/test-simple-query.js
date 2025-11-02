const { executeQuery } = require('../src/config/database');

async function testSimpleQuery() {
  try {
    console.log('🔍 Probando consulta simple sin parámetros dinámicos...');
    
    // Consulta simple sin WHERE dinámico
    const facturas = await executeQuery(`
      SELECT 
        id,
        numero_factura,
        emisor_nombre,
        emisor_ruc,
        receptor_nombre,
        fecha_factura,
        subtotal,
        descuento,
        itbms,
        total,
        estado,
        confianza_ocr,
        procesado_por,
        created_at,
        updated_at
      FROM facturas 
      WHERE estado = 'procesado'
      ORDER BY created_at DESC
      LIMIT 25 OFFSET 0
    `);
    
    console.log('✅ Consulta simple exitosa');
    console.log('📊 Facturas encontradas:', facturas.length);
    
    if (facturas.length > 0) {
      console.log('📋 Primera factura:', {
        id: facturas[0].id,
        numero_factura: facturas[0].numero_factura,
        emisor_nombre: facturas[0].emisor_nombre,
        estado: facturas[0].estado,
        fecha_factura: facturas[0].fecha_factura
      });
    }
    
    // Probar con parámetros simples
    console.log('\n🔍 Probando con parámetros simples...');
    const facturasWithParams = await executeQuery(`
      SELECT 
        id,
        numero_factura,
        emisor_nombre,
        estado
      FROM facturas 
      WHERE estado = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, ['procesado', 25, 0]);
    
    console.log('✅ Consulta con parámetros simples exitosa');
    console.log('📊 Facturas encontradas:', facturasWithParams.length);
    
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
  testSimpleQuery()
    .then(() => {
      console.log('\n✅ Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en script:', error);
      process.exit(1);
    });
}

module.exports = { testSimpleQuery }; 