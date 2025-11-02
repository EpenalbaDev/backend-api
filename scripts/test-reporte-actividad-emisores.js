const { executeQuery } = require('../src/config/database');

async function testReporteActividadEmisores() {
  try {
    console.log('🔍 Probando endpoint de reporte de actividad de emisores...');
    
    // Parámetros de la URL: /api/v1/reportes/actividad-emisores?periodo=30
    const filtros = {
      periodo: 30,
      limit: 20,
      formato: 'json'
    };
    
    console.log('📋 Filtros:', filtros);
    
    // Calcular fechas basadas en periodo
    if (filtros.periodo && !filtros.fechaInicio && !filtros.fechaFin) {
      const fechaFin = new Date();
      const fechaInicio = new Date();
      fechaInicio.setDate(fechaInicio.getDate() - filtros.periodo);
      
      filtros.fechaInicio = fechaInicio.toISOString().split('T')[0];
      filtros.fechaFin = fechaFin.toISOString().split('T')[0];
    }
    
    console.log('📅 Fechas calculadas:', {
      fechaInicio: filtros.fechaInicio,
      fechaFin: filtros.fechaFin
    });
    
    // Simular la consulta del servicio
    let whereClause = 'WHERE emisor_ruc IS NOT NULL AND emisor_ruc != ""';
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
        total,
        emisor_nombre,
        emisor_ruc
      FROM facturas 
      ${whereClause}
      ORDER BY fecha_factura DESC
      LIMIT 5
    `, params);
    
    console.log('📊 Facturas encontradas:', facturas.length);
    facturas.forEach(f => {
      console.log(`   - ${f.numero_factura} | ${f.fecha_factura} | $${f.total} | ${f.emisor_nombre}`);
    });
    
    // Análisis de actividad de emisores
    console.log('\n2️⃣ Generando análisis de actividad de emisores...');
    const actividadEmisores = await executeQuery(`
      SELECT 
        emisor_ruc,
        emisor_nombre,
        COUNT(*) as total_facturas,
        SUM(total) as monto_total,
        AVG(total) as promedio_factura,
        MIN(fecha_factura) as primera_factura,
        MAX(fecha_factura) as ultima_factura,
        DATEDIFF(MAX(fecha_factura), MIN(fecha_factura)) as dias_activo,
        COUNT(DISTINCT DATE(fecha_factura)) as dias_con_facturas,
        AVG(confianza_ocr) as confianza_promedio,
        COUNT(CASE WHEN estado = 'error' THEN 1 END) as facturas_error
      FROM facturas 
      ${whereClause}
      GROUP BY emisor_ruc, emisor_nombre
      HAVING total_facturas > 0
      ORDER BY total_facturas DESC
      LIMIT ?
    `, [...params, parseInt(filtros.limit)]);
    
    console.log('📊 Emisores activos encontrados:', actividadEmisores.length);
    actividadEmisores.forEach(e => {
      console.log(`   - ${e.emisor_nombre} (${e.emisor_ruc}): ${e.total_facturas} facturas, $${parseFloat(e.monto_total || 0).toFixed(2)} total`);
    });
    
    // Emisores nuevos
    console.log('\n3️⃣ Generando emisores nuevos...');
    const emisoresNuevos = await executeQuery(`
      SELECT 
        emisor_ruc,
        emisor_nombre,
        MIN(fecha_factura) as primera_factura,
        COUNT(*) as facturas_periodo
      FROM facturas 
      WHERE emisor_ruc IS NOT NULL AND emisor_ruc != ""
      AND fecha_factura >= ?
      AND fecha_factura <= ?
      GROUP BY emisor_ruc, emisor_nombre
      HAVING MIN(fecha_factura) >= ?
      AND MIN(fecha_factura) <= ?
      ORDER BY primera_factura DESC
      LIMIT 20
    `, [...params, ...params]); // Duplicar parámetros para WHERE y HAVING
    
    console.log('📊 Emisores nuevos encontrados:', emisoresNuevos.length);
    emisoresNuevos.forEach(e => {
      console.log(`   - ${e.emisor_nombre} (${e.emisor_ruc}): Primera factura ${e.primera_factura}, ${e.facturas_periodo} facturas en período`);
    });
    
    // Simular respuesta JSON
    console.log('\n4️⃣ Simulando respuesta JSON...');
    const reporte = {
      actividad_emisores: actividadEmisores.map(row => ({
        emisor_ruc: row.emisor_ruc,
        emisor_nombre: row.emisor_nombre,
        total_facturas: row.total_facturas,
        monto_total: parseFloat(row.monto_total || 0),
        promedio_factura: parseFloat(row.promedio_factura || 0),
        primera_factura: row.primera_factura,
        ultima_factura: row.ultima_factura,
        dias_activo: row.dias_activo,
        dias_con_facturas: row.dias_con_facturas,
        frecuencia_facturacion: row.dias_activo > 0 ? parseFloat((row.dias_con_facturas / row.dias_activo * 100)) : 0,
        confianza_promedio: parseFloat(row.confianza_promedio || 0),
        facturas_error: row.facturas_error
      })),
      emisores_nuevos: emisoresNuevos.map(row => ({
        emisor_ruc: row.emisor_ruc,
        emisor_nombre: row.emisor_nombre,
        primera_factura: row.primera_factura,
        facturas_periodo: row.facturas_periodo
      }))
    };
    
    console.log('📋 Respuesta JSON simulada:');
    console.log(JSON.stringify({
      success: true,
      data: reporte,
      formato: filtros.formato,
      filtros: {
        periodo: filtros.periodo,
        fechaInicio: filtros.fechaInicio,
        fechaFin: filtros.fechaFin,
        limit: filtros.limit
      }
    }, null, 2));
    
    // Resumen final
    console.log('\n5️⃣ Resumen final:');
    console.log(`   - Período solicitado: ${filtros.periodo} días`);
    console.log(`   - Rango de fechas: ${filtros.fechaInicio} a ${filtros.fechaFin}`);
    console.log(`   - Emisores activos: ${actividadEmisores.length}`);
    console.log(`   - Emisores nuevos: ${emisoresNuevos.length}`);
    console.log(`   - Límite: ${filtros.limit}`);
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
  testReporteActividadEmisores()
    .then(() => {
      console.log('\n✅ Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en script:', error);
      process.exit(1);
    });
}

module.exports = { testReporteActividadEmisores }; 