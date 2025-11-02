const { executeQuery } = require('../src/config/database');

async function testReporteVentas() {
  try {
    console.log('🔍 Probando endpoint de reporte de ventas...');
    
    // Parámetros de la URL: /api/v1/reportes/ventas?fechaInicio=2024-01-01&fechaFin=2024-12-31&formato=json
    const filtros = {
      fechaInicio: '2024-01-01',
      fechaFin: '2024-12-31',
      formato: 'json',
      agruparPor: 'mes'
    };
    
    console.log('📋 Filtros:', filtros);
    
    // Simular la consulta del servicio
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
    
    console.log('🔍 WHERE clause:', whereClause);
    console.log('📋 Parámetros:', params);
    
    // Consulta básica para verificar datos
    console.log('\n1️⃣ Verificando datos disponibles...');
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
      LIMIT 5
    `, params);
    
    console.log('📊 Facturas encontradas:', facturas.length);
    facturas.forEach(f => {
      console.log(`   - ID: ${f.id}, Número: ${f.numero_factura}, Fecha: ${f.fecha_factura}, Total: $${f.total}, Estado: ${f.estado}`);
    });
    
    // Simular reporte de ventas por mes
    console.log('\n2️⃣ Generando reporte de ventas por mes...');
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
    
    // Simular reporte de ventas por emisor
    console.log('\n3️⃣ Generando reporte de ventas por emisor...');
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
    
    // Simular conversión a CSV
    console.log('\n4️⃣ Simulando conversión a CSV...');
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
      console.log('📋 CSV generado (primeras 3 líneas):');
      console.log(csvData.split('\n').slice(0, 3).join('\n'));
    }
    
    // Resumen final
    console.log('\n5️⃣ Resumen del reporte:');
    const totalFacturas = facturas.length;
    const totalVentas = facturas.reduce((sum, f) => sum + parseFloat(f.total || 0), 0);
    const promedioVenta = totalFacturas > 0 ? totalVentas / totalFacturas : 0;
    
    console.log(`   - Total facturas: ${totalFacturas}`);
    console.log(`   - Ventas totales: $${totalVentas.toFixed(2)}`);
    console.log(`   - Promedio por factura: $${promedioVenta.toFixed(2)}`);
    console.log(`   - Formato solicitado: ${filtros.formato}`);
    
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
  testReporteVentas()
    .then(() => {
      console.log('\n✅ Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en script:', error);
      process.exit(1);
    });
}

module.exports = { testReporteVentas }; 