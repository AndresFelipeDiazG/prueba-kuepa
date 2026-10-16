# Kuepa CRM

Aplicación de prueba técnica para la gestión de leads.

## Inicio rápido

Requisitos:

- Docker Desktop iniciado.
- Docker Compose incluido en Docker Desktop.

Desde la raíz del proyecto:

```bash
docker compose up --build
```

Servicios:

- Frontend: http://localhost:5173
- Backend: http://localhost:7001
- MongoDB: mongodb://localhost:27017

El backend ejecuta el seeder inicial automáticamente antes de iniciar Express.

Credenciales locales por defecto:

- Usuario: `kuepa.admin`
- Contraseña: `KuepaDev2026!`

Para detener los servicios:

```bash
docker compose down
```

Para detenerlos y eliminar también los datos locales de MongoDB:

```bash
docker compose down -v
```
