const { executeQuery } = require('../src/config/database');

async function testReporteVentasWithData() {
  try {
    console.log('🔍 Probando reporte de ventas con datos existentes...');
    
    // Primero, ver qué fechas tenemos disponibles
    console.log('\n1️⃣ Verificando fechas disponibles...');
    const fechas = await executeQuery(`
      SELECT 
        MIN(fecha_factura) as fecha_minima,
        MAX(fecha_factura) as fecha_maxima,
        COUNT(*) as total_facturas
      FROM facturas
    `);
    
    console.log('📊 Rango de fechas:', {
      fecha_minima: fechas[0].fecha_minima,
      fecha_maxima: fechas[0].fecha_maxima,
      total_facturas: fechas[0].total_facturas
    });
    
    // Usar un rango que incluya todos los datos
    const filtros = {
      fechaInicio: '2010-01-01',
      fechaFin: '2025-12-31',
      formato: 'json',
      agruparPor: 'mes'
    };
    
    console.log('\n2️⃣ Probando con rango amplio:', filtros);
    
    let whereClause = 'WHERE 1=1';
    let params = [];
    
    if (filtros.fechaInicio) {
      whereClause += ' AND fecha_factura >= ?';
      params.push(filtros.fechaInicio);
    }
    
    if (filtros.fechaFin) {
      whereClause += ' AND fecha_factura <= ?';
      params.push(filtros.fechaFin);
    }
    
    // Consulta básica
    const facturas = await executeQuery(`
      SELECT 
        id,
        numero_factura,
        fecha_factura,
        total,
        estado,
        emisor_nombre
      FROM facturas 
      ${whereClause}
      ORDER BY fecha_factura DESC
    `, params);
    
    console.log('📊 Facturas encontradas:', facturas.length);
    facturas.forEach(f => {
      console.log(`   - ${f.numero_factura} | ${f.fecha_factura} | $${f.total} | ${f.emisor_nombre}`);
    });
    
    // Reporte de ventas por mes
    console.log('\n3️⃣ Reporte de ventas por mes...');
    const reporteMensual = await executeQuery(`
      SELECT 
        DATE_FORMAT(fecha_factura, '%Y-%m') as periodo,
        COUNT(*) as cantidad_facturas,
        SUM(total) as ventas_totales,
        AVG(total) as promedio_venta,
        MIN(total) as venta_minima,
        MAX(total) as venta_maxima
      FROM facturas 
      ${whereClause}
      GROUP BY DATE_FORMAT(fecha_factura, '%Y-%m')
      ORDER BY periodo DESC
    `, params);
    
    console.log('📊 Períodos encontrados:', reporteMensual.length);
    reporteMensual.forEach(r => {
      console.log(`   - ${r.periodo}: ${r.cantidad_facturas} facturas, $${parseFloat(r.ventas_totales || 0).toFixed(2)} total`);
    });
    
    // Reporte de ventas por emisor
    console.log('\n4️⃣ Reporte de ventas por emisor...');
    const reporteEmisores = await executeQuery(`
      SELECT 
        emisor_ruc,
        emisor_nombre,
        COUNT(*) as cantidad_facturas,
        SUM(total) as ventas_totales,
        AVG(total) as promedio_venta
      FROM facturas 
      ${whereClause}
      GROUP BY emisor_ruc, emisor_nombre
      ORDER BY ventas_totales DESC
    `, params);
    
    console.log('📊 Emisores encontrados:', reporteEmisores.length);
    reporteEmisores.forEach(e => {
      console.log(`   - ${e.emisor_nombre} (${e.emisor_ruc}): ${e.cantidad_facturas} facturas, $${parseFloat(e.ventas_totales || 0).toFixed(2)} total`);
    });
    
    // Simular diferentes formatos
    console.log('\n5️⃣ Simulando diferentes formatos...');
    
    // Formato JSON
    console.log('📋 Formato JSON:');
    console.log(JSON.stringify({
      success: true,
      data: reporteMensual,
      formato: 'json'
    }, null, 2));
    
    // Formato CSV
    console.log('\n📋 Formato CSV:');
    if (reporteMensual.length > 0) {
      const headers = Object.keys(reporteMensual[0]);
      const headerRow = headers.join(',');
      const dataRows = reporteMensual.map(row => {
        return headers.map(header => {
          const value = row[header];
          const escapedValue = String(value).replace(/"/g, '""');
          return escapedValue.includes(',') ? `"${escapedValue}"` : escapedValue;
        }).join(',');
      });
      
      const csvData = [headerRow, ...dataRows].join('\n');
      console.log(csvData);
    }
    
    // Resumen final
    console.log('\n6️⃣ Resumen final:');
    const totalFacturas = facturas.length;
    const totalVentas = facturas.reduce((sum, f) => sum + parseFloat(f.total || 0), 0);
    const promedioVenta = totalFacturas > 0 ? totalVentas / totalFacturas : 0;
    
    console.log(`   - Total facturas: ${totalFacturas}`);
    console.log(`   - Ventas totales: $${totalVentas.toFixed(2)}`);
    console.log(`   - Promedio por factura: $${promedioVenta.toFixed(2)}`);
    console.log(`   - Formato soportado: ${filtros.formato}`);
    
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
  testReporteVentasWithData()
    .then(() => {
      console.log('\n✅ Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en script:', error);
      process.exit(1);
    });
}

module.exports = { testReporteVentasWithData }; 