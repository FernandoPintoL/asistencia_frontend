# Frontend · Control de asistencia

React + Vite + Bootstrap 5. Son las pantallas del estudiante y del administrador; todos los datos
los pide al [backend](../backend/README.md) por su API.

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

## Despliegue
En Vercel, Netlify o similar. Carpeta raíz: `frontend/`, comando `npm run build`, carpeta de salida
`dist/`. Define `VITE_API_URL=https://<dominio del backend>/api`.

`vercel.json` y `public/_redirects` ya están incluidos para que las rutas de React
(ej. `/panel/modulos`) funcionen al recargar la página.
