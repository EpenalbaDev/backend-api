const { executeQuery } = require('../src/config/database');

async function testSearchWithData() {
  try {
    console.log('🔍 Probando búsqueda con datos existentes...');
    
    // Primero, ver qué datos tenemos
    console.log('\n1️⃣ Verificando datos disponibles...');
    const allFacturas = await executeQuery(`
      SELECT id, numero_factura, emisor_nombre, estado 
      FROM facturas 
      LIMIT 5
    `);
    
    console.log('📊 Facturas disponibles:', allFacturas.length);
    allFacturas.forEach(f => {
      console.log(`  - ID: ${f.id}, Número: ${f.numero_factura}, Emisor: ${f.emisor_nombre}, Estado: ${f.estado}`);
    });
    
    // Probar búsqueda con diferentes términos
    const searchTerms = ['cable', 'wireless', 'panama', '1015948452'];
    
    for (const term of searchTerms) {
      console.log(`\n🔍 Probando búsqueda con término: "${term}"`);
      
      const whereClause = `WHERE (
        numero_factura LIKE ? OR 
        emisor_nombre LIKE ? OR 
        receptor_nombre LIKE ? OR
        emisor_ruc LIKE ? OR
        EXISTS (
          SELECT 1 FROM factura_items fi 
          WHERE fi.factura_id = facturas.id 
          AND fi.descripcion LIKE ?
        )
      ) AND estado = 'procesado'`;

      const searchTerm = `%${term}%`;
      const params = [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm];
      
      const facturas = await executeQuery(`
        SELECT id, numero_factura, emisor_nombre, estado
        FROM facturas 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT 5
      `, params);
      
      console.log(`✅ Encontradas: ${facturas.length} facturas`);
      if (facturas.length > 0) {
        facturas.forEach(f => {
          console.log(`  - ${f.numero_factura} | ${f.emisor_nombre} | ${f.estado}`);
        });
      }
    }
    
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
  testSearchWithData()
    .then(() => {
      console.log('\n✅ Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en script:', error);
      process.exit(1);
    });
}

module.exports = { testSearchWithData }; 