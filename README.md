# Frontend · Control de asistencia

React + Vite + Bootstrap 5. Son las pantallas del estudiante y del administrador; todos los datos
los pide al [backend](https://github.com/FernandoPintoL/asistencia_backend) por su API.

Infraestructura, plataforma de tenants y documentación del proyecto:
[infraestructura_asistencia](https://github.com/FernandoPintoL/infraestructura_asistencia).

## Puesta en marcha

Necesitas Node.js y el backend encendido.

```powershell
cd frontend
npm install
copy .env.example .env    # VITE_API_URL apunta al backend
npm run dev               # http://localhost:5173
```

- Estudiantes: http://localhost:5173/ → usa `1001` o `juan@gmail.com`
- Administrador: http://localhost:5173/panel/login → `admin` / `admin1234`

## Variables de entorno (`.env`)
| Variable | Para qué |
|---|---|
| `VITE_API_URL` | Dirección del backend terminada en `/api`, ej. `http://127.0.0.1:8000/api` |
| `VITE_PLATAFORMA` | `true` solo en la instalación de la plataforma de tenants (ver abajo) |

## Estructura
| Archivo | Qué contiene |
|---|---|
| `src/main.jsx` | Punto de entrada: carga estilos, router y la sesión |
| `src/App.jsx` | Rutas de la aplicación |
| `src/api.js` | Todas las llamadas al backend (agrega el token JWT) |
| `src/sesion.jsx` | Sesión, protección de rutas por rol y mensajes de aviso |
| `src/filtros.js` | Filtros y paginación guardados en la URL |
| `src/formato.js` | Formato de fechas y horas |
| `src/components/` | Piezas reutilizables (estado, paginación, plantilla) |
| `src/pages/` | Pantallas del estudiante |
| `src/pages/panel/` | Pantallas del administrador |
| `src/plataforma/` | Plataforma de tenants (solo con `VITE_PLATAFORMA=true`) |

## Despliegue
En Vercel, Netlify o similar. Carpeta raíz: `frontend/`, comando `npm run build`, carpeta de salida
`dist/`. Define `VITE_API_URL=https://<dominio del backend>/api`.

`vercel.json` y `public/_redirects` ya están incluidos para que las rutas de React
(ej. `/panel/modulos`) funcionen al recargar la página.

## Plataforma de tenants (`src/plataforma/`)

Pantallas para crear y administrar tenants (instituciones), cada uno con su propio frontend,
backend y base de datos en AWS. **Solo se compilan con `VITE_PLATAFORMA=true`**: los tenants
usan este mismo repositorio sin esa variable y su build no contiene nada de la plataforma
(se carga con `lazy()` y Vite la descarta).

```powershell
# backend con PLATAFORMA_HABILITADA=True y el worker encendidos (ver README del backend)
$env:VITE_PLATAFORMA="true"; npm run dev     # http://localhost:5173/plataforma
```

| Ruta | Quién | Para qué |
|---|---|---|
| `/plataforma/login` | todos | Ingreso (el rol lo decide el backend) |
| `/plataforma` | admin plataforma | Tenants con filtros por nombre, estado, plan y entorno; progreso en vivo |
| `/plataforma/tenants/nuevo` | admin plataforma | Alta: datos, plan (tarjetas con sus características), entorno, motor y versión |
| `/plataforma/tenants/:id` | admin plataforma / admin del tenant | Datos, servicios, operaciones y respaldos; actualizar, suspender/reanudar, respaldar y restaurar |
| `/plataforma/tenants/:id/cambiar-plan` | admin plataforma | Qué recursos cambian y con qué efecto, antes de confirmar |
| `/plataforma/tenants/:id/eliminar` | admin plataforma | Recursos y datos que se borrarán; confirmación escribiendo el identificador |
| `/plataforma/operaciones` | admin plataforma | Historial: quién, cuándo, resultado, duración |
| `/plataforma/operaciones/:id` | admin plataforma / admin del tenant | Progreso en vivo, error comprensible, reintento, versiones usadas y registro |
| `/plataforma/planes` | admin plataforma | Catálogo de planes: crear y editar recursos, límites y precio |
| `/plataforma/alertas` | admin plataforma / admin del tenant | Alertas de Grafana con tenant, severidad y hora de detección |
| `/plataforma/auditoria` | admin plataforma | Quién hizo qué y cuándo |
| `/plataforma/mi-tenant` | admin del tenant | Estado de los servicios de su institución |

Las pantallas consultan al backend cada 2 a 5 segundos solo mientras hay una operación en curso.
