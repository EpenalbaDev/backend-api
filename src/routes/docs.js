const express = require('express');
const router = express.Router();

// Documentación completa de la API
router.get('/', (req, res) => {
  res.json({
    api: 'Backend API para Dashboard de Facturas',
    version: '1.0.0',
    description: 'API RESTful completa para gestión de facturas con OCR, reportes avanzados, análisis de emisores y dashboard interactivo. Incluye autenticación JWT, paginación, filtros avanzados y exportación de datos.',
    base_url: '/api/v1',
    authentication: 'Bearer Token (JWT)',
    contact: {
      developer: 'Equipo de Desarrollo',
      email: 'soporte@tu-empresa.com',
      documentation: 'https://docs.tu-empresa.com/api'
    },
    endpoints: {
      auth: {
        base: '/api/v1/auth',
        description: 'Endpoints para autenticación y gestión de usuarios',
        routes: {
          'POST /login': {
            description: 'Iniciar sesión de usuario',
            requires_auth: false,
            body: {
              email: 'string (required) - Email del usuario',
              password: 'string (required) - Contraseña del usuario'
            },
            response: {
              success: true,
              data: {
                user: {
                  id: 'number',
                  nombre: 'string',
                  apellido: 'string',
                  email: 'string',
                  rol: 'string (admin|usuario)',
                  activo: 'boolean'
                },
                token: 'string (JWT)',
                expires_in: 'number (segundos)'
              }
            },
            example: {
              request: {
                email: 'admin@tu-empresa.com',
                password: 'password123'
              },
              response: {
                success: true,
                data: {
                  user: {
                    id: 1,
                    nombre: 'Admin',
                    apellido: 'Usuario',
                    email: 'admin@tu-empresa.com',
                    rol: 'admin',
                    activo: true
                  },
                  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                  expires_in: 86400
                }
              }
            }
          },
          'GET /me': {
            description: 'Obtener perfil del usuario autenticado',
            requires_auth: true,
            headers: {
              'Authorization': 'Bearer <jwt_token>'
            },
            response: {
              success: true,
              data: {
                id: 'number',
                nombre: 'string',
                apellido: 'string',
                email: 'string',
                rol: 'string',
                activo: 'boolean',
                ultimo_acceso: 'datetime',
                creado_en: 'datetime'
              }
            }
          },
          'POST /logout': {
            description: 'Cerrar sesión del usuario (invalida el token)',
            requires_auth: true,
            headers: {
              'Authorization': 'Bearer <jwt_token>'
            },
            response: {
              success: true,
              message: 'Sesión cerrada exitosamente'
            }
          },
          'POST /change-password': {
            description: 'Cambiar contraseña del usuario autenticado',
            requires_auth: true,
            body: {
              currentPassword: 'string (required) - Contraseña actual',
              newPassword: 'string (required) - Nueva contraseña (mín 8 caracteres)',
              confirmPassword: 'string (required) - Confirmar nueva contraseña'
            },
            response: {
              success: true,
              message: 'Contraseña actualizada exitosamente'
            }
          },
          'GET /verify': {
            description: 'Verificar validez del token JWT',
            requires_auth: true,
            response: {
              success: true,
              data: {
                valid: 'boolean',
                user: 'object (datos del usuario)',
                expires_at: 'datetime'
              }
            }
          },
          'POST /users': {
            description: 'Crear nuevo usuario (solo administradores)',
            requires_auth: true,
            requires_role: 'admin',
            body: {
              nombre: 'string (required) - Nombre del usuario',
              apellido: 'string (required) - Apellido del usuario',
              email: 'string (required) - Email único',
              password: 'string (required) - Contraseña (mín 8 caracteres)',
              rol: 'string (required) - admin|usuario',
              activo: 'boolean (optional) - default: true'
            },
            response: {
              success: true,
              data: {
                id: 'number',
                nombre: 'string',
                apellido: 'string',
                email: 'string',
                rol: 'string',
                activo: 'boolean',
                creado_en: 'datetime'
              }
            }
          }
        }
      },
      dashboard: {
        base: '/api/v1/dashboard',
        description: 'Endpoints para métricas y datos del dashboard principal',
        routes: {
          'GET /overview': {
            description: 'Métricas generales del dashboard (resumen ejecutivo)',
            requires_auth: true,
            query_params: {
              fechaInicio: 'string (optional) - Fecha inicio (YYYY-MM-DD)',
              fechaFin: 'string (optional) - Fecha fin (YYYY-MM-DD)'
            },
            response: {
              success: true,
              data: {
                total_facturas: 'number',
                monto_total: 'number',
                promedio_factura: 'number',
                facturas_pendientes: 'number',
                facturas_procesadas: 'number',
                facturas_error: 'number',
                emisores_activos: 'number',
                confianza_promedio: 'number',
                crecimiento_mensual: 'number',
                top_emisores: 'array'
              }
            }
          },
          'GET /metrics': {
            description: 'Métricas detalladas con filtros avanzados',
            requires_auth: true,
            query_params: {
              fechaInicio: 'string (optional) - Fecha inicio',
              fechaFin: 'string (optional) - Fecha fin',
              emisorRuc: 'string (optional) - RUC del emisor',
              estado: 'string (optional) - Estado de facturas',
              agruparPor: 'string (optional) - dia|semana|mes|año'
            },
            response: {
              success: true,
              data: {
                metricas_generales: 'object',
                metricas_por_periodo: 'array',
                metricas_por_emisor: 'array',
                metricas_por_estado: 'object'
              }
            }
          },
          'GET /charts': {
            description: 'Datos para gráficos y visualizaciones',
            requires_auth: true,
            query_params: {
              tipo: 'string (required) - ventas|emisores|estados|tendencias',
              periodo: 'string (optional) - 7d|30d|90d|1y',
              agruparPor: 'string (optional) - dia|semana|mes'
            },
            response: {
              success: true,
              data: {
                labels: 'array (etiquetas del eje X)',
                datasets: 'array (datos para cada serie)',
                configuracion: 'object (configuración del gráfico)'
              }
            }
          },
          'GET /alertas': {
            description: 'Alertas y notificaciones del sistema',
            requires_auth: true,
            query_params: {
              tipo: 'string (optional) - error|advertencia|info',
              leidas: 'boolean (optional) - Filtrar por estado de lectura'
            },
            response: {
              success: true,
              data: {
                alertas: 'array',
                total_no_leidas: 'number',
                alertas_criticas: 'number'
              }
            }
          },
          'GET /performance': {
            description: 'Estadísticas de rendimiento del sistema',
            requires_auth: true,
            query_params: {
              periodo: 'string (optional) - 1h|24h|7d|30d'
            },
            response: {
              success: true,
              data: {
                tiempo_respuesta_promedio: 'number',
                requests_por_minuto: 'number',
                errores_por_hora: 'number',
                uptime: 'number',
                uso_memoria: 'number',
                uso_cpu: 'number'
              }
            }
          },
          'GET /data': {
            description: 'Todos los datos del dashboard en un solo endpoint',
            requires_auth: true,
            response: {
              success: true,
              data: {
                overview: 'object',
                metrics: 'object',
                charts: 'object',
                alertas: 'array',
                performance: 'object'
              }
            }
          }
        }
      },
      facturas: {
        base: '/api/v1/facturas',
        description: 'Endpoints para gestión completa de facturas',
        routes: {
          'GET /': {
            description: 'Lista de facturas con filtros avanzados y paginación',
            requires_auth: true,
            query_params: {
              page: 'number (optional) - Página (default: 1)',
              limit: 'number (optional) - Elementos por página (default: 25, max: 100)',
              estado: 'string (optional) - pendiente|procesado|error|revision',
              fechaInicio: 'string (optional) - Fecha inicio (YYYY-MM-DD)',
              fechaFin: 'string (optional) - Fecha fin (YYYY-MM-DD)',
              emisorRuc: 'string (optional) - RUC del emisor',
              montoMin: 'number (optional) - Monto mínimo',
              montoMax: 'number (optional) - Monto máximo',
              confianzaMin: 'number (optional) - Confianza OCR mínima (0-100)',
              sortBy: 'string (optional) - Campo de ordenamiento',
              sortOrder: 'string (optional) - ASC|DESC (default: DESC)'
            },
            response: {
              success: true,
              data: 'array (facturas)',
              pagination: {
                currentPage: 'number',
                totalPages: 'number',
                totalItems: 'number',
                itemsPerPage: 'number',
                hasNextPage: 'boolean',
                hasPrevPage: 'boolean'
              }
            },
            example: {
              request: 'GET /api/v1/facturas?page=1&limit=25&estado=procesado&fechaInicio=2024-01-01',
              response: {
                success: true,
                data: [
                  {
                    id: 1,
                    numero_factura: 'F001-001',
                    fecha_factura: '2024-01-15',
                    total: 150.50,
                    emisor_nombre: 'Empresa ABC',
                    emisor_ruc: '12345678-9',
                    estado: 'procesado',
                    confianza_ocr: 95.5,
                    creado_en: '2024-01-15T10:30:00Z'
                  }
                ],
                pagination: {
                  currentPage: 1,
                  totalPages: 5,
                  totalItems: 125,
                  itemsPerPage: 25,
                  hasNextPage: true,
                  hasPrevPage: false
                }
              }
            }
          },
          'GET /search': {
            description: 'Búsqueda avanzada de facturas con múltiples criterios',
            requires_auth: true,
            query_params: {
              search: 'string (required) - Término de búsqueda (alternativo: q)',
              q: 'string (required) - Término de búsqueda (alternativo: search)',
              estado: 'string (optional) - Estado de facturas',
              emisorRuc: 'string (optional) - RUC del emisor',
              fechaInicio: 'string (optional) - Fecha inicio',
              fechaFin: 'string (optional) - Fecha fin',
              page: 'number (optional) - Página (default: 1)',
              limit: 'number (optional) - Elementos por página (default: 20)'
            },
            response: {
              success: true,
              data: 'array (facturas encontradas)',
              pagination: 'object (información de paginación)',
              query: 'string (término de búsqueda usado)',
              resultados: 'number (total de resultados)'
            }
          },
          'GET /suggestions': {
            description: 'Sugerencias de búsqueda basadas en datos existentes',
            requires_auth: true,
            query_params: {
              search: 'string (required) - Término de búsqueda (alternativo: q)',
              q: 'string (required) - Término de búsqueda (alternativo: search)',
              tipo: 'string (optional) - emisor|factura|item (default: todos)'
            },
            response: {
              success: true,
              data: {
                emisores: 'array (sugerencias de emisores)',
                facturas: 'array (sugerencias de facturas)',
                items: 'array (sugerencias de items)'
              }
            }
          },
          'GET /:id': {
            description: 'Detalle completo de una factura por ID',
            requires_auth: true,
            path_params: {
              id: 'number (required) - ID de la factura'
            },
            response: {
              success: true,
              data: {
                id: 'number',
                numero_factura: 'string',
                fecha_factura: 'date',
                total: 'number',
                subtotal: 'number',
                itbms: 'number',
                emisor_nombre: 'string',
                emisor_ruc: 'string',
                emisor_direccion: 'string',
                cliente_nombre: 'string',
                cliente_ruc: 'string',
                estado: 'string',
                confianza_ocr: 'number',
                items: 'array',
                archivos: 'array',
                logs: 'array',
                creado_en: 'datetime',
                actualizado_en: 'datetime'
              }
            }
          },
          'GET /:id/items': {
            description: 'Items detallados de una factura específica',
            requires_auth: true,
            path_params: {
              id: 'number (required) - ID de la factura'
            },
            response: {
              success: true,
              data: 'array (items de la factura)'
            }
          },
          'GET /:id/archivos': {
            description: 'Archivos asociados a una factura',
            requires_auth: true,
            path_params: {
              id: 'number (required) - ID de la factura'
            },
            response: {
              success: true,
              data: 'array (archivos de la factura)'
            }
          },
          'PUT /:id/estado': {
            description: 'Actualizar estado de una factura',
            requires_auth: true,
            path_params: {
              id: 'number (required) - ID de la factura'
            },
            body: {
              estado: 'string (required) - pendiente|procesado|error|revision',
              comentario: 'string (optional) - Comentario del cambio'
            },
            response: {
              success: true,
              data: {
                estadoAnterior: 'string',
                estadoNuevo: 'string',
                comentario: 'string',
                actualizado_en: 'datetime'
              }
            }
          },
          'DELETE /:id': {
            description: 'Eliminar factura (soft delete)',
            requires_auth: true,
            requires_role: 'admin|usuario',
            path_params: {
              id: 'number (required) - ID de la factura'
            },
            response: {
              success: true,
              message: 'Factura eliminada exitosamente'
            }
          }
        }
      },
      emisores: {
        base: '/api/v1/emisores',
        description: 'Endpoints para gestión y análisis de emisores',
        routes: {
          'GET /': {
            description: 'Lista de emisores con estadísticas completas',
            requires_auth: true,
            query_params: {
              page: 'number (optional) - Página (default: 1)',
              limit: 'number (optional) - Elementos por página (default: 25)',
              search: 'string (optional) - Búsqueda por nombre o RUC',
              fechaInicio: 'string (optional) - Fecha inicio',
              fechaFin: 'string (optional) - Fecha fin',
              sortBy: 'string (optional) - Campo de ordenamiento',
              sortOrder: 'string (optional) - ASC|DESC'
            },
            response: {
              success: true,
              data: 'array (emisores con estadísticas)',
              pagination: 'object (información de paginación)'
            }
          },
          'GET /top': {
            description: 'Top emisores por diferentes métricas',
            requires_auth: true,
            query_params: {
              metric: 'string (optional) - facturas|monto|promedio (default: facturas)',
              metrica: 'string (optional) - total_facturas|monto_total|promedio_factura (alternativo a metric)',
              limit: 'number (optional) - Número de emisores (default: 10, max: 100)',
              fechaInicio: 'string (optional) - Fecha inicio',
              fechaFin: 'string (optional) - Fecha fin'
            },
            response: {
              success: true,
              data: 'array (top emisores)',
              metric: 'string (métrica usada)',
              metrica: 'string (métrica interna)',
              filtros: 'object (filtros aplicados)'
            }
          },
          'GET /:ruc': {
            description: 'Detalle completo de un emisor por RUC',
            requires_auth: true,
            path_params: {
              ruc: 'string (required) - RUC del emisor'
            },
            response: {
              success: true,
              data: {
                ruc: 'string',
                nombre: 'string',
                direccion: 'string',
                total_facturas: 'number',
                monto_total: 'number',
                promedio_factura: 'number',
                primera_factura: 'date',
                ultima_factura: 'date',
                facturas_pendientes: 'number',
                facturas_procesadas: 'number',
                facturas_error: 'number',
                facturas_revision: 'number',
                confianza_promedio: 'number',
                estadisticas_mensuales: 'array'
              }
            }
          },
          'GET /:ruc/facturas': {
            description: 'Facturas de un emisor específico',
            requires_auth: true,
            path_params: {
              ruc: 'string (required) - RUC del emisor'
            },
            query_params: {
              page: 'number (optional) - Página (default: 1)',
              limit: 'number (optional) - Elementos por página (default: 25)',
              estado: 'string (optional) - Estado de facturas',
              fechaInicio: 'string (optional) - Fecha inicio',
              fechaFin: 'string (optional) - Fecha fin',
              sortBy: 'string (optional) - Campo de ordenamiento',
              sortOrder: 'string (optional) - ASC|DESC'
            },
            response: {
              success: true,
              data: 'array (facturas del emisor)',
              pagination: 'object (información de paginación)',
              emisor: 'object (datos del emisor)'
            }
          }
        }
      },
      reportes: {
        base: '/api/v1/reportes',
        description: 'Endpoints para generación de reportes avanzados',
        routes: {
          'GET /dashboard': {
            description: 'Dashboard de reportes con métricas clave',
            requires_auth: true,
            query_params: {
              fechaInicio: 'string (optional) - Fecha inicio',
              fechaFin: 'string (optional) - Fecha fin'
            },
            response: {
              success: true,
              data: {
                resumen_ejecutivo: 'object',
                metricas_clave: 'object',
                tendencias: 'array',
                alertas: 'array'
              }
            }
          },
          'GET /ventas': {
            description: 'Reporte de ventas por período con agrupación',
            requires_auth: true,
            query_params: {
              fechaInicio: 'string (optional) - Fecha inicio (YYYY-MM-DD)',
              fechaFin: 'string (optional) - Fecha fin (YYYY-MM-DD)',
              agruparPor: 'string (optional) - dia|semana|mes|año (default: mes)',
              emisorRuc: 'string (optional) - RUC del emisor',
              formato: 'string (optional) - json|csv|excel (default: json)'
            },
            response: {
              success: true,
              data: {
                resumen: 'object',
                detalle: 'array',
                graficos: 'object'
              },
              formato: 'string (formato de respuesta)',
              filtros: 'object (filtros aplicados)'
            }
          },
          'GET /itbms': {
            description: 'Reporte de ITBMS por período y emisor',
            requires_auth: true,
            query_params: {
              fechaInicio: 'string (optional) - Fecha inicio (YYYY-MM-DD)',
              fechaFin: 'string (optional) - Fecha fin (YYYY-MM-DD)',
              mes: 'number (optional) - Mes (1-12)',
              año: 'number (optional) - Año (2000-2100)',
              emisorRuc: 'string (optional) - RUC del emisor',
              formato: 'string (optional) - json|csv|excel (default: json)'
            },
            response: {
              success: true,
              data: {
                resumen: 'object',
                por_emisor: 'array',
                por_periodo: 'array',
                totales: 'object'
              },
              formato: 'string (formato de respuesta)',
              filtros: 'object (filtros aplicados)'
            }
          },
          'GET /ocr-performance': {
            description: 'Reporte de performance del OCR',
            requires_auth: true,
            query_params: {
              fechaInicio: 'string (optional) - Fecha inicio',
              fechaFin: 'string (optional) - Fecha fin',
              emisorRuc: 'string (optional) - RUC del emisor'
            },
            response: {
              success: true,
              data: {
                metricas_generales: 'object',
                performance_por_periodo: 'array',
                errores_comunes: 'array',
                recomendaciones: 'array'
              }
            }
          },
          'GET /actividad-emisores': {
            description: 'Reporte de actividad de emisores con análisis detallado',
            requires_auth: true,
            query_params: {
              periodo: 'number (optional) - Días hacia atrás (1-365, default: 30)',
              fechaInicio: 'string (optional) - Fecha inicio (YYYY-MM-DD)',
              fechaFin: 'string (optional) - Fecha fin (YYYY-MM-DD)',
              limit: 'number (optional) - Número de emisores (1-100, default: 20)',
              formato: 'string (optional) - json|csv|excel (default: json)'
            },
            response: {
              success: true,
              data: {
                actividad_emisores: 'array (emisores más activos)',
                emisores_nuevos: 'array (emisores que facturaron por primera vez)'
              },
              formato: 'string (formato de respuesta)',
              filtros: 'object (filtros aplicados)'
            }
          },
          'POST /export': {
            description: 'Exportar datos en diferentes formatos',
            requires_auth: true,
            body: {
              tipo: 'string (required) - facturas|ventas|emisores|itbms',
              formato: 'string (required) - csv|excel|json',
              fechaInicio: 'string (optional) - Fecha inicio',
              fechaFin: 'string (optional) - Fecha fin',
              emisorRuc: 'string (optional) - RUC del emisor'
            },
            response: {
              success: true,
              data: {
                tipo: 'string',
                formato: 'string',
                cantidad_registros: 'number',
                datos: 'array|string',
                generado_en: 'datetime',
                filtros: 'object'
              }
            }
          }
        }
      },
      busqueda: {
        base: '/api/v1/busqueda',
        description: 'Endpoints para búsqueda avanzada y sugerencias',
        routes: {
          'GET /facturas': {
            description: 'Búsqueda de facturas con múltiples criterios',
            requires_auth: true,
            query_params: {
              q: 'string (required) - Término de búsqueda',
              tipo: 'string (optional) - numero|emisor|cliente|item',
              fechaInicio: 'string (optional) - Fecha inicio',
              fechaFin: 'string (optional) - Fecha fin',
              estado: 'string (optional) - Estado de facturas',
              page: 'number (optional) - Página',
              limit: 'number (optional) - Elementos por página'
            },
            response: {
              success: true,
              data: 'array (facturas encontradas)',
              pagination: 'object (información de paginación)',
              query: 'string (término de búsqueda)',
              resultados: 'number (total de resultados)'
            }
          },
          'GET /suggestions': {
            description: 'Sugerencias de búsqueda inteligentes',
            requires_auth: true,
            query_params: {
              q: 'string (required) - Término de búsqueda',
              tipo: 'string (optional) - emisor|factura|item|cliente',
              limit: 'number (optional) - Número de sugerencias (default: 10)'
            },
            response: {
              success: true,
              data: {
                emisores: 'array (sugerencias de emisores)',
                facturas: 'array (sugerencias de facturas)',
                items: 'array (sugerencias de items)',
                clientes: 'array (sugerencias de clientes)'
              }
            }
          }
        }
      }
    },
    query_parameters: {
      pagination: {
        page: 'number (optional) - Número de página (default: 1, min: 1)',
        limit: 'number (optional) - Elementos por página (default: 25, max: 100)'
      },
      filters: {
        search: 'string (optional) - Término de búsqueda general',
        q: 'string (optional) - Término de búsqueda (alternativo a search)',
        estado: 'string (optional) - Estado de factura (pendiente|procesado|error|revision)',
        fechaInicio: 'string (optional) - Fecha inicio en formato ISO (YYYY-MM-DD)',
        fechaFin: 'string (optional) - Fecha fin en formato ISO (YYYY-MM-DD)',
        emisorRuc: 'string (optional) - RUC del emisor',
        montoMin: 'number (optional) - Monto mínimo de factura',
        montoMax: 'number (optional) - Monto máximo de factura',
        confianzaMin: 'number (optional) - Confianza OCR mínima (0-100)',
        sortBy: 'string (optional) - Campo de ordenamiento',
        sortOrder: 'string (optional) - Orden (ASC|DESC, default: DESC)'
      },
      reportes: {
        periodo: 'number (optional) - Días hacia atrás (1-365)',
        agruparPor: 'string (optional) - Agrupación (dia|semana|mes|año)',
        formato: 'string (optional) - Formato de respuesta (json|csv|excel)',
        metric: 'string (optional) - Métrica para top emisores (facturas|monto|promedio)',
        mes: 'number (optional) - Mes para reportes (1-12)',
        año: 'number (optional) - Año para reportes (2000-2100)'
      }
    },
    response_format: {
      success_response: {
        success: true,
        data: 'Datos solicitados (object|array)',
        pagination: 'object (opcional) - Información de paginación',
        message: 'string (opcional) - Mensaje informativo',
        formato: 'string (opcional) - Formato de respuesta',
        filtros: 'object (opcional) - Filtros aplicados'
      },
      error_response: {
        success: false,
        message: 'string - Mensaje de error descriptivo',
        code: 'string (opcional) - Código de error',
        details: 'object (opcional) - Detalles adicionales del error',
        stack: 'string (opcional) - Stack trace (solo en desarrollo)'
      }
    },
    authentication: {
      type: 'Bearer Token (JWT)',
      header: 'Authorization: Bearer <jwt_token>',
      token_expiration: '24 horas',
      refresh_token: 'No implementado',
      example: {
        login_endpoint: 'POST /api/v1/auth/login',
        login_body: {
          email: 'usuario@empresa.com',
          password: 'password123'
        },
        login_response: {
          success: true,
          data: {
            user: {
              id: 1,
              nombre: 'Usuario',
              apellido: 'Ejemplo',
              email: 'usuario@empresa.com',
              rol: 'admin',
              activo: true
            },
            token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            expires_in: 86400
          }
        }
      }
    },
    rate_limiting: {
      auth_endpoints: '5 requests por minuto',
      general_endpoints: '100 requests por minuto',
      search_endpoints: '50 requests por minuto',
      report_endpoints: '20 requests por minuto'
    },
    error_codes: {
      '400': 'Bad Request - Parámetros inválidos o faltantes',
      '401': 'Unauthorized - Token inválido o expirado',
      '403': 'Forbidden - Sin permisos para acceder al recurso',
      '404': 'Not Found - Recurso no encontrado',
      '422': 'Unprocessable Entity - Datos inválidos',
      '429': 'Too Many Requests - Límite de requests excedido',
      '500': 'Internal Server Error - Error interno del servidor'
    },
    examples: {
      get_facturas: {
        url: 'GET /api/v1/facturas?page=1&limit=25&estado=procesado&fechaInicio=2024-01-01',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          'Content-Type': 'application/json'
        }
      },
      search_facturas: {
        url: 'GET /api/v1/facturas/search?search=cable&estado=procesado&page=1&limit=20',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          'Content-Type': 'application/json'
        }
      },
      update_estado: {
        url: 'PUT /api/v1/facturas/123/estado',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          'Content-Type': 'application/json'
        },
        body: {
          estado: 'revision',
          comentario: 'Factura revisada y aprobada'
        }
      },
      get_reportes: {
        url: 'GET /api/v1/reportes/ventas?fechaInicio=2024-01-01&fechaFin=2024-12-31&agruparPor=mes&formato=json',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          'Content-Type': 'application/json'
        }
      }
    },
    changelog: {
      '1.0.0': {
        date: '2024-01-15',
        changes: [
          'Versión inicial de la API',
          'Autenticación JWT implementada',
          'Endpoints básicos de facturas',
          'Sistema de reportes',
          'Dashboard con métricas'
        ]
      }
    }
  });
});

module.exports = router; 