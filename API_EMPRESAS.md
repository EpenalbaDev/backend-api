# API de Empresas - Documentación

## 📋 Endpoints Disponibles

Base URL: `/api/v1/empresas`

**Todas las rutas requieren autenticación JWT** (excepto que se indique lo contrario)

---

## 📖 Índice

1. [Listar Empresas](#1-listar-empresas)
2. [Obtener Empresa por ID](#2-obtener-empresa-por-id)
3. [Obtener Empresa por RUC](#3-obtener-empresa-por-ruc)
4. [Crear Empresa](#4-crear-empresa)
5. [Actualizar Empresa](#5-actualizar-empresa)
6. [Obtener Usuarios de una Empresa](#6-obtener-usuarios-de-una-empresa)
7. [Contar Empresas](#7-contar-empresas)

---

## 1. Listar Empresas

Obtiene una lista paginada de empresas con filtros opcionales.

**Endpoint:** `GET /api/v1/empresas`

**Autenticación:** Requerida

**Parámetros de consulta (query):**

| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| `page` | number | No | 1 | Número de página |
| `limit` | number | No | 25 | Elementos por página (máx: 100) |
| `search` | string | No | - | Búsqueda en nombre, RUC o email |
| `activo` | boolean | No | - | Filtrar por estado activo/inactivo |
| `plan` | string | No | - | Filtrar por plan (ej: 'basico', 'premium') |
| `sortBy` | string | No | 'created_at' | Campo para ordenar: 'nombre', 'ruc', 'created_at', 'updated_at', 'plan' |
| `sortOrder` | string | No | 'DESC' | Orden: 'ASC' o 'DESC' |

**Ejemplo de Request:**
```bash
GET /api/v1/empresas?page=1&limit=10&search=empresa&activo=true&sortBy=nombre&sortOrder=ASC
```

**Ejemplo de Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Empresa Ejemplo S.A.",
      "ruc": "12345678901",
      "email_procesamiento": "procesamiento@empresa.com",
      "direccion": "Av. Principal 123",
      "telefono": "+507 1234-5678",
      "activo": true,
      "plan": "basico",
      "total_usuarios": 5,
      "usuarios_activos": 4,
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-20T14:45:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalItems": 25,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "filtros": {
    "page": 1,
    "limit": 10,
    "search": "empresa",
    "activo": true,
    "sortBy": "nombre",
    "sortOrder": "ASC"
  }
}
```

**Errores:**

- `400 Bad Request`: Parámetros inválidos
- `401 Unauthorized`: Token no válido o faltante

---

## 2. Obtener Empresa por ID

Obtiene los detalles completos de una empresa incluyendo usuarios recientes.

**Endpoint:** `GET /api/v1/empresas/:id`

**Autenticación:** Requerida

**Parámetros de ruta:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `id` | number | Sí | ID de la empresa |

**Ejemplo de Request:**
```bash
GET /api/v1/empresas/1
```

**Ejemplo de Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nombre": "Empresa Ejemplo S.A.",
    "ruc": "12345678901",
    "email_procesamiento": "procesamiento@empresa.com",
    "direccion": "Av. Principal 123",
    "telefono": "+507 1234-5678",
    "activo": true,
    "plan": "basico",
    "total_usuarios": 5,
    "usuarios_recientes": [
      {
        "id": 10,
        "nombre": "Juan",
        "apellido": "Pérez",
        "email": "juan@empresa.com",
        "rol": "usuario",
        "ultimo_acceso": "2024-01-20T09:00:00.000Z"
      }
    ],
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-20T14:45:00.000Z"
  }
}
```

**Errores:**

- `400 Bad Request`: ID inválido
- `404 Not Found`: Empresa no encontrada
- `401 Unauthorized`: Token no válido o faltante

---

## 3. Obtener Empresa por RUC

Obtiene los detalles de una empresa buscándola por su RUC.

**Endpoint:** `GET /api/v1/empresas/ruc/:ruc`

**Autenticación:** Requerida

**Parámetros de ruta:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `ruc` | string | Sí | RUC de la empresa (máx: 50 caracteres) |

**Ejemplo de Request:**
```bash
GET /api/v1/empresas/ruc/12345678901
```

**Ejemplo de Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nombre": "Empresa Ejemplo S.A.",
    "ruc": "12345678901",
    "email_procesamiento": "procesamiento@empresa.com",
    "direccion": "Av. Principal 123",
    "telefono": "+507 1234-5678",
    "activo": true,
    "plan": "basico",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-20T14:45:00.000Z"
  }
}
```

**Errores:**

- `400 Bad Request`: RUC inválido
- `404 Not Found`: Empresa no encontrada
- `401 Unauthorized`: Token no válido o faltante

---

## 4. Crear Empresa

Crea una nueva empresa en el sistema.

**Endpoint:** `POST /api/v1/empresas`

**Autenticación:** Requerida + Rol: `admin`

**Body (JSON):**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `nombre` | string | Sí | Nombre de la empresa (mín: 2, máx: 255) |
| `ruc` | string | Sí | RUC único de la empresa (mín: 8, máx: 50) |
| `email_procesamiento` | string | Sí | Email único para procesamiento (formato email válido) |
| `direccion` | string | No | Dirección de la empresa (máx: 500) |
| `telefono` | string | No | Teléfono de la empresa (máx: 50) |
| `plan` | string | No | Plan de la empresa (default: 'basico', máx: 50) |

**Ejemplo de Request:**
```bash
POST /api/v1/empresas
Content-Type: application/json

{
  "nombre": "Nueva Empresa S.A.",
  "ruc": "98765432109",
  "email_procesamiento": "procesamiento@nuevaempresa.com",
  "direccion": "Calle Nueva 456",
  "telefono": "+507 9876-5432",
  "plan": "premium"
}
```

**Ejemplo de Response (201 Created):**
```json
{
  "success": true,
  "message": "Empresa creada exitosamente",
  "data": {
    "id": 2,
    "nombre": "Nueva Empresa S.A.",
    "ruc": "98765432109",
    "email_procesamiento": "procesamiento@nuevaempresa.com",
    "direccion": "Calle Nueva 456",
    "telefono": "+507 9876-5432",
    "activo": true,
    "plan": "premium",
    "created_at": "2024-01-21T10:00:00.000Z",
    "updated_at": "2024-01-21T10:00:00.000Z"
  }
}
```

**Errores:**

- `400 Bad Request`: Datos inválidos o faltantes
- `401 Unauthorized`: Token no válido o faltante
- `403 Forbidden`: No tiene permisos de administrador
- `409 Conflict`: RUC o email de procesamiento ya existe

---

## 5. Actualizar Empresa

Actualiza los datos de una empresa existente.

**Endpoint:** `PUT /api/v1/empresas/:id`

**Autenticación:** Requerida + Rol: `admin`

**Parámetros de ruta:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `id` | number | Sí | ID de la empresa a actualizar |

**Body (JSON):** Todos los campos son opcionales, pero debe enviarse al menos uno.

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `nombre` | string | No | Nombre de la empresa (mín: 2, máx: 255) |
| `ruc` | string | No | RUC único de la empresa (mín: 8, máx: 50) |
| `email_procesamiento` | string | No | Email único para procesamiento (formato email válido) |
| `direccion` | string | No | Dirección de la empresa (máx: 500) |
| `telefono` | string | No | Teléfono de la empresa (máx: 50) |
| `activo` | boolean | No | Estado activo/inactivo de la empresa |
| `plan` | string | No | Plan de la empresa (máx: 50) |

**Ejemplo de Request:**
```bash
PUT /api/v1/empresas/1
Content-Type: application/json

{
  "nombre": "Empresa Actualizada S.A.",
  "plan": "premium",
  "activo": true
}
```

**Ejemplo de Response (200 OK):**
```json
{
  "success": true,
  "message": "Empresa actualizada exitosamente",
  "data": {
    "id": 1,
    "nombre": "Empresa Actualizada S.A.",
    "ruc": "12345678901",
    "email_procesamiento": "procesamiento@empresa.com",
    "direccion": "Av. Principal 123",
    "telefono": "+507 1234-5678",
    "activo": true,
    "plan": "premium",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-21T15:30:00.000Z"
  }
}
```

**Errores:**

- `400 Bad Request`: Datos inválidos o ningún campo proporcionado
- `401 Unauthorized`: Token no válido o faltante
- `403 Forbidden`: No tiene permisos de administrador
- `404 Not Found`: Empresa no encontrada
- `409 Conflict`: RUC o email de procesamiento ya existe en otra empresa

---

## 6. Obtener Usuarios de una Empresa

Obtiene la lista paginada de usuarios asociados a una empresa.

**Endpoint:** `GET /api/v1/empresas/:id/usuarios`

**Autenticación:** Requerida

**Parámetros de ruta:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `id` | number | Sí | ID de la empresa |

**Parámetros de consulta (query):**

| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| `page` | number | No | 1 | Número de página |
| `limit` | number | No | 25 | Elementos por página (máx: 100) |
| `activo` | boolean | No | - | Filtrar por usuarios activos/inactivos |
| `rol` | string | No | - | Filtrar por rol: 'admin', 'usuario', 'auditor' |
| `search` | string | No | - | Búsqueda en nombre, apellido o email |

**Ejemplo de Request:**
```bash
GET /api/v1/empresas/1/usuarios?page=1&limit=10&activo=true&rol=usuario
```

**Ejemplo de Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 10,
      "nombre": "Juan",
      "apellido": "Pérez",
      "email": "juan@empresa.com",
      "rol": "usuario",
      "activo": true,
      "ultimo_acceso": "2024-01-20T09:00:00.000Z",
      "created_at": "2024-01-15T08:00:00.000Z",
      "updated_at": "2024-01-20T09:00:00.000Z"
    }
  ],
  "empresa": {
    "id": 1,
    "nombre": "Empresa Ejemplo S.A.",
    "ruc": "12345678901"
  },
  "pagination": {
    "currentPage": 1,
    "totalPages": 2,
    "totalItems": 15,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "filtros": {
    "page": 1,
    "limit": 10,
    "activo": true,
    "rol": "usuario"
  }
}
```

**Errores:**

- `400 Bad Request`: Parámetros inválidos
- `401 Unauthorized`: Token no válido o faltante
- `404 Not Found`: Empresa no encontrada

---

## 7. Contar Empresas

Obtiene el total de empresas según filtros opcionales.

**Endpoint:** `GET /api/v1/empresas/count`

**Autenticación:** Requerida

**Parámetros de consulta (query):**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `activo` | boolean | No | Filtrar por estado activo/inactivo |
| `plan` | string | No | Filtrar por plan específico |

**Ejemplo de Request:**
```bash
GET /api/v1/empresas/count?activo=true&plan=premium
```

**Ejemplo de Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "total": 15
  }
}
```

**Errores:**

- `400 Bad Request`: Parámetros inválidos
- `401 Unauthorized`: Token no válido o faltante

---

## 🔐 Permisos y Roles

### Endpoints Públicos
- Ninguno (todos requieren autenticación)

### Endpoints de Lectura (Requieren autenticación)
- `GET /api/v1/empresas` - Todos los usuarios autenticados
- `GET /api/v1/empresas/:id` - Todos los usuarios autenticados
- `GET /api/v1/empresas/ruc/:ruc` - Todos los usuarios autenticados
- `GET /api/v1/empresas/:id/usuarios` - Todos los usuarios autenticados
- `GET /api/v1/empresas/count` - Todos los usuarios autenticados

### Endpoints de Escritura (Requieren rol `admin`)
- `POST /api/v1/empresas` - Solo admins
- `PUT /api/v1/empresas/:id` - Solo admins

---

## 📝 Notas Importantes

1. **RUC y Email Únicos**: El RUC y el email de procesamiento deben ser únicos en el sistema. Si intentas crear o actualizar una empresa con un RUC o email que ya existe, recibirás un error 409 Conflict.

2. **Empresa por Defecto Activa**: Al crear una empresa, se marca como activa (`activo = true`) automáticamente.

3. **Plan por Defecto**: Si no se especifica un plan al crear, se asigna 'basico' por defecto.

4. **Usuarios Asociados**: Cuando obtienes una empresa por ID, también recibes información sobre los usuarios asociados (últimos 10).

5. **Soft Delete**: Las empresas no se eliminan físicamente, se pueden desactivar cambiando `activo = false`.

---

## 🔄 Códigos de Estado HTTP

| Código | Significado |
|--------|-------------|
| `200` | OK - Request exitoso |
| `201` | Created - Recurso creado exitosamente |
| `400` | Bad Request - Parámetros inválidos |
| `401` | Unauthorized - Token no válido o faltante |
| `403` | Forbidden - No tiene permisos suficientes |
| `404` | Not Found - Recurso no encontrado |
| `409` | Conflict - Conflicto con datos existentes (RUC o email duplicado) |
| `500` | Internal Server Error - Error del servidor |

---

## 📚 Ejemplos de Uso

### Crear Empresa y Asignar Usuario

```javascript
// 1. Crear empresa
const empresa = await fetch('/api/v1/empresas', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    nombre: 'Mi Empresa S.A.',
    ruc: '12345678901',
    email_procesamiento: 'procesamiento@miempresa.com',
    plan: 'premium'
  })
});

const { data: nuevaEmpresa } = await empresa.json();

// 2. Crear usuario asociado a la empresa
const usuario = await fetch('/api/v1/auth/users', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    nombre: 'Juan',
    apellido: 'Pérez',
    email: 'juan@miempresa.com',
    password: 'Password123!',
    rol: 'usuario',
    empresa_id: nuevaEmpresa.id
  })
});
```

### Buscar Empresas con Filtros

```javascript
const empresas = await fetch('/api/v1/empresas?search=empresa&activo=true&plan=premium&sortBy=nombre&sortOrder=ASC', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
```

---

**Última actualización**: {{ fecha }}
**Versión de la API**: 1.0.0

