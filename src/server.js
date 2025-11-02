const app = require('./app');
const { testConnection } = require('./config/database');

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // Probar conexión a la base de datos
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ No se pudo conectar a la base de datos. Cerrando servidor...');
      process.exit(1);
    }

    // Iniciar servidor
    const server = app.listen(PORT, () => {
      console.log('🚀 ===============================================');
      console.log('🚀 Backend API para Dashboard de Facturas');
      console.log('🚀 ===============================================');
      console.log(`🚀 Servidor corriendo en puerto: ${PORT}`);
      console.log(`🚀 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🚀 URL: http://localhost:${PORT}`);
      console.log(`🚀 Health Check: http://localhost:${PORT}/health`);
      console.log('🚀 ===============================================');
    });

    // Manejo de cierre graceful
    const gracefulShutdown = (signal) => {
      console.log(`\n📡 Recibida señal ${signal}. Cerrando servidor...`);
      
      server.close((err) => {
        if (err) {
          console.error('❌ Error cerrando servidor:', err);
          process.exit(1);
        }
        
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
      });
    };

    // Escuchar señales de cierre
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Manejo de errores no capturados
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
}

startServer();