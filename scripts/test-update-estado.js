const { executeQuery } = require('../src/config/database');

async function testUpdateEstado() {
  try {
    console.log('🔍 Probando actualización de estado con comentario...');
    
    // Primero, ver qué facturas tenemos disponibles
    console.log('\n1️⃣ Verificando facturas disponibles...');
    const facturas = await executeQuery(`
      SELECT id, numero_factura, estado 
      FROM facturas 
      LIMIT 3
    `);
    
    console.log('📊 Facturas disponibles:', facturas.length);
    facturas.forEach(f => {
      console.log(`  - ID: ${f.id}, Número: ${f.numero_factura}, Estado: ${f.estado}`);
    });
    
    if (facturas.length === 0) {
      console.log('❌ No hay facturas disponibles para probar');
      return;
    }
    
    // Tomar la primera factura para la prueba
    const facturaId = facturas[0].id;
    const estadoAnterior = facturas[0].estado;
    const nuevoEstado = 'revision';
    const comentario = 'Factura revisada y aprobada';
    const userId = 1; // Simular usuario ID
    
    console.log(`\n2️⃣ Probando actualización de estado...`);
    console.log(`   Factura ID: ${facturaId}`);
    console.log(`   Estado anterior: ${estadoAnterior}`);
    console.log(`   Nuevo estado: ${nuevoEstado}`);
    console.log(`   Comentario: ${comentario}`);
    
    // Simular la actualización
    const estadosValidos = ['pendiente', 'procesado', 'error', 'revision'];
    
    if (!estadosValidos.includes(nuevoEstado)) {
      throw new Error('Estado inválido');
    }

    // Verificar que la factura existe
    const facturaCheck = await executeQuery(`
      SELECT id, estado FROM facturas WHERE id = ?
    `, [facturaId]);

    if (facturaCheck.length === 0) {
      throw new Error('Factura no encontrada');
    }

    // Actualizar estado
    await executeQuery(`
      UPDATE facturas SET estado = ?, updated_at = NOW() WHERE id = ?
    `, [nuevoEstado, facturaId]);

    // Registrar log del cambio
    const logDetalles = {
      estado_anterior: estadoAnterior,
      estado_nuevo: nuevoEstado,
      usuario_id: userId,
      timestamp: new Date().toISOString()
    };

    if (comentario) {
      logDetalles.comentario = comentario;
    }

    await executeQuery(`
      INSERT INTO procesamiento_logs (factura_id, tipo_evento, mensaje, detalles) 
      VALUES (?, 'cambio_estado', ?, ?)
    `, [facturaId, comentario || 'Estado cambiado por usuario', JSON.stringify(logDetalles)]);

    console.log('✅ Estado actualizado correctamente');
    
    // Verificar el cambio
    console.log('\n3️⃣ Verificando el cambio...');
    const facturaActualizada = await executeQuery(`
      SELECT id, numero_factura, estado, updated_at 
      FROM facturas WHERE id = ?
    `, [facturaId]);
    
    console.log('📊 Factura actualizada:', {
      id: facturaActualizada[0].id,
      numero_factura: facturaActualizada[0].numero_factura,
      estado: facturaActualizada[0].estado,
      updated_at: facturaActualizada[0].updated_at
    });
    
    // Verificar el log
    console.log('\n4️⃣ Verificando log de cambio...');
    const logs = await executeQuery(`
      SELECT tipo_evento, mensaje, detalles 
      FROM procesamiento_logs 
      WHERE factura_id = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `, [facturaId]);
    
    if (logs.length > 0) {
      console.log('📋 Log registrado:', {
        tipo_evento: logs[0].tipo_evento,
        mensaje: logs[0].mensaje,
        detalles: JSON.parse(logs[0].detalles)
      });
    }
    
    // Revertir el cambio para no afectar los datos
    console.log('\n5️⃣ Revirtiendo cambio...');
    await executeQuery(`
      UPDATE facturas SET estado = ?, updated_at = NOW() WHERE id = ?
    `, [estadoAnterior, facturaId]);
    
    console.log('✅ Cambio revertido');
    
  } catch (error) {
    console.error('❌ Error en prueba:', error);
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
  testUpdateEstado()
    .then(() => {
      console.log('\n✅ Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en script:', error);
      process.exit(1);
    });
}

module.exports = { testUpdateEstado }; 