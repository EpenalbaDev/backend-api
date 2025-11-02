const { executeQuery } = require('../src/config/database');

async function testTopEmisores() {
  try {
    console.log('🔍 Probando endpoint de top emisores...');
    
    // Probar diferentes métricas
    const metricas = [
      { metric: 'facturas', metrica: 'total_facturas' },
      { metric: 'monto', metrica: 'monto_total' },
      { metric: 'promedio', metrica: 'promedio_factura' }
    ];
    
    for (const { metric, metrica } of metricas) {
      console.log(`\n🔍 Probando métrica: "${metric}" (${metrica})`);
      
      // Simular la consulta del servicio
      const allowedMetricas = ['total_facturas', 'monto_total', 'promedio_factura'];
      const sortField = allowedMetricas.includes(metrica) ? metrica : 'total_facturas';
      const limit = 10;
      
      console.log(`📊 Campo de ordenamiento: ${sortField}`);
      console.log(`📊 Límite: ${limit}`);
      
      const emisores = await executeQuery(`
        SELECT 
          emisor_ruc,
          emisor_nombre,
          COUNT(*) as total_facturas,
          SUM(total) as monto_total,
          AVG(total) as promedio_factura,
          MAX(fecha_factura) as ultima_factura
        FROM facturas 
        WHERE emisor_ruc IS NOT NULL AND emisor_ruc != ""
        GROUP BY emisor_ruc, emisor_nombre
        ORDER BY ${sortField} DESC
        LIMIT ?
      `, [parseInt(limit)]);
      
      console.log(`✅ Emisores encontrados: ${emisores.length}`);
      
      if (emisores.length > 0) {
        console.log('📋 Top 3 emisores:');
        emisores.slice(0, 3).forEach((emisor, index) => {
          console.log(`   ${index + 1}. ${emisor.emisor_nombre} (${emisor.emisor_ruc})`);
          console.log(`      - Total facturas: ${emisor.total_facturas}`);
          console.log(`      - Monto total: $${parseFloat(emisor.monto_total || 0).toFixed(2)}`);
          console.log(`      - Promedio factura: $${parseFloat(emisor.promedio_factura || 0).toFixed(2)}`);
          console.log(`      - Última factura: ${emisor.ultima_factura}`);
        });
      }
    }
    
    // Probar con parámetros específicos de la URL
    console.log('\n🔍 Probando con parámetros exactos de la URL:');
    console.log('   URL: /api/v1/emisores/top?limit=10&metric=facturas');
    
    const metric = 'facturas';
    const metrica = metric === 'facturas' ? 'total_facturas' : 
                   metric === 'monto' ? 'monto_total' : 
                   metric === 'promedio' ? 'promedio_factura' : 
                   'total_facturas';
    
    console.log(`📊 Métrica mapeada: ${metrica}`);
    
    const emisoresFinal = await executeQuery(`
      SELECT 
        emisor_ruc,
        emisor_nombre,
        COUNT(*) as total_facturas,
        SUM(total) as monto_total,
        AVG(total) as promedio_factura,
        MAX(fecha_factura) as ultima_factura
      FROM facturas 
      WHERE emisor_ruc IS NOT NULL AND emisor_ruc != ""
      GROUP BY emisor_ruc, emisor_nombre
      ORDER BY ${metrica} DESC
      LIMIT 10
    `, []);
    
    console.log(`✅ Resultado final: ${emisoresFinal.length} emisores`);
    
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
  testTopEmisores()
    .then(() => {
      console.log('\n✅ Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en script:', error);
      process.exit(1);
    });
}

module.exports = { testTopEmisores }; 