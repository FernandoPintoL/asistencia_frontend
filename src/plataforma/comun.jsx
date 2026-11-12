// Piezas compartidas por las pantallas de la plataforma.
import { useEffect, useRef } from "react";
import { fechaHora } from "../formato";

export const ESTADOS_TENANT = {
  PENDIENTE: ["Pendiente", "e-PROGRAMADA"],
  APROVISIONANDO: ["Aprovisionando", "e-PENDIENTE"],
  ACTIVO: ["Activo", "e-PRESENTE"],
  ACTUALIZANDO: ["Actualizando", "e-PENDIENTE"],
  SUSPENDIENDO: ["Suspendiendo", "e-PENDIENTE"],
  SUSPENDIDO: ["Suspendido", "e-SUSPENDIDO"],
  REANUDANDO: ["Reanudando", "e-PENDIENTE"],
  RESPALDANDO: ["Respaldando", "e-PENDIENTE"],
  RESTAURANDO: ["Restaurando", "e-PENDIENTE"],
  ELIMINANDO: ["Eliminando", "e-PENDIENTE"],
  ELIMINADO: ["Eliminado", "e-PROGRAMADA"],
  ERROR: ["Con error", "e-FALTA"],
};

export const ESTADOS_OPERACION = {
  PENDIENTE: ["En cola", "e-PROGRAMADA"],
  EJECUTANDO: ["Ejecutando", "e-PENDIENTE"],
  EXITOSA: ["Exitosa", "e-PRESENTE"],
  FALLIDA: ["Fallida", "e-FALTA"],
};

export const TIPOS_OPERACION = {
  CREAR: "Crear",
  ACTUALIZAR: "Actualizar",
  CAMBIAR_PLAN: "Cambiar plan",
  PREVISUALIZAR: "Previsualizar",
  SUSPENDER: "Suspender",
  REANUDAR: "Reanudar",
  RESPALDAR: "Respaldar",
  RESTAURAR: "Restaurar",
  ELIMINAR: "Eliminar",
};

/** 2048 → "2 KB" */
export function tamano(bytes) {
  if (bytes == null) return "—";
  const u = ["B", "KB", "MB", "GB"];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < u.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v < 10 && i ? v.toFixed(1) : Math.round(v)} ${u[i]}`;
}

export const ENTORNOS = { dev: "Desarrollo", staging: "Pruebas", prod: "Producción" };

export function EstadoTenant({ estado }) {
  const [texto, clase] = ESTADOS_TENANT[estado] || [estado, "e-PROGRAMADA"];
  return <span className={`badge-estado ${clase}`}>{texto}</span>;
}

export function EstadoOperacion({ estado }) {
  const [texto, clase] = ESTADOS_OPERACION[estado] || [estado, "e-PROGRAMADA"];
  return <span className={`badge-estado ${clase}`}>{texto}</span>;
}

// Estado de una instancia EC2 tal como lo informa AWS
const ESTADOS_EC2 = {
  running: ["Encendida", "e-PRESENTE"],
  stopped: ["Detenida", "e-SUSPENDIDO"],
  pending: ["Encendiendo", "e-PENDIENTE"],
  stopping: ["Deteniendo", "e-PENDIENTE"],
  "shutting-down": ["Terminando", "e-FALTA"],
  terminated: ["No existe", "e-FALTA"],
  no_existe: ["No existe", "e-FALTA"],
};

export function EstadoEc2({ estado }) {
  const [texto, clase] = ESTADOS_EC2[estado] || [estado, "e-PROGRAMADA"];
  return <span className={`badge-estado ${clase}`}>{texto}</span>;
}

export const enCurso = (op) => op && (op.estado === "PENDIENTE" || op.estado === "EJECUTANDO");

/** Barra de progreso de una operación (RF-11). */
export function Progreso({ op, compacto = false }) {
  const valor = op.estado === "EXITOSA" ? 100 : op.progreso || 0;
  const color = op.estado === "FALLIDA" ? "bg-danger" : op.estado === "EXITOSA" ? "bg-success" : "";
  return (
    <div>
      <div className="progress" style={{ height: compacto ? 6 : 10 }} role="progressbar"
           aria-label="Progreso de la operación" aria-valuenow={valor} aria-valuemin={0} aria-valuemax={100}>
        <div className={`progress-bar ${color} ${enCurso(op) ? "progress-bar-striped progress-bar-animated" : ""}`}
             style={{ width: `${Math.max(valor, enCurso(op) ? 4 : 0)}%` }} />
      </div>
      {!compacto && <div className="small text-secondary mt-1">{op.paso || "—"}</div>}
    </div>
  );
}

/** Ejecuta `cargar` cada `ms` mientras `activo` sea true (progreso en vivo sin recargar). */
export function useConsultaPeriodica(cargar, activo, ms = 3000) {
  const ref = useRef(cargar);
  ref.current = cargar;
  useEffect(() => {
    if (!activo) return undefined;
    const id = setInterval(() => ref.current(), ms);
    return () => clearInterval(id);
  }, [activo, ms]);
}

/** Errores de validación de DRF ({campo: ["msg"]}) como {campo: "msg"}. */
export function erroresDeCampos(e) {
  if (!e?.data || e.data.detail) return {};
  return Object.fromEntries(
    Object.entries(e.data).map(([k, v]) => [k, Array.isArray(v) ? v.join(" ") : String(v)]),
  );
}

export function Campo({ id, etiqueta, error, ayuda, children }) {
  return (
    <div className="mb-3">
      <label className="form-label fw-semibold" htmlFor={id}>{etiqueta}</label>
      {children}
      {error && <div className="invalid-feedback d-block">{error}</div>}
      {ayuda && !error && <div className="form-text">{ayuda}</div>}
    </div>
  );
}

export const momento = (iso) => (iso ? fechaHora(iso) : "—");

export function duracion(seg) {
  if (seg == null) return "—";
  return seg < 60 ? `${seg} s` : `${Math.floor(seg / 60)} min ${seg % 60} s`;
}

/** Enlace externo seguro (las URLs del tenant vienen de Terraform). */
export function Enlace({ url }) {
  if (!url || !/^https?:\/\//.test(url)) return <span className="text-secondary">—</span>;
  return <a href={url} target="_blank" rel="noreferrer">{url.replace(/^https?:\/\//, "")} <i className="bi bi-box-arrow-up-right small" /></a>;
}

export function Severidad({ valor }) {
  const [texto, clase] = { critica: ["Crítica", "e-FALTA"], aviso: ["Aviso", "e-PENDIENTE"] }[valor] || [valor || "—", "e-PROGRAMADA"];
  return <span className={`badge-estado ${clase}`}>{texto}</span>;
}

export function EstadoAlerta({ estado }) {
  return estado === "ACTIVA"
    ? <span className="badge-estado e-FALTA"><i className="bi bi-bell-fill" /> Activa</span>
    : <span className="badge-estado e-PRESENTE">Resuelta</span>;
}
