const { executeQuery } = require('../src/config/database');

async function testReporteITBMS() {
  try {
    console.log('🔍 Probando endpoint de reporte ITBMS...');
    
    // Parámetros de la URL: /api/v1/reportes/itbms?mes=12&año=2025
    const filtros = {
      mes: 12,
      año: 2025,
      formato: 'json'
    };
    
    console.log('📋 Filtros:', filtros);
    
    // Calcular fechas basadas en mes y año
    if (filtros.mes && filtros.año) {
      const fechaInicio = new Date(filtros.año, filtros.mes - 1, 1);
      const fechaFin = new Date(filtros.año, filtros.mes, 0); // Último día del mes
      
      filtros.fechaInicio = fechaInicio.toISOString().split('T')[0];
      filtros.fechaFin = fechaFin.toISOString().split('T')[0];
    }
    
    console.log('📅 Fechas calculadas:', {
      fechaInicio: filtros.fechaInicio,
      fechaFin: filtros.fechaFin
    });
    
    // Simular la consulta del servicio
    let whereClause = 'WHERE itbms > 0';
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
    
    // Verificar datos disponibles
    console.log('\n1️⃣ Verificando datos disponibles...');
    const facturas = await executeQuery(`
      SELECT 
        id,
        numero_factura,
        fecha_factura,
        subtotal,
        itbms,
        total,
        emisor_nombre
      FROM facturas 
      ${whereClause}
      ORDER BY fecha_factura DESC
      LIMIT 5
    `, params);
    
    console.log('📊 Facturas con ITBMS encontradas:', facturas.length);
    facturas.forEach(f => {
      console.log(`   - ${f.numero_factura} | ${f.fecha_factura} | Subtotal: $${f.subtotal} | ITBMS: $${f.itbms} | Total: $${f.total}`);
    });
    
    // Resumen general de ITBMS
    console.log('\n2️⃣ Generando resumen general de ITBMS...');
    const [resumen] = await executeQuery(`
      SELECT 
        COUNT(*) as facturas_con_itbms,
        SUM(subtotal) as base_gravable,
        SUM(itbms) as total_itbms,
        AVG(itbms) as promedio_itbms,
        SUM(total) as total_con_itbms,
        AVG((itbms / subtotal) * 100) as tasa_promedio_itbms
      FROM facturas 
      ${whereClause}
      AND subtotal > 0
    `, params);
    
    console.log('📊 Resumen ITBMS:', {
      facturas_con_itbms: resumen.facturas_con_itbms,
      base_gravable: parseFloat(resumen.base_gravable || 0).toFixed(2),
      total_itbms: parseFloat(resumen.total_itbms || 0).toFixed(2),
      promedio_itbms: parseFloat(resumen.promedio_itbms || 0).toFixed(2),
      total_con_itbms: parseFloat(resumen.total_con_itbms || 0).toFixed(2),
      tasa_promedio_itbms: parseFloat(resumen.tasa_promedio_itbms || 0).toFixed(2) + '%'
    });
    
    // ITBMS por mes
    console.log('\n3️⃣ Generando ITBMS por mes...');
    const itbmsPorMes = await executeQuery(`
      SELECT 
        DATE_FORMAT(fecha_factura, '%Y-%m') as mes,
        COUNT(*) as facturas,
        SUM(subtotal) as base_gravable,
        SUM(itbms) as total_itbms,
        AVG((itbms / subtotal) * 100) as tasa_promedio
      FROM facturas 
      ${whereClause}
      AND subtotal > 0
      GROUP BY DATE_FORMAT(fecha_factura, '%Y-%m')
      ORDER BY mes
    `, params);
    
    console.log('📊 ITBMS por mes:', itbmsPorMes.length, 'períodos');
    itbmsPorMes.forEach(r => {
      console.log(`   - ${r.mes}: ${r.facturas} facturas, Base: $${parseFloat(r.base_gravable || 0).toFixed(2)}, ITBMS: $${parseFloat(r.total_itbms || 0).toFixed(2)}`);
    });
    
    // ITBMS por emisor
    console.log('\n4️⃣ Generando ITBMS por emisor...');
    const itbmsPorEmisor = await executeQuery(`
      SELECT 
        emisor_ruc,
        emisor_nombre,
        COUNT(*) as facturas,
        SUM(subtotal) as base_gravable,
        SUM(itbms) as total_itbms,
        AVG((itbms / subtotal) * 100) as tasa_promedio
      FROM facturas 
      ${whereClause}
      AND subtotal > 0
      AND emisor_nombre IS NOT NULL
      GROUP BY emisor_ruc, emisor_nombre
      ORDER BY total_itbms DESC
      LIMIT 10
    `, params);
    
    console.log('📊 ITBMS por emisor:', itbmsPorEmisor.length, 'emisores');
    itbmsPorEmisor.forEach(e => {
      console.log(`   - ${e.emisor_nombre} (${e.emisor_ruc}): ${e.facturas} facturas, ITBMS: $${parseFloat(e.total_itbms || 0).toFixed(2)}`);
    });
    
    // Simular respuesta JSON
    console.log('\n5️⃣ Simulando respuesta JSON...');
    const reporte = {
      resumen: {
        facturas_con_itbms: resumen.facturas_con_itbms,
        base_gravable: parseFloat(resumen.base_gravable || 0),
        total_itbms: parseFloat(resumen.total_itbms || 0),
        promedio_itbms: parseFloat(resumen.promedio_itbms || 0),
        total_con_itbms: parseFloat(resumen.total_con_itbms || 0),
        tasa_promedio_itbms: parseFloat(resumen.tasa_promedio_itbms || 0)
      },
      por_mes: itbmsPorMes.map(row => ({
        mes: row.mes,
        facturas: row.facturas,
        base_gravable: parseFloat(row.base_gravable || 0),
        total_itbms: parseFloat(row.total_itbms || 0),
        tasa_promedio: parseFloat(row.tasa_promedio || 0)
      })),
      por_emisor: itbmsPorEmisor.map(row => ({
        emisor_ruc: row.emisor_ruc,
        emisor_nombre: row.emisor_nombre,
        facturas: row.facturas,
        base_gravable: parseFloat(row.base_gravable || 0),
        total_itbms: parseFloat(row.total_itbms || 0),
        tasa_promedio: parseFloat(row.tasa_promedio || 0)
      }))
    };
    
    console.log('📋 Respuesta JSON simulada:');
    console.log(JSON.stringify({
      success: true,
      data: reporte,
      formato: filtros.formato,
      filtros: {
        mes: filtros.mes,
        año: filtros.año,
        fechaInicio: filtros.fechaInicio,
        fechaFin: filtros.fechaFin
      }
    }, null, 2));
    
    // Resumen final
    console.log('\n6️⃣ Resumen final:');
    console.log(`   - Mes solicitado: ${filtros.mes}/${filtros.año}`);
    console.log(`   - Rango de fechas: ${filtros.fechaInicio} a ${filtros.fechaFin}`);
    console.log(`   - Facturas con ITBMS: ${resumen.facturas_con_itbms}`);
    console.log(`   - Total ITBMS: $${parseFloat(resumen.total_itbms || 0).toFixed(2)}`);
    console.log(`   - Formato: ${filtros.formato}`);
    
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
  testReporteITBMS()
    .then(() => {
      console.log('\n✅ Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en script:', error);
      process.exit(1);
    });
}

module.exports = { testReporteITBMS }; 