const { executeQuery } = require('../src/config/database');

async function testSearchEndpoint() {
  try {
    console.log('🔍 Probando endpoint de búsqueda...');
    
    // Parámetros exactos de la URL: /api/v1/facturas/search?search=factura&estado=procesado&page=1&limit=10
    const filtros = {
      search: 'factura',
      estado: 'procesado',
      page: 1,
      limit: 10
    };
    
    console.log('📋 Filtros de búsqueda:', filtros);
    
    // Construir WHERE clause para búsqueda
    let whereClause = `WHERE (
      numero_factura LIKE ? OR 
      emisor_nombre LIKE ? OR 
      receptor_nombre LIKE ? OR
      emisor_ruc LIKE ? OR
      EXISTS (
        SELECT 1 FROM factura_items fi 
        WHERE fi.factura_id = facturas.id 
        AND fi.descripcion LIKE ?
      )
    )`;

    const searchTerm = `%${filtros.search}%`;
    let params = [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm];

    if (filtros.estado) {
      whereClause += ' AND estado = ?';
      params.push(filtros.estado);
    }

    // Calcular offset para paginación
    const limitInt = parseInt(filtros.limit) || 10;
    const pageInt = parseInt(filtros.page) || 1;
    const offset = Math.floor((pageInt - 1) * limitInt);
    
    console.log('🔍 WHERE clause:', whereClause);
    console.log('📋 Parámetros WHERE:', params);
    console.log('📊 Limit:', limitInt, 'Offset:', offset);
    
    // Probar consulta de búsqueda
    console.log('\n🔍 Probando consulta de búsqueda...');
    const facturas = await executeQuery(`
      SELECT 
        id,
        numero_factura,
        emisor_nombre,
        emisor_ruc,
        fecha_factura,
        total,
        estado,
        confianza_ocr
      FROM facturas 
      ${whereClause}
      ORDER BY 
        CASE 
          WHEN numero_factura LIKE ? THEN 1
          WHEN emisor_nombre LIKE ? THEN 2
          ELSE 3
        END,
        created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, searchTerm, searchTerm, limitInt, offset]);
    
    console.log('✅ Consulta de búsqueda exitosa');
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
    
    // Probar conteo para paginación
    console.log('\n🔍 Probando conteo para paginación...');
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
  testSearchEndpoint()
    .then(() => {
      console.log('\n✅ Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en script:', error);
      process.exit(1);
    });
}

module.exports = { testSearchEndpoint }; 