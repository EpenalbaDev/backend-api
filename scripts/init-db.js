const { executeQuery } = require('../src/config/database');
const bcrypt = require('bcryptjs');

async function initializeDatabase() {
  try {
    console.log('🚀 Inicializando base de datos...');

    // Crear usuario admin por defecto
    const adminPassword = await bcrypt.hash('admin123', 12);
    
    const adminQuery = `
      INSERT INTO usuarios (nombre, apellido, email, password, rol, activo)
      VALUES ('Admin', 'Sistema', 'admin@facturas.com', ?, 'admin', TRUE)
      ON DUPLICATE KEY UPDATE 
        password = VALUES(password),
        rol = VALUES(rol),
        activo = TRUE
    `;
    
    await executeQuery(adminQuery, [adminPassword]);
    console.log('✅ Usuario admin creado/actualizado');

    // Crear usuario de prueba
    const userPassword = await bcrypt.hash('user123', 12);
    
    const userQuery = `
      INSERT INTO usuarios (nombre, apellido, email, password, rol, activo)
      VALUES ('Usuario', 'Prueba', 'user@facturas.com', ?, 'usuario', TRUE)
      ON DUPLICATE KEY UPDATE 
        password = VALUES(password),
        rol = VALUES(rol),
        activo = TRUE
    `;
    
    await executeQuery(userQuery, [userPassword]);
    console.log('✅ Usuario de prueba creado/actualizado');

    // Crear facturas de ejemplo
    const facturasEjemplo = [
      {
        email_from: 'proveedor1@empresa.com',
        email_subject: 'Factura F001-001',
        email_date: '2024-01-15 10:30:00',
        s3_key: 'facturas/2024/01/factura1.pdf',
        emisor_nombre: 'Empresa Proveedora S.A.',
        emisor_ruc: '12345678901',
        emisor_direccion: 'Av. Principal 123, Ciudad',
        emisor_telefono: '+507 123-4567',
        receptor_nombre: 'Mi Empresa S.A.',
        receptor_ruc: '98765432109',
        receptor_direccion: 'Calle Comercial 456, Ciudad',
        numero_factura: 'F001-001',
        fecha_factura: '2024-01-15',
        subtotal: 1000.00,
        descuento: 50.00,
        itbms: 190.00,
        total: 1140.00,
        estado: 'procesado',
        confianza_ocr: 95.5,
        procesado_por: 'mistral'
      },
      {
        email_from: 'proveedor2@empresa.com',
        email_subject: 'Factura F002-001',
        email_date: '2024-01-16 14:20:00',
        s3_key: 'facturas/2024/01/factura2.pdf',
        emisor_nombre: 'Servicios Comerciales Ltda.',
        emisor_ruc: '23456789012',
        emisor_direccion: 'Calle Secundaria 789, Ciudad',
        emisor_telefono: '+507 234-5678',
        receptor_nombre: 'Mi Empresa S.A.',
        receptor_ruc: '98765432109',
        receptor_direccion: 'Calle Comercial 456, Ciudad',
        numero_factura: 'F002-001',
        fecha_factura: '2024-01-16',
        subtotal: 2500.00,
        descuento: 0.00,
        itbms: 475.00,
        total: 2975.00,
        estado: 'pendiente',
        confianza_ocr: 87.2,
        procesado_por: 'mistral'
      },
      {
        email_from: 'proveedor3@empresa.com',
        email_subject: 'Factura F003-001',
        email_date: '2024-01-17 09:15:00',
        s3_key: 'facturas/2024/01/factura3.pdf',
        emisor_nombre: 'Distribuidora Nacional S.A.',
        emisor_ruc: '34567890123',
        emisor_direccion: 'Zona Industrial 456, Ciudad',
        emisor_telefono: '+507 345-6789',
        receptor_nombre: 'Mi Empresa S.A.',
        receptor_ruc: '98765432109',
        receptor_direccion: 'Calle Comercial 456, Ciudad',
        numero_factura: 'F003-001',
        fecha_factura: '2024-01-17',
        subtotal: 3500.00,
        descuento: 175.00,
        itbms: 665.00,
        total: 3990.00,
        estado: 'revisado',
        confianza_ocr: 92.8,
        procesado_por: 'mistral'
      }
    ];

    for (const factura of facturasEjemplo) {
      const facturaQuery = `
        INSERT INTO facturas (
          email_from, email_subject, email_date, s3_key,
          emisor_nombre, emisor_ruc, emisor_direccion, emisor_telefono,
          receptor_nombre, receptor_ruc, receptor_direccion,
          numero_factura, fecha_factura, subtotal, descuento, itbms, total,
          estado, confianza_ocr, procesado_por
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          estado = VALUES(estado),
          confianza_ocr = VALUES(confianza_ocr),
          updated_at = NOW()
      `;
      
      await executeQuery(facturaQuery, [
        factura.email_from, factura.email_subject, factura.email_date, factura.s3_key,
        factura.emisor_nombre, factura.emisor_ruc, factura.emisor_direccion, factura.emisor_telefono,
        factura.receptor_nombre, factura.receptor_ruc, factura.receptor_direccion,
        factura.numero_factura, factura.fecha_factura, factura.subtotal, factura.descuento, 
        factura.itbms, factura.total, factura.estado, factura.confianza_ocr, factura.procesado_por
      ]);
    }
    
    console.log('✅ Facturas de ejemplo creadas');

    // Crear items de ejemplo para la primera factura
    const itemsEjemplo = [
      {
        factura_id: 1,
        codigo: 'PROD001',
        descripcion: 'Producto A - Descripción detallada del producto',
        cantidad: 10,
        unidad: 'unidades',
        precio_unitario: 100.00,
        descuento_item: 5.00,
        impuesto_item: 19.00,
        total_item: 1140.00
      },
      {
        factura_id: 1,
        codigo: 'SERV001',
        descripcion: 'Servicio de instalación',
        cantidad: 1,
        unidad: 'servicio',
        precio_unitario: 200.00,
        descuento_item: 0.00,
        impuesto_item: 38.00,
        total_item: 238.00
      }
    ];

    for (const item of itemsEjemplo) {
      const itemQuery = `
        INSERT INTO factura_items (
          factura_id, codigo, descripcion, cantidad, unidad,
          precio_unitario, descuento_item, impuesto_item, total_item
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          descripcion = VALUES(descripcion),
          cantidad = VALUES(cantidad),
          precio_unitario = VALUES(precio_unitario),
          total_item = VALUES(total_item)
      `;
      
      await executeQuery(itemQuery, [
        item.factura_id, item.codigo, item.descripcion, item.cantidad, item.unidad,
        item.precio_unitario, item.descuento_item, item.impuesto_item, item.total_item
      ]);
    }
    
    console.log('✅ Items de ejemplo creados');

    // Crear archivos de ejemplo
    const archivosEjemplo = [
      {
        factura_id: 1,
        nombre_archivo: 'factura1.pdf',
        tipo_archivo: 'application/pdf',
        s3_url: 'https://s3.amazonaws.com/bucket/facturas/factura1.pdf',
        tamaño_bytes: 1024000
      },
      {
        factura_id: 2,
        nombre_archivo: 'factura2.pdf',
        tipo_archivo: 'application/pdf',
        s3_url: 'https://s3.amazonaws.com/bucket/facturas/factura2.pdf',
        tamaño_bytes: 2048000
      }
    ];

    for (const archivo of archivosEjemplo) {
      const archivoQuery = `
        INSERT INTO factura_archivos (
          factura_id, nombre_archivo, tipo_archivo, s3_url, tamaño_bytes
        ) VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          s3_url = VALUES(s3_url),
          tamaño_bytes = VALUES(tamaño_bytes)
      `;
      
      await executeQuery(archivoQuery, [
        archivo.factura_id, archivo.nombre_archivo, archivo.tipo_archivo,
        archivo.s3_url, archivo.tamaño_bytes
      ]);
    }
    
    console.log('✅ Archivos de ejemplo creados');

    console.log('🎉 Base de datos inicializada correctamente');
    console.log('\n📋 Credenciales de acceso:');
    console.log('👤 Admin: admin@facturas.com / admin123');
    console.log('👤 Usuario: user@facturas.com / user123');

  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('✅ Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en script:', error);
      process.exit(1);
    });
}

module.exports = { initializeDatabase }; 