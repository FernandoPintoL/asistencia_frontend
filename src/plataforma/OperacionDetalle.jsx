import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useManejarError, useSesion, useTitulo } from "../sesion";
import { EstadoOperacion, Progreso, duracion, enCurso, momento, useConsultaPeriodica } from "./comun";

const ACCIONES = {
  create: ["Crear", "text-success"],
  update: ["Modificar", "text-primary"],
  delete: ["Eliminar", "text-danger"],
  reemplazar: ["Reemplazar", "text-warning"],
};

function accion(acciones) {
  if (acciones.includes("create") && acciones.includes("delete")) return ACCIONES.reemplazar;
  return ACCIONES[acciones[0]] || [acciones.join(", "), ""];
}

/** RF-11: progreso y resultado; RF-12: reintentar; RF-13: versiones usadas. */
export default function OperacionDetalle() {
  const { id } = useParams();
  const { sesion } = useSesion();
  const esAdmin = sesion.rol === "plataforma";
  const navigate = useNavigate();
  const manejarError = useManejarError();
  const [op, setOp] = useState(null);
  const [reintentando, setReintentando] = useState(false);
  const logRef = useRef(null);
  useTitulo(op ? `Operación #${op.id}` : "Operación");

  const cargar = useCallback(() => api(`/plataforma/operaciones/${id}/`).then(setOp).catch(manejarError), [id, manejarError]);
  useEffect(() => {
    setOp(null);
    cargar();
  }, [cargar]);
  useConsultaPeriodica(cargar, enCurso(op), 2000);

  // El log sigue la última línea mientras la operación avanza
  useEffect(() => {
    if (logRef.current && enCurso(op)) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [op]);

  async function reintentar() {
    setReintentando(true);
    try {
      const r = await api(`/plataforma/operaciones/${id}/reintentar/`, { method: "POST" });
      navigate(`/plataforma/operaciones/${r.operacion.id}`, { state: { flash: { tipo: "success", texto: r.detail } } });
    } catch (e) {
      manejarError(e);
    }
    setReintentando(false);
  }

  if (!op) return null;
  const cambios = op.resultado?.cambios;
  const versiones = op.versiones || {};

  return (
    <>
      <Link to={`/plataforma/tenants/${op.tenant.id}`} className="small text-secondary text-decoration-none">
        <i className="bi bi-arrow-left" /> {op.tenant.nombre}
      </Link>
      <div className="d-flex flex-wrap justify-content-between align-items-center mt-1 mb-3 gap-2">
        <h1 className="h3 mb-0">{op.tipo_display} <span className="text-secondary fw-normal">#{op.id}</span></h1>
        <EstadoOperacion estado={op.estado} />
      </div>

      <div className="panel p-4 mb-3">
        <Progreso op={op} />
        {op.estado === "FALLIDA" && (
          <div className="alert alert-danger mt-3 mb-0 d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div><i className="bi bi-exclamation-octagon" /> {op.error}</div>
            {esAdmin && (
              <button className="btn btn-danger btn-sm" onClick={reintentar} disabled={reintentando}>
                <i className="bi bi-arrow-clockwise" /> Reintentar
              </button>
            )}
          </div>
        )}
        {op.estado === "EXITOSA" && op.resultado?.url && (
          <div className="alert alert-success mt-3 mb-0">
            Listo. La aplicación estará disponible en <a href={op.resultado.url} target="_blank" rel="noreferrer">{op.resultado.url}</a> cuando
            los servidores terminen de instalarse (5 a 10 minutos).
          </div>
        )}
      </div>

      <div className="row g-3">
        <div className="col-lg-5">
          <div className="panel p-4 mb-3">
            <h2 className="h5 mb-3">Detalle</h2>
            <dl className="row mb-0 small">
              <dt className="col-5">Tenant</dt><dd className="col-7 font-monospace">{op.tenant.identificador}/{op.tenant.entorno}</dd>
              <dt className="col-5">Solicitada por</dt><dd className="col-7">{op.solicitada_por_nombre}</dd>
              <dt className="col-5">Creada</dt><dd className="col-7">{momento(op.creada_en)}</dd>
              <dt className="col-5">Inicio</dt><dd className="col-7">{momento(op.iniciada_en)}</dd>
              <dt className="col-5">Fin</dt><dd className="col-7">{momento(op.finalizada_en)}</dd>
              <dt className="col-5">Duración</dt><dd className="col-7">{duracion(op.duracion_seg)}</dd>
              {Object.keys(op.parametros || {}).length > 0 && (<>
                <dt className="col-5">Parámetros</dt>
                <dd className="col-7 font-monospace">{Object.entries(op.parametros).map(([k, v]) => `${k}=${v}`).join(", ")}</dd>
              </>)}
              {op.reintento_de && (<>
                <dt className="col-5">Reintento de</dt>
                <dd className="col-7"><Link to={`/plataforma/operaciones/${op.reintento_de}`}>#{op.reintento_de}</Link></dd>
              </>)}
            </dl>
          </div>

          <div className="panel p-4">
            <h2 className="h5 mb-3">Versiones usadas</h2>
            {Object.keys(versiones).length === 0 ? <p className="small text-secondary mb-0">Se registran al iniciar.</p> : (
              <dl className="row mb-0 small">
                <dt className="col-5">Motor</dt><dd className="col-7">{versiones.motor} {versiones.motor_version}</dd>
                <dt className="col-5">Aplicación</dt><dd className="col-7 font-monospace">{versiones.app_version}</dd>
                <dt className="col-5">Plan</dt><dd className="col-7">{versiones.plan}</dd>
                <dt className="col-5">Plantilla</dt>
                <dd className="col-7"><span className="font-monospace">{versiones.plantilla}</span>
                  {versiones.plantilla_sha256 && <div className="text-secondary">sha256 {versiones.plantilla_sha256}</div>}</dd>
                {versiones.proveedores && Object.keys(versiones.proveedores).length > 0 && (<>
                  <dt className="col-5">Proveedores</dt>
                  <dd className="col-7 font-monospace">{Object.entries(versiones.proveedores).map(([k, v]) => `${k} ${v}`).join(" · ")}</dd>
                </>)}
              </dl>
            )}
          </div>
        </div>

        <div className="col-lg-7">
          {cambios && (
            <div className="panel p-4 mb-3">
              <h2 className="h5 mb-3">Cambios calculados por el motor</h2>
              {cambios.length === 0 ? <p className="text-secondary mb-0">No hay cambios: la infraestructura ya coincide.</p> : (
                <table className="table table-sm mb-0">
                  <thead><tr><th>Acción</th><th>Recurso</th></tr></thead>
                  <tbody>
                    {cambios.map((c) => {
                      const [texto, clase] = accion(c.acciones);
                      return <tr key={c.recurso}><td className={`fw-semibold ${clase}`}>{texto}</td><td className="font-monospace small">{c.recurso}</td></tr>;
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
          {esAdmin && (
            <div className="panel p-4">
              <h2 className="h5 mb-1">Registro</h2>
              <p className="small text-secondary">Salida del motor. Los secretos se ocultan antes de guardarla.</p>
              <pre ref={logRef} className="registro mb-0">{op.log || "Sin salida todavía."}</pre>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
