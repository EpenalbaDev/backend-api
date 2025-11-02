const { executeQuery } = require('../src/config/database');

async function testExactParams() {
  try {
    console.log('🔍 Probando parámetros exactos de la URL...');
    
    // Parámetros exactos de la URL: /api/v1/facturas?page=1&limit=25&estado=procesado&fechaInicio=2024-01-01&fechaFin=2025-12-31
    const filtros = {
      page: '1',
      limit: '25',
      estado: 'procesado',
      fechaInicio: '2024-01-01',
      fechaFin: '2025-12-31'
    };
    
    console.log('📋 Filtros exactos:', filtros);
    
    // Construir WHERE clause exactamente como en el servicio
    let whereClause = 'WHERE 1=1';
    let params = [];

    if (filtros.estado && typeof filtros.estado === 'string' && filtros.estado.trim()) {
      whereClause += ' AND estado = ?';
      params.push(filtros.estado.trim());
    }

    if (filtros.fechaInicio && typeof filtros.fechaInicio === 'string' && filtros.fechaInicio.trim()) {
      whereClause += ' AND fecha_factura >= ?';
      params.push(filtros.fechaInicio.trim());
    }

    if (filtros.fechaFin && typeof filtros.fechaFin === 'string' && filtros.fechaFin.trim()) {
      whereClause += ' AND fecha_factura <= ?';
      params.push(filtros.fechaFin.trim());
    }
    
    // Calcular offset exactamente como en el servicio
    const limitInt = parseInt(filtros.limit) || 25;
    const pageInt = parseInt(filtros.page) || 1;
    const offset = Math.floor((pageInt - 1) * limitInt);
    
    console.log('🔍 WHERE clause:', whereClause);
    console.log('📋 Parámetros WHERE:', params);
    console.log('📊 Limit:', limitInt, 'Offset:', offset);
    
    // Verificar que todos los parámetros sean válidos
    const allParams = [...params, limitInt, offset];
    console.log('📋 Todos los parámetros:', allParams.map(p => ({ value: p, type: typeof p })));
    
    // Filtrar parámetros inválidos
    const validParams = allParams.filter(p => p !== undefined && p !== null && p !== '');
    console.log('📋 Parámetros válidos:', validParams.map(p => ({ value: p, type: typeof p })));
    
    // Probar consulta
    console.log('\n🔍 Probando consulta...');
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
    `, validParams);
    
    console.log('✅ Consulta exitosa');
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
  testExactParams()
    .then(() => {
      console.log('\n✅ Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en script:', error);
      process.exit(1);
    });
}

module.exports = { testExactParams }; 