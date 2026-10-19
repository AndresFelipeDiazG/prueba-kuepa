# Presentación — Kuepa CRM

Guion sugerido para una presentación técnica y funcional del proyecto.

## Diapositiva 1 — Título

### Kuepa CRM

**Gestión centralizada de contactos y seguimiento comercial**

Tecnologías: React, TypeScript, Node.js, Express, MongoDB y Docker.

> Mensaje para presentar: “La solución convierte la base existente en un CRM funcional, con Contacto como entidad principal y una infraestructura reproducible mediante Docker.”

## Diapositiva 2 — Punto de partida

El proyecto base ya contaba con:

- Frontend React + TypeScript + Vite.
- Backend Node.js + Express + TypeScript.
- MongoDB mediante Mongoose.
- Autenticación y estructura de dominios.
- Un dominio inicial de leads.

El reto fue llevar esa base a una experiencia CRM completa, usable y consistente.

## Diapositiva 3 — Objetivo de la implementación

- Centralizar la información de los contactos.
- Evitar duplicados de teléfono y documento.
- Permitir seguimiento mediante notas y datos comerciales.
- Facilitar búsqueda, filtros, importación y exportación.
- Mantener la compatibilidad con los leads existentes.
- Entregar un entorno reproducible para desarrollo con Docker.

## Diapositiva 4 — Arquitectura de la solución

```text
Usuario
  ↓
Frontend React/Vite — localhost:5173
  ↓ API autenticada
Backend Express — localhost:7001
  ↓ red interna Docker
MongoDB 7.0 — mongo:27017
```

### Capas

- **Interfaz:** páginas, formularios, tabla, modales y controles de navegación.
- **API:** autenticación, contactos, leads, programas, usuarios y etapas.
- **Dominio:** validaciones, reglas de duplicidad, sincronización y permisos.
- **Persistencia:** modelos Mongoose, índices y borrado lógico.

## Diapositiva 5 — Docker: decisión y evolución

Docker no se agregó solo como una forma de ejecutar la aplicación; se utilizó para garantizar que todos los servicios utilizaran el mismo entorno.

### Evolución

1. Se incorporó Docker Compose con tres servicios: frontend, backend y MongoDB.
2. Se alinearon frontend y backend a `node:18-alpine`, evitando diferencias de runtime.
3. MongoDB quedó disponible únicamente dentro de la red Docker.
4. Las credenciales y secretos pasaron a `.env` obligatorio.
5. Se agregó healthcheck para que el backend espere a MongoDB.
6. El backend ejecuta el seeder antes de arrancar Express.
7. Se agregaron volúmenes para datos y dependencias.
8. Se habilitó polling para mantener el hot reload con Docker Desktop.

### Resultado

Un solo comando levanta el entorno completo:

```bash
docker compose up --build
```

## Diapositiva 6 — Modelo de negocio

### Contacto como fuente de verdad

El contacto representa la información principal de una persona:

- Identidad.
- Teléfono y documento.
- Programa y responsable.
- Origen y etiquetas.
- Notas y estado.

El modelo `Lead` mantiene la información del proceso comercial y referencia al contacto mediante `lead.contact`.

### Beneficio

La información personal no se duplica en distintos registros y puede actualizarse desde un único lugar.

## Diapositiva 7 — Migración y seeder

El `initSeeder` se ejecuta automáticamente antes del backend y:

- Crea o actualiza el usuario administrador.
- Configura el rol y permiso de administración de etapas.
- Siembra seis programas.
- Migra leads históricos sin contacto.
- Reutiliza contactos existentes cuando coinciden teléfono o documento.
- Relaciona los leads con `contact`.
- Sincroniza los datos de los leads ya relacionados.

### Programas sembrados

1. Auxiliar Administrativo.
2. Mercadeo y Ventas.
3. Procesamiento y Digitación de Datos.
4. Contabilidad y Finanzas.
5. Hotelería y Turismo.
6. Bachillerato acelerado.

## Diapositiva 8 — Lista de contactos

La vista principal permite:

- Consultar los contactos en una tabla visual.
- Buscar por nombre, correo, teléfono, documento, programa o etiqueta.
- Filtrar por programa, responsable, origen, estado, etiquetas y fecha.
- Elegir las columnas visibles.
- Seleccionar contactos individualmente o todos los visibles.
- Elegir paginación de 10, 25, 50 o 100 registros.
- Abrir el detalle haciendo clic en una fila.

## Diapositiva 9 — Creación y validación

El formulario de contacto incluye:

- Nombre, apellido y correo.
- Teléfono y documento.
- Fecha de nacimiento.
- Ciudad y departamento.
- Nivel de escolaridad.
- Programa, responsable y origen.
- Etiquetas.

### Reglas principales

- Teléfono de exactamente 10 dígitos.
- Documento entre 4 y 20 dígitos.
- No se permiten teléfonos duplicados.
- No se permiten documentos duplicados por tipo.
- Los mensajes de error aparecen debajo del campo correspondiente.

## Diapositiva 10 — Detalle del contacto

Ruta: `/contacts/:id`

- Página completa con dos columnas.
- Campos siempre editables.
- Vista previa del contacto actualizada en vivo.
- Guardado disponible solo cuando existen cambios.
- Acción para descartar cambios.
- Notas internas desde el menú de acciones.
- Resumen de fecha, estado, origen y etiquetas.
- Modal de advertencia antes de eliminar.

## Diapositiva 11 — Importación y exportación

### Importación

- Archivo CSV.
- Vista previa antes de guardar.
- Resolución de nombres de programa y responsable a sus IDs.
- Compatibilidad con códigos o etiquetas legibles.
- Archivo de ejemplo disponible como descarga.

### Exportación

- Exportación de todos los resultados filtrados.
- Exportación únicamente de los contactos seleccionados.
- Cabeceras legibles para reutilizar el archivo.
- Codificación UTF-8 con BOM para compatibilidad con Excel.

## Diapositiva 12 — Experiencia de usuario

- Fondo CRM punteado para diferenciar el módulo.
- Contactos representados como tabla, no como tarjetas.
- Modales estandarizados.
- Tooltips con título y descripción.
- Selects y calendario con un mismo lenguaje visual.
- Avatar con iniciales y color estable por contacto.
- Tipografía del CRM: Plus Jakarta Sans para títulos e Inter para texto.
- Sidebar reducido con flyout lateral para mostrar `CRM → Contactos` sin expandir todo el sidebar.

## Diapositiva 13 — API y seguridad

### API de contactos

- `GET /api/third/` — listado con paginación y filtros.
- `GET /api/third/get/:_id` — detalle.
- `POST /api/third/upsert` — creación o edición.
- `POST /api/third/note` — nueva nota.
- `POST /api/third/delete` — eliminación.

### Protección

- Rutas principales protegidas mediante middleware de autenticación.
- JWT para las sesiones.
- Secretos definidos mediante variables de entorno.
- MongoDB no expuesto directamente al host.
- Índices únicos para evitar duplicados a nivel de base de datos.

## Diapositiva 14 — Verificación técnica

- Build frontend validado con TypeScript y Vite.
- Pruebas backend para validaciones, duplicidad, etapas y permisos.
- Verificación de los flujos de Docker Compose.
- Healthcheck de MongoDB antes de iniciar el backend.
- Verificación visual de tabla, detalle, modales, tooltips y navegación.

## Diapositiva 15 — Demo recomendada

1. Mostrar el arranque con `docker compose up --build`.
2. Iniciar sesión con el usuario definido en `.env`.
3. Entrar a `CRM → Contactos`.
4. Crear un contacto válido.
5. Intentar repetir teléfono o documento para mostrar la validación.
6. Aplicar búsqueda, filtros y columnas.
7. Abrir el detalle y editar un dato.
8. Agregar una nota.
9. Exportar contactos seleccionados.
10. Mostrar la importación mediante CSV.
11. Explicar brevemente la relación entre Contacto, Lead y el seeder.

## Diapositiva 16 — Cierre

La implementación entrega:

- Un CRM funcional centrado en contactos.
- Reglas de calidad y consistencia de datos.
- Compatibilidad con el modelo histórico de leads.
- Flujo de trabajo completo desde la creación hasta el seguimiento.
- Infraestructura reproducible y aislada mediante Docker.
- Base preparada para futuras extensiones de automatización y seguimiento comercial.
