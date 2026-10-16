# Kuepa CRM

Aplicación de prueba técnica para la gestión de leads.

## Inicio rápido

Requisitos:

- Docker Desktop iniciado.
- Docker Compose incluido en Docker Desktop.

Antes del primer inicio, crea tu archivo local de variables de entorno:

```powershell
Copy-Item .env.example .env
```

Edita `.env` y reemplaza todos los valores `replace-*` por valores propios. El archivo `.env` está excluido de Git y nunca debe subirse al repositorio.

Desde la raíz del proyecto:

```bash
docker compose up --build
```

Servicios:

- Frontend: http://localhost:5173
- Backend: http://localhost:7001
- MongoDB: servicio interno `mongo:27017`

MongoDB no se expone directamente al host; únicamente el backend accede a él mediante la red interna de Docker.

El backend ejecuta el seeder inicial automáticamente antes de iniciar Express usando las credenciales definidas en `.env`.

Para detener los servicios:

```bash
docker compose down
```

Para detenerlos y eliminar también los datos locales de MongoDB:

```bash
docker compose down -v
```
