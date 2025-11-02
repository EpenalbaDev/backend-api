const { executeQuery } = require('../src/config/database');

async function testFacturasFixed() {
  try {
    console.log('🔍 Probando consulta de facturas con tipos corregidos...');
    
    // Parámetros de prueba
    const filtros = {
      page: 1,
      limit: 25,
      estado: 'procesado',
      fechaInicio: '2024-01-01',
      fechaFin: '2025-12-31'
    };
    
    console.log('📋 Filtros de prueba:', filtros);
    
    // Construir WHERE clause manualmente
    let whereClause = 'WHERE 1=1';
    let params = [];
    
    if (filtros.estado) {
      whereClause += ' AND estado = ?';
      params.push(filtros.estado);
    }
    
    if (filtros.fechaInicio) {
      whereClause += ' AND fecha_factura >= ?';
      params.push(filtros.fechaInicio);
    }
    
    if (filtros.fechaFin) {
      whereClause += ' AND fecha_factura <= ?';
      params.push(filtros.fechaFin);
    }
    
    // Asegurar tipos correctos
    const limitInt = parseInt(filtros.limit) || 25;
    const pageInt = parseInt(filtros.page) || 1;
    const offset = Math.floor((pageInt - 1) * limitInt);
    
    console.log('🔍 WHERE clause:', whereClause);
    console.log('📋 Parámetros WHERE:', params);
    console.log('📊 Limit (tipo):', limitInt, typeof limitInt);
    console.log('📊 Offset (tipo):', offset, typeof offset);
    
    // Probar consulta completa con tipos corregidos
    console.log('\n🔍 Probando consulta completa...');
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
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limitInt, offset]);
    
    console.log('✅ Consulta completa exitosa');
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
    
    // Probar paginación
    console.log('\n🔍 Probando paginación...');
    const [countResult] = await executeQuery(`
      SELECT COUNT(*) as total FROM facturas ${whereClause}
    `, params);
    
    const total = countResult.total;
    const totalPages = Math.ceil(total / limitInt);
    
    console.log('📊 Total de facturas:', total);
    console.log('📊 Total de páginas:', totalPages);
    console.log('📊 Página actual:', pageInt);
    console.log('📊 Items por página:', limitInt);
    
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
  testFacturasFixed()
    .then(() => {
      console.log('\n✅ Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en script:', error);
      process.exit(1);
    });
}

module.exports = { testFacturasFixed }; 