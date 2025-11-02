const { executeQuery } = require('../src/config/database');

async function testReporteITBMSWithData() {
  try {
    console.log('🔍 Probando reporte ITBMS con datos existentes...');
    
    // Primero, ver qué datos tenemos disponibles
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
      ORDER BY fecha_factura DESC
    `);
    
    console.log('📊 Total facturas:', facturas.length);
    facturas.forEach(f => {
      console.log(`   - ${f.numero_factura} | ${f.fecha_factura} | Subtotal: $${f.subtotal} | ITBMS: $${f.itbms} | Total: $${f.total}`);
    });
    
    // Verificar qué meses tienen datos
    console.log('\n2️⃣ Verificando meses con datos...');
    const meses = await executeQuery(`
      SELECT 
        DATE_FORMAT(fecha_factura, '%Y-%m') as mes,
        COUNT(*) as facturas,
        SUM(itbms) as total_itbms
      FROM facturas 
      WHERE itbms > 0
      GROUP BY DATE_FORMAT(fecha_factura, '%Y-%m')
      ORDER BY mes
    `);
    
    console.log('📊 Meses con ITBMS:', meses.length);
    meses.forEach(m => {
      console.log(`   - ${m.mes}: ${m.facturas} facturas, ITBMS: $${parseFloat(m.total_itbms || 0).toFixed(2)}`);
    });
    
    // Probar con diferentes meses
    const mesesParaProbar = [
      { mes: 7, año: 2025 },
      { mes: 11, año: 2012 },
      { mes: 12, año: 2025 } // Sin datos
    ];
    
    for (const { mes, año } of mesesParaProbar) {
      console.log(`\n3️⃣ Probando mes ${mes}/${año}...`);
      
      // Calcular fechas
      const fechaInicio = new Date(año, mes - 1, 1);
      const fechaFin = new Date(año, mes, 0);
      
      const filtros = {
        fechaInicio: fechaInicio.toISOString().split('T')[0],
        fechaFin: fechaFin.toISOString().split('T')[0]
      };
      
      console.log(`📅 Rango: ${filtros.fechaInicio} a ${filtros.fechaFin}`);
      
      // Consulta
      let whereClause = 'WHERE itbms > 0';
      let params = [filtros.fechaInicio, filtros.fechaFin];
      
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
        AND fecha_factura >= ?
        AND fecha_factura <= ?
        AND subtotal > 0
      `, params);
      
      console.log(`📊 Resultado: ${resumen.facturas_con_itbms} facturas, $${parseFloat(resumen.total_itbms || 0).toFixed(2)} ITBMS`);
    }
    
    // Probar con un rango amplio que incluya todos los datos
    console.log('\n4️⃣ Probando con rango amplio (todos los datos)...');
    const filtrosAmplios = {
      fechaInicio: '2010-01-01',
      fechaFin: '2025-12-31'
    };
    
    let whereClause = 'WHERE itbms > 0';
    let params = [filtrosAmplios.fechaInicio, filtrosAmplios.fechaFin];
    
    // Resumen general
    const [resumenGeneral] = await executeQuery(`
      SELECT 
        COUNT(*) as facturas_con_itbms,
        SUM(subtotal) as base_gravable,
        SUM(itbms) as total_itbms,
        AVG(itbms) as promedio_itbms,
        SUM(total) as total_con_itbms,
        AVG((itbms / subtotal) * 100) as tasa_promedio_itbms
      FROM facturas 
      ${whereClause}
      AND fecha_factura >= ?
      AND fecha_factura <= ?
      AND subtotal > 0
    `, params);
    
    console.log('📊 Resumen general ITBMS:', {
      facturas_con_itbms: resumenGeneral.facturas_con_itbms,
      base_gravable: parseFloat(resumenGeneral.base_gravable || 0).toFixed(2),
      total_itbms: parseFloat(resumenGeneral.total_itbms || 0).toFixed(2),
      promedio_itbms: parseFloat(resumenGeneral.promedio_itbms || 0).toFixed(2),
      total_con_itbms: parseFloat(resumenGeneral.total_con_itbms || 0).toFixed(2),
      tasa_promedio_itbms: parseFloat(resumenGeneral.tasa_promedio_itbms || 0).toFixed(2) + '%'
    });
    
    // ITBMS por mes
    const itbmsPorMes = await executeQuery(`
      SELECT 
        DATE_FORMAT(fecha_factura, '%Y-%m') as mes,
        COUNT(*) as facturas,
        SUM(subtotal) as base_gravable,
        SUM(itbms) as total_itbms,
        AVG((itbms / subtotal) * 100) as tasa_promedio
      FROM facturas 
      ${whereClause}
      AND fecha_factura >= ?
      AND fecha_factura <= ?
      AND subtotal > 0
      GROUP BY DATE_FORMAT(fecha_factura, '%Y-%m')
      ORDER BY mes
    `, params);
    
    console.log('📊 ITBMS por mes:', itbmsPorMes.length, 'períodos');
    itbmsPorMes.forEach(r => {
      console.log(`   - ${r.mes}: ${r.facturas} facturas, Base: $${parseFloat(r.base_gravable || 0).toFixed(2)}, ITBMS: $${parseFloat(r.total_itbms || 0).toFixed(2)}`);
    });
    
    // ITBMS por emisor
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
      AND fecha_factura >= ?
      AND fecha_factura <= ?
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
    
    // Simular respuesta final
    console.log('\n5️⃣ Respuesta final simulada:');
    const reporte = {
      resumen: {
        facturas_con_itbms: resumenGeneral.facturas_con_itbms,
        base_gravable: parseFloat(resumenGeneral.base_gravable || 0),
        total_itbms: parseFloat(resumenGeneral.total_itbms || 0),
        promedio_itbms: parseFloat(resumenGeneral.promedio_itbms || 0),
        total_con_itbms: parseFloat(resumenGeneral.total_con_itbms || 0),
        tasa_promedio_itbms: parseFloat(resumenGeneral.tasa_promedio_itbms || 0)
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
    
    console.log(JSON.stringify({
      success: true,
      data: reporte,
      formato: 'json',
      filtros: {
        fechaInicio: filtrosAmplios.fechaInicio,
        fechaFin: filtrosAmplios.fechaFin
      }
    }, null, 2));
    
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
  testReporteITBMSWithData()
    .then(() => {
      console.log('\n✅ Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en script:', error);
      process.exit(1);
    });
}

module.exports = { testReporteITBMSWithData }; 