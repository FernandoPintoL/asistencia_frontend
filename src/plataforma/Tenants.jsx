import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import Paginacion from "../components/Paginacion";
import { useFiltros } from "../filtros";
import { useManejarError, useTitulo } from "../sesion";
import { ENTORNOS, ESTADOS_TENANT, Enlace, EstadoTenant, Progreso, SaludApp, useConsultaPeriodica } from "./comun";

/** RF-14: consultar tenants por nombre, estado, plan y entorno. */
export default function Tenants() {
  useTitulo("Tenants");
  const manejarError = useManejarError();
  const f = useFiltros(["q", "estado", "plan", "entorno"]);
  const [datos, setDatos] = useState(null);
  const [planes, setPlanes] = useState([]);
  const [ips, setIps] = useState(null);
  const [salud, setSalud] = useState(null);
  const cargarSalud = useCallback(
    () => api("/plataforma/salud/").then((r) => setSalud(r.tenants)).catch(() => setSalud({})),
    [],
  );

  const cargar = useCallback(
    () => api(`/plataforma/tenants/?${f.consulta}`).then(setDatos).catch(manejarError),
    [f.consulta, manejarError],
  );
  useEffect(() => {
    cargar();
  }, [cargar]);
  useEffect(() => {
    api("/plataforma/planes/").then(setPlanes).catch(manejarError);
    api("/plataforma/aws/cuotas/").then((d) => setIps(d.ips_elasticas)).catch(() => setIps(null));
  }, [manejarError]);

  const hayEnCurso = !!datos?.results.some((t) => t.operacion_en_curso);
  useConsultaPeriodica(cargar, hayEnCurso, 4000);
  useEffect(() => {
    cargarSalud();
  }, [cargarSalud, hayEnCurso]); // al terminar una operación cambia la salud
  useConsultaPeriodica(cargarSalud, true, 60000);

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-end mb-3 gap-2">
        <div>
          <h1 className="h3 mb-1">Tenants</h1>
          <p className="text-secondary mb-0">Cada tenant es una institución con su propio frontend, backend y base de datos en AWS.</p>
        </div>
        <div className="d-flex align-items-center gap-3">
          {ips && (
            <span className={`small ${ips.libres === 0 ? "text-danger fw-semibold" : ips.libres === 1 ? "text-warning-emphasis fw-semibold" : "text-secondary"}`}
                  title="Cada tenant ocupa una IP elástica para su frontend. Límite de la cuenta en esta región.">
              <i className="bi bi-hdd-network" /> IPs elásticas: {ips.usadas}/{ips.limite}
            </span>
          )}
          <Link className="btn btn-primary" to="/plataforma/tenants/nuevo"><i className="bi bi-plus-lg" /> Nuevo tenant</Link>
        </div>
      </div>

      <form className="panel p-3 mb-3 row g-2 align-items-end" onSubmit={f.aplicar}>
        <div className="col-md-4">
          <label className="form-label small fw-semibold" htmlFor="f_q">Nombre o identificador</label>
          <input id="f_q" className="form-control" value={f.form.q} onChange={(e) => f.setCampo("q", e.target.value)} />
        </div>
        <div className="col-6 col-md-2">
          <label className="form-label small fw-semibold" htmlFor="f_estado">Estado</label>
          <select id="f_estado" className="form-select" value={f.form.estado} onChange={(e) => f.setCampo("estado", e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(ESTADOS_TENANT).map(([k, [t]]) => <option key={k} value={k}>{t}</option>)}
          </select>
        </div>
        <div className="col-6 col-md-2">
          <label className="form-label small fw-semibold" htmlFor="f_plan">Plan</label>
          <select id="f_plan" className="form-select" value={f.form.plan} onChange={(e) => f.setCampo("plan", e.target.value)}>
            <option value="">Todos</option>
            {planes.map((p) => <option key={p.id} value={p.codigo}>{p.nombre}</option>)}
          </select>
        </div>
        <div className="col-6 col-md-2">
          <label className="form-label small fw-semibold" htmlFor="f_entorno">Entorno</label>
          <select id="f_entorno" className="form-select" value={f.form.entorno} onChange={(e) => f.setCampo("entorno", e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(ENTORNOS).map(([k, t]) => <option key={k} value={k}>{t}</option>)}
          </select>
        </div>
        <div className="col-6 col-md-2 d-flex gap-2">
          <button className="btn btn-primary flex-grow-1">Filtrar</button>
          <button type="button" className="btn btn-outline-secondary" onClick={f.limpiar} aria-label="Limpiar filtros"><i className="bi bi-x-lg" /></button>
        </div>
      </form>

      {datos && (
        <div className="panel table-responsive"><table className="table mb-0 align-middle">
          <thead><tr><th>Tenant</th><th>Entorno</th><th>Plan</th><th>Motor</th><th>Estado</th><th>Aplicación</th><th>¿Responde?</th></tr></thead>
          <tbody>
            {datos.results.map((t) => (
              <tr key={t.id}>
                <td>
                  <Link to={`/plataforma/tenants/${t.id}`} className="fw-semibold text-decoration-none">{t.nombre}</Link>
                  <div className="small text-secondary font-monospace">{t.identificador}</div>
                </td>
                <td>{t.entorno_display}</td>
                <td>{t.plan.nombre}</td>
                <td>{t.motor_display}</td>
                <td style={{ minWidth: 150 }}>
                  <EstadoTenant estado={t.estado} />
                  {t.alertas_activas > 0 && (
                    <Link to={`/plataforma/alertas?tenant=${t.id}&estado=ACTIVA`} className="badge-estado e-FALTA ms-1 text-decoration-none"
                          title="Alertas activas"><i className="bi bi-bell-fill" /> {t.alertas_activas}</Link>
                  )}
                  {t.operacion_en_curso && (
                    <Link to={`/plataforma/operaciones/${t.operacion_en_curso.id}`} className="d-block mt-2 text-decoration-none">
                      <Progreso op={t.operacion_en_curso} compacto />
                      <span className="small text-secondary">{t.operacion_en_curso.tipo_display}…</span>
                    </Link>
                  )}
                </td>
                <td><Enlace url={t.salidas?.url_frontend} /></td>
                <td>{salud?.[t.id]?.estado === "sin_desplegar" ? <span className="text-secondary">—</span> : <SaludApp salud={salud?.[t.id]} />}</td>
              </tr>
            ))}
            {datos.results.length === 0 && (
              <tr><td colSpan={7} className="text-center text-secondary py-4">
                No hay tenants con esos filtros. <Link to="/plataforma/tenants/nuevo">Crea el primero</Link>.
              </td></tr>
            )}
          </tbody>
        </table></div>
      )}
      <Paginacion datos={datos} onCambiar={f.irAPagina} />
    </>
  );
}
