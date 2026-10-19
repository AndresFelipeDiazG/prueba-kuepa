# Kuepa CRM

Aplicación web para administrar contactos y centralizar la información comercial de Kuepa. El proyecto parte de una base React + Node + MongoDB y evoluciona hacia un CRM donde **Contacto** es la entidad principal de consulta, edición y seguimiento.

## 1. Objetivo de la solución

La implementación resuelve el ciclo principal de gestión de contactos:

- Crear y editar contactos desde formularios validados.
- Consultar contactos en una tabla con búsqueda, filtros y columnas configurables.
- Mantener datos personales, comerciales, etiquetas y notas en un solo registro.
- Relacionar los contactos con programas, responsables y origen de captación.
- Importar y exportar información en CSV.
- Consultar el detalle completo de un contacto en una ruta propia.
- Mantener compatibilidad con los datos históricos de leads.

La interfaz actual está enfocada en **CRM → Contactos**. El backend conserva el dominio de leads y sus relaciones para soportar la migración y la compatibilidad de datos existentes.

## 2. Arquitectura

```text
Navegador
   │
   ├── Frontend React/Vite :5173
   │       │
   │       └── API HTTP autenticada
   │
   └── Backend Node/Express :7001
           │
           └── MongoDB 7.0 (red interna Docker: mongo:27017)
```

### Frontend

- React 18 + TypeScript.
- Vite para desarrollo y compilación.
- React Router para autenticación, contactos y detalle.
- Tailwind CSS, Radix UI y componentes propios para controles, modales, selects, tooltips y calendario.
- Persistencia de preferencias de columnas en `localStorage`.

### Backend

- Node.js 18 + TypeScript.
- Express como servidor HTTP.
- Mongoose para persistencia en MongoDB.
- JWT para autenticación.
- Validaciones de dominio e índices únicos para teléfono y documento.
- Seeder inicial para usuario, permisos, programas y migración de leads.

### Persistencia

- MongoDB 7.0.
- Volumen Docker `mongo_data` para conservar la información entre reinicios.
- Borrado lógico mediante `mongoose-delete` en las entidades que lo requieren.

## 3. Implementación de Docker

Docker se incorporó desde la configuración inicial del proyecto para que frontend, backend y base de datos pudieran levantarse con el mismo comando y bajo un entorno reproducible.

### Evolución de la configuración

1. Se creó `compose.yaml` con tres servicios: `mongo`, `backend` y `frontend`.
2. Las imágenes de frontend y backend se alinearon a `node:18-alpine`, evitando diferencias entre la versión usada por el proyecto y la versión del contenedor.
3. MongoDB dejó de exponerse directamente al host. Actualmente solo publica su nombre interno `mongo:27017` dentro de la red de Compose.
4. Las variables sensibles pasaron a ser obligatorias en `.env`, en lugar de utilizar credenciales de respaldo dentro de `compose.yaml`.
5. Se agregó un healthcheck de MongoDB y el backend espera a que la base de datos esté saludable antes de iniciar.
6. El backend ejecuta `initSeeder` antes de iniciar el servidor de desarrollo.
7. Se agregaron volúmenes separados para los datos de MongoDB y los `node_modules` de frontend/backend.
8. Se habilitó `CHOKIDAR_USEPOLLING` para que el hot reload funcione correctamente con volúmenes montados en Docker Desktop.

### Servicios y puertos

| Servicio | Imagen/entorno | Puerto host | Función |
|---|---|---:|---|
| `frontend` | Node 18 + Vite | `5173` | Interfaz React |
| `backend` | Node 18 + Express | `7001` | API, autenticación y reglas de negocio |
| `mongo` | MongoDB 7.0 | Interno | Persistencia de datos |

## 4. Inicio rápido

### Requisitos

- Docker Desktop iniciado.
- Docker Compose incluido en Docker Desktop.

### Variables de entorno

Desde la raíz del proyecto:

```powershell
Copy-Item .env.example .env
```

Edita `.env`:

```env
MONGO_URI=mongodb://mongo:27017/kuepa_test?retryWrites=true&w=majority
JWT_SECRET=define-un-secreto-largo-y-aleatorio
SEED_ADMIN_USERNAME=define-el-usuario-administrador
SEED_ADMIN_PASSWORD=define-una-clave-segura
```

`.env` está excluido de Git y no debe subirse al repositorio.

### Levantar el proyecto

```bash
docker compose up --build
o 
docker compose up -d
```

URLs disponibles:

- Frontend: <http://localhost:5173>
- Backend: <http://localhost:7001>
- MongoDB: solo dentro de Docker, en `mongo:27017`

### Detener el proyecto

```bash
docker compose down
```

Para eliminar también el volumen de MongoDB —acción destructiva para los datos locales—:

```bash
docker compose down -v
```

## 5. Funcionalidades implementadas

### Contactos

- Tabla visual de contactos, no tarjetas.
- Búsqueda por nombre, correo, teléfono, documento, programa o etiqueta.
- Filtros acumulables por programa, responsable, origen, estado, etiquetas y fecha.
- Columnas configurables persistidas en `localStorage`.
- Selección individual y selección de los contactos visibles.
- Paginación configurable de 10, 25, 50 o 100 registros.
- Importación CSV con vista previa y botón para descargar un archivo de ejemplo.
- Exportación CSV de todos los resultados filtrados o solo de los seleccionados.
- Avatar con iniciales y color estable por contacto.

### Detalle del contacto

Ruta: `/contacts/:id`

- Formulario de edición en línea.
- El botón de guardar permanece deshabilitado si no existen cambios.
- Datos personales: nombre, apellido, correo, teléfono y documento.
- Datos adicionales: fecha de nacimiento, ciudad, departamento y nivel de escolaridad.
- Datos comerciales: programa, responsable, origen y etiquetas.
- Notas internas desde el panel de acciones.
- Resumen de fecha de creación, estado, origen y etiquetas.
- Modal de confirmación para eliminar contactos.

### Validaciones

- Teléfono: exactamente 10 dígitos.
- Documento: entre 4 y 20 dígitos.
- No se permiten teléfonos duplicados.
- No se permiten documentos duplicados por tipo.
- Fecha de nacimiento válida, no futura y posterior a 1900.
- Errores mostrados debajo del campo correspondiente.

### Experiencia de usuario

- Fondo punteado en la superficie CRM.
- Modales estandarizados.
- Tooltips con título y descripción en botones de ayuda.
- Sidebar con navegación `CRM → Contactos`.
- Al pasar el cursor sobre CRM con el sidebar recogido, aparece una ventana flotante lateral con la sublista Contactos sin expandir el sidebar.
- Tipografía del módulo CRM: Plus Jakarta Sans para títulos e Inter para texto.

## 6. Modelo de datos y decisión de dominio

`Third` representa el contacto principal. `Lead` conserva la información específica del proceso comercial y referencia al contacto mediante `lead.contact`.

Esto evita duplicar la información personal y permite que un contacto sea la fuente de verdad para:

- Datos personales.
- Teléfono y documento.
- Programa y responsable.
- Origen y etiquetas.
- Notas.

Cuando se actualiza un contacto, los leads relacionados se sincronizan. Cuando se elimina un contacto, sus leads relacionados se eliminan y el contacto utiliza borrado lógico.

## 7. Seeder y migración

El comando automático `initSeeder` realiza estas tareas:

- Crea o actualiza el usuario administrador usando las variables de entorno.
- Crea el permiso de administración de etapas y el rol administrador.
- Siembra los seis programas:
  - Auxiliar Administrativo.
  - Mercadeo y Ventas.
  - Procesamiento y Digitación de Datos.
  - Contabilidad y Finanzas.
  - Hotelería y Turismo.
  - Bachillerato acelerado.
- Busca leads históricos sin contacto.
- Crea o reutiliza el contacto correspondiente por teléfono o documento.
- Relaciona cada lead con su contacto mediante `contact`.
- Sincroniza los leads ya relacionados con la información del contacto.

## 8. API principal

Todas las rutas protegidas requieren autenticación.

### Contactos

- `GET /api/third/` — listar contactos, filtros y paginación.
- `GET /api/third/get/:_id` — obtener detalle, lead relacionado e interacciones.
- `POST /api/third/upsert` — crear o actualizar contacto.
- `POST /api/third/note` — agregar una nota.
- `POST /api/third/delete` — eliminar contacto.

### Leads y configuración comercial

- `/api/lead/` — operaciones del dominio de leads.
- `/api/lead-stage/` — etapas configurables.
- `/api/program/` — programas.
- `/api/user/` — usuarios y responsables.
- `/api/auth/` — autenticación.

## 9. Comandos de desarrollo y verificación

### Backend

```bash
cd back
npm install
npm run dev
npm test
```

### Frontend

```bash
cd front
npm install
npm run dev
npm run build
```

El build del frontend ejecuta TypeScript y luego la compilación de Vite. El proyecto también cuenta con pruebas de validaciones de leads, contactos y permisos en el backend.

## 10. Demo sugerida

1. Iniciar sesión con el usuario definido en `.env`.
2. Entrar a `CRM → Contactos`.
3. Crear un contacto y mostrar las validaciones de teléfono/documento.
4. Aplicar búsqueda, filtros y selección de columnas.
5. Abrir el detalle, editar un campo y guardar.
6. Agregar una nota desde el panel de acciones.
7. Mostrar importación y exportación CSV.
8. Explicar la relación entre Contacto, Lead y el seeder de migración.
9. Mostrar cómo Docker levanta los tres servicios con un solo comando.
