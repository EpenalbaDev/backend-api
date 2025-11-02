const { executeQuery } = require('../src/config/database');

async function testSuggestions() {
  try {
    console.log('🔍 Probando endpoint de sugerencias...');
    
    // Términos que sabemos que existen en la base de datos
    const testTerms = ['cable', 'wireless', 'panama', 'distribuciones', 'ficticias', 'prueba', '98765', '1015948452'];
    
    for (const term of testTerms) {
      console.log(`\n🔍 Probando sugerencias para: "${term}"`);
      
      // Simular la lógica del servicio de sugerencias
      const searchTerm = `%${term}%`;
      
      // Sugerencias de emisores
      const emisores = await executeQuery(`
        SELECT DISTINCT emisor_nombre, emisor_ruc 
        FROM facturas 
        WHERE (emisor_nombre LIKE ? OR emisor_ruc LIKE ?) 
        AND emisor_nombre IS NOT NULL 
        ORDER BY emisor_nombre 
        LIMIT 5
      `, [searchTerm, searchTerm]);

      // Sugerencias de números de factura
      const numeroFacturas = await executeQuery(`
        SELECT DISTINCT numero_factura 
        FROM facturas 
        WHERE numero_factura LIKE ? 
        AND numero_factura IS NOT NULL 
        ORDER BY numero_factura 
        LIMIT 5
      `, [searchTerm]);

      console.log(`✅ Emisores encontrados: ${emisores.length}`);
      emisores.forEach(e => {
        console.log(`  - ${e.emisor_nombre} (${e.emisor_ruc})`);
      });
      
      console.log(`✅ Números de factura encontrados: ${numeroFacturas.length}`);
      numeroFacturas.forEach(nf => {
        console.log(`  - ${nf.numero_factura}`);
      });
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
  testSuggestions()
    .then(() => {
      console.log('\n✅ Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en script:', error);
      process.exit(1);
    });
}

module.exports = { testSuggestions }; 