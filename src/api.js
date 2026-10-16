// Comunicación con el backend (Django). Todas las llamadas pasan por aquí.

const BASE = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "");
const CLAVE = "sesion";

export class ApiError extends Error {
  constructor(status, data) {
    super(data?.detail || "Ocurrió un error inesperado.");
    this.status = status;
    this.data = data || {};
    this.manejado = false; // true cuando ya se redirigió al login
  }
}

// ── Sesión guardada en el navegador: { token, rol, nombre } ──

export function leerSesion() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE));
  } catch {
    return null;
  }
}

export function guardarSesion(sesion) {
  try {
    if (sesion) localStorage.setItem(CLAVE, JSON.stringify(sesion));
    else localStorage.removeItem(CLAVE);
  } catch {
    // sin almacenamiento disponible: la sesión dura hasta recargar la página
  }
}

// Lo define AuthProvider: qué hacer cuando el backend rechaza el token.
let alExpirar = () => {};
export function alExpirarSesion(fn) {
  alExpirar = fn;
}

/**
 * api("/panel/resumen/")                          → GET, devuelve JSON
 * api("/estudiante/marcar/", { method: "POST" })   → POST
 * api(ruta, { method: "POST", body: {...} })       → envía JSON
 * api(ruta, { method: "POST", body: formData })    → envía archivos
 * api(ruta, { descarga: true })                    → devuelve la Response (para Excel)
 */
export async function api(ruta, { method = "GET", body, descarga = false } = {}) {
  const sesion = leerSesion();
  const headers = {};
  if (sesion?.token) headers.Authorization = `Bearer ${sesion.token}`;
  let cuerpo = body;
  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    cuerpo = JSON.stringify(body);
  }

  let resp;
  try {
    resp = await fetch(BASE + ruta, { method, headers, body: cuerpo });
  } catch {
    throw new ApiError(0, { detail: "No se pudo conectar con el servidor. Verifica que el backend esté encendido." });
  }

  if (!resp.ok) {
    const error = new ApiError(resp.status, await resp.json().catch(() => ({})));
    if (resp.status === 401 && sesion?.token) {
      alExpirar(sesion.rol);
      error.manejado = true;
    }
    throw error;
  }
  if (descarga) return resp;
  return resp.json();
}
