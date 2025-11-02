# Actualización: Integración de Empresas en el Frontend

## 📋 Resumen de Cambios en el Backend

Se ha agregado una nueva funcionalidad al backend que permite asociar usuarios a empresas:

1. **Nueva tabla `empresas`**: Almacena información de empresas
2. **Nueva columna `empresa_id` en `usuarios`**: Relación opcional entre usuarios y empresas
3. **Nuevo modelo `Empresa`**: CRUD completo para gestión de empresas

---

## 🔄 Cambios en las Respuestas de la API

### 1. Respuesta de Login (`POST /api/v1/auth/login`)

**Antes:**
```typescript
{
  success: true,
  data: {
    token: "...",
    user: {
      id: 1,
      nombre: "Juan",
      apellido: "Pérez",
      email: "juan@example.com",
      rol: "usuario"
    }
  }
}
```

**Ahora:**
```typescript
{
  success: true,
  data: {
    token: "...",
    user: {
      id: 1,
      empresa_id: 5,  // ⬅️ NUEVO (puede ser null)
      nombre: "Juan",
      apellido: "Pérez",
      email: "juan@example.com",
      rol: "usuario"
    }
  }
}
```

### 2. Respuesta de Perfil (`GET /api/v1/auth/me`)

**Antes:**
```typescript
{
  success: true,
  data: {
    id: 1,
    nombre: "Juan",
    apellido: "Pérez",
    email: "juan@example.com",
    rol: "usuario",
    ultimo_acceso: "2024-01-15T10:30:00Z",
    created_at: "2024-01-01T00:00:00Z"
  }
}
```

**Ahora:**
```typescript
{
  success: true,
  data: {
    id: 1,
    empresa_id: 5,  // ⬅️ NUEVO (puede ser null)
    nombre: "Juan",
    apellido: "Pérez",
    email: "juan@example.com",
    rol: "usuario",
    ultimo_acceso: "2024-01-15T10:30:00Z",
    created_at: "2024-01-01T00:00:00Z"
  }
}
```

### 3. Creación de Usuarios (`POST /api/v1/auth/users`)

**Antes:**
```typescript
// Request Body
{
  nombre: "María",
  apellido: "González",
  email: "maria@example.com",
  password: "Password123!",
  rol: "usuario"
}
```

**Ahora:**
```typescript
// Request Body
{
  nombre: "María",
  apellido: "González",
  email: "maria@example.com",
  password: "Password123!",
  rol: "usuario",
  empresa_id: 5  // ⬅️ NUEVO (opcional, puede ser null)
}
```

**Validación:**
- `empresa_id` es opcional
- Si se proporciona, debe ser un número entero positivo
- El backend valida que la empresa exista y esté activa

---

## 📝 Cambios Necesarios en el Frontend

### 1. Actualizar Tipos TypeScript

**Archivo: `src/types/index.ts`**

#### Actualizar tipo `User`

**Antes:**
```typescript
export interface User {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: 'admin' | 'usuario' | 'auditor';
  ultimo_acceso?: string;
  created_at?: string;
}
```

**Ahora:**
```typescript
export interface User {
  id: number;
  empresa_id: number | null;  // ⬅️ NUEVO
  nombre: string;
  apellido: string;
  email: string;
  rol: 'admin' | 'usuario' | 'auditor';
  ultimo_acceso?: string;
  created_at?: string;
}
```

#### Agregar nuevos tipos para Empresa

**Agregar al final del archivo:**
```typescript
// ==================== EMPRESAS ====================

export interface Empresa {
  id: number;
  nombre: string;
  ruc: string;
  email_procesamiento: string;
  direccion?: string | null;
  telefono?: string | null;
  activo: boolean;
  plan: string;
  created_at?: string;
  updated_at?: string;
}

export interface EmpresaCreateData {
  nombre: string;
  ruc: string;
  email_procesamiento: string;
  direccion?: string;
  telefono?: string;
  plan?: string;
}

export interface EmpresaUpdateData {
  nombre?: string;
  ruc?: string;
  email_procesamiento?: string;
  direccion?: string;
  telefono?: string;
  activo?: boolean;
  plan?: string;
}

export interface CreateUserData {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  rol?: 'admin' | 'usuario' | 'auditor';
  empresa_id?: number | null;  // ⬅️ ACTUALIZAR
}

export interface EmpresaFilters {
  activo?: boolean;
  plan?: string;
  search?: string;
}
```

### 2. Actualizar AuthContext

**Archivo: `src/contexts/AuthContext.tsx`**

El `AuthContext` debería manejar automáticamente el `empresa_id` si ya está usando el tipo `User` actualizado. Solo asegúrate de que:

1. El estado del usuario incluya `empresa_id`
2. El token o el objeto `user` persista el `empresa_id` en localStorage
3. Al obtener el perfil, se actualice el `empresa_id` si cambia

**Ejemplo de actualización:**
```typescript
// Al hacer login, el user ya incluirá empresa_id automáticamente
// No requiere cambios adicionales si usas el tipo User actualizado

// Solo verifica que el localStorage guarde toda la info del usuario:
localStorage.setItem('user', JSON.stringify(user)); // incluirá empresa_id
```

### 3. Actualizar Servicios de API

**Archivo: `src/lib/api.ts` o donde esté el authService**

#### Actualizar `createUser` en authService

**Antes:**
```typescript
async createUser(data: {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  rol?: string;
}) {
  return this.axios.post('/auth/users', data);
}
```

**Ahora:**
```typescript
async createUser(data: {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  rol?: string;
  empresa_id?: number | null;  // ⬅️ NUEVO
}) {
  return this.axios.post('/auth/users', data);
}
```

#### Crear servicio de Empresas (nuevo)

**Agregar al final del archivo de servicios:**
```typescript
// ==================== EMPRESA SERVICE ====================

export const empresaService = {
  // Obtener todas las empresas
  async getAll(params?: {
    limit?: number;
    offset?: number;
    activo?: boolean;
    plan?: string;
  }) {
    return this.axios.get<PaginatedResponse<Empresa>>('/empresas', { params });
  },

  // Obtener empresa por ID
  async getById(id: number) {
    return this.axios.get<{ success: boolean; data: Empresa }>(`/empresas/${id}`);
  },

  // Obtener empresa por RUC
  async getByRuc(ruc: string) {
    return this.axios.get<{ success: boolean; data: Empresa }>(`/empresas/ruc/${ruc}`);
  },

  // Crear nueva empresa
  async create(data: EmpresaCreateData) {
    return this.axios.post<{ success: boolean; data: Empresa }>('/empresas', data);
  },

  // Actualizar empresa
  async update(id: number, data: EmpresaUpdateData) {
    return this.axios.put<{ success: boolean; data: Empresa }>(`/empresas/${id}`, data);
  },

  // Obtener usuarios de una empresa
  async getUsers(empresaId: number, params?: {
    limit?: number;
    offset?: number;
  }) {
    return this.axios.get<PaginatedResponse<User>>(`/empresas/${empresaId}/usuarios`, { params });
  },

  // Contar empresas
  async count() {
    return this.axios.get<{ success: boolean; data: { total: number } }>('/empresas/count');
  }
};
```

### 4. Actualizar Formulario de Creación de Usuarios

Si tienes un componente para crear usuarios (`src/components/auth/CreateUserForm.tsx` o similar):

**Cambios necesarios:**
1. Agregar campo `empresa_id` al formulario (select/combobox opcional)
2. Cargar lista de empresas para seleccionar
3. Actualizar validación para incluir `empresa_id` opcional

**Ejemplo de campo a agregar:**
```typescript
// En el formulario
<Select
  name="empresa_id"
  label="Empresa (opcional)"
  placeholder="Seleccionar empresa"
>
  <option value="">Sin empresa</option>
  {empresas.map(empresa => (
    <option key={empresa.id} value={empresa.id}>
      {empresa.nombre} ({empresa.ruc})
    </option>
  ))}
</Select>
```

### 5. Actualizar Componentes que Muestran Información de Usuario

Buscar y actualizar componentes que muestren datos de usuario:

#### Header.tsx
Si muestra información del usuario:
```typescript
// Ahora puede mostrar la empresa del usuario
{user.empresa_id && (
  <span className="text-sm text-gray-600">
    Empresa: {user.empresa?.nombre}
  </span>
)}
```

#### Perfil de Usuario
Si hay una página/componente de perfil:
- Mostrar `empresa_id` si existe
- Opcionalmente cargar y mostrar información completa de la empresa

### 6. Crear Componentes para Gestión de Empresas (Opcional)

Si necesitas gestionar empresas desde el frontend:

#### Lista de Empresas (`src/components/empresas/EmpresasList.tsx`)
- Tabla con todas las empresas
- Filtros por activo, plan, búsqueda
- Acciones: ver detalle, editar, activar/desactivar

#### Detalle de Empresa (`src/components/empresas/EmpresaDetail.tsx`)
- Información completa de la empresa
- Lista de usuarios asociados
- Métricas relacionadas

#### Formulario de Empresa (`src/components/empresas/EmpresaForm.tsx`)
- Crear/editar empresa
- Validación de RUC único
- Validación de email de procesamiento único

### 7. Crear Hook para Empresas (Opcional)

**Archivo: `src/hooks/useEmpresas.ts` (nuevo)**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { empresaService } from '@/lib/api';
import type { Empresa, EmpresaCreateData, EmpresaUpdateData } from '@/types';

export function useEmpresas(params?: {
  limit?: number;
  offset?: number;
  activo?: boolean;
  plan?: string;
}) {
  return useQuery({
    queryKey: ['empresas', params],
    queryFn: () => empresaService.getAll(params),
  });
}

export function useEmpresa(id: number) {
  return useQuery({
    queryKey: ['empresa', id],
    queryFn: () => empresaService.getById(id),
    enabled: !!id,
  });
}

export function useCreateEmpresa() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: EmpresaCreateData) => empresaService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
    },
  });
}

export function useUpdateEmpresa() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: EmpresaUpdateData }) =>
      empresaService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
      queryClient.invalidateQueries({ queryKey: ['empresa', variables.id] });
    },
  });
}

export function useEmpresaUsers(empresaId: number, params?: {
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ['empresa', empresaId, 'usuarios', params],
    queryFn: () => empresaService.getUsers(empresaId, params),
    enabled: !!empresaId,
  });
}
```

---

## 🗂️ Nuevos Endpoints Disponibles (Backend)

Si decides crear la gestión de empresas en el frontend, estos endpoints estarán disponibles:

**Nota:** Estos endpoints deben crearse en el backend. Esta documentación es para referencia futura.

### Empresas

- `GET /api/v1/empresas` - Listar empresas (con paginación y filtros)
- `GET /api/v1/empresas/:id` - Obtener empresa por ID
- `GET /api/v1/empresas/ruc/:ruc` - Obtener empresa por RUC
- `POST /api/v1/empresas` - Crear nueva empresa
- `PUT /api/v1/empresas/:id` - Actualizar empresa
- `GET /api/v1/empresas/:id/usuarios` - Obtener usuarios de una empresa
- `GET /api/v1/empresas/count` - Contar empresas activas

**Para crear estos endpoints en el backend:**
1. Crear `src/controllers/empresaController.js`
2. Crear `src/services/empresaService.js`
3. Crear `src/routes/empresas.js`
4. Registrar rutas en `src/app.js`

---

## ✅ Checklist de Implementación

### Cambios Mínimos Requeridos

- [ ] Actualizar tipo `User` en `src/types/index.ts` para incluir `empresa_id`
- [ ] Verificar que `AuthContext` maneje `empresa_id` correctamente
- [ ] Actualizar `createUser` en servicios para aceptar `empresa_id` opcional
- [ ] Verificar que formularios de creación de usuarios funcionen (campo opcional)

### Cambios Opcionales (Recomendados)

- [ ] Agregar tipos TypeScript para `Empresa`
- [ ] Crear servicio `empresaService` en `src/lib/api.ts`
- [ ] Crear hook `useEmpresas` si necesitas gestionar empresas
- [ ] Actualizar componente de creación de usuarios para seleccionar empresa
- [ ] Mostrar información de empresa en Header o perfil de usuario
- [ ] Crear componentes de gestión de empresas (si es necesario)

### Para Desarrollo Futuro

- [ ] Implementar endpoints de empresas en el backend (si aún no existen)
- [ ] Crear páginas completas de gestión de empresas
- [ ] Agregar filtros por empresa en listas de usuarios
- [ ] Agregar métricas por empresa en dashboard
- [ ] Implementar permisos basados en empresa

---

## 🔍 Búsqueda de Referencias

Para encontrar todos los archivos que necesitan actualización, busca:

```bash
# Buscar referencias al tipo User
grep -r "interface User\|type User" src/

# Buscar componentes que usen datos de usuario
grep -r "user\.id\|user\.nombre\|user\.email" src/

# Buscar formularios de creación de usuarios
grep -r "createUser\|create.*user" src/ -i

# Buscar AuthContext
find src/ -name "*Auth*" -o -name "*auth*"
```

---

## 📌 Notas Importantes

1. **Compatibilidad hacia atrás**: `empresa_id` es opcional (`null` por defecto), por lo que usuarios existentes seguirán funcionando sin cambios.

2. **Validación en Frontend**: Aunque `empresa_id` es opcional, si se proporciona, valida que:
   - Sea un número entero positivo
   - La empresa exista (si cargas la lista de empresas)

3. **Token JWT**: El token JWT no incluye `empresa_id` por defecto. Si necesitas el `empresa_id` después de decodificar el token, deberás obtenerlo del endpoint `/auth/me`.

4. **Filtrado por Empresa**: Considera agregar filtros por empresa en listas de usuarios si tienes administradores que gestionan múltiples empresas.

5. **Permisos**: Considera implementar lógica de permisos basada en empresa:
   - Usuarios solo pueden ver datos de su empresa
   - Admins pueden ver todas las empresas
   - Auditors pueden tener acceso específico

---

## 🚀 Próximos Pasos Recomendados

1. **Fase 1 - Actualización Mínima**:
   - Actualizar tipos TypeScript
   - Verificar que login y perfil funcionen con `empresa_id`
   - Actualizar formulario de creación de usuarios

2. **Fase 2 - Gestión Básica**:
   - Crear servicio de empresas
   - Agregar selector de empresa en formularios
   - Mostrar empresa en perfil de usuario

3. **Fase 3 - Funcionalidad Completa**:
   - Crear componentes completos de gestión de empresas
   - Implementar filtros por empresa
   - Agregar métricas por empresa en dashboard

---

**Fecha de actualización**: {{ fecha }}
**Versión del backend**: Con soporte para empresas
**Compatibilidad**: Total (cambios son retrocompatibles)

