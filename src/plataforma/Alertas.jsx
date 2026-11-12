import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import Paginacion from "../components/Paginacion";
import { useFiltros } from "../filtros";
import { useFlash, useManejarError, useSesion, useTitulo } from "../sesion";
import { ENTORNOS, EstadoAlerta, Severidad, momento, useConsultaPeriodica } from "./comun";

/** RF-29: alertas y eventos recientes, con el tenant afectado y la hora de detección. */
export default function Alertas() {
  useTitulo("Alertas");
  const { sesion } = useSesion();
  const esAdmin = sesion.rol === "plataforma";
  const { flash } = useFlash();
  const manejarError = useManejarError();
  const f = useFiltros(["estado", "severidad", "entorno", "tenant"]);
  const [datos, setDatos] = useState(null);
  const [monitoreo, setMonitoreo] = useState(null);
  const [sincronizando, setSincronizando] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [simulacion, setSimulacion] = useState({ tenant: "", tipo: "app-caida" });

  const cargar = useCallback(
    () => api(`/plataforma/alertas/?${f.consulta}`).then(setDatos).catch(manejarError),
    [f.consulta, manejarError],
  );
  useEffect(() => {
    cargar();
  }, [cargar]);
  useEffect(() => {
    api("/plataforma/monitoreo/").then(setMonitoreo).catch(manejarError);
  }, [manejarError]);
  useEffect(() => {
    if (monitoreo?.simulado && esAdmin) {
      api("/plataforma/tenants/").then((d) => {
        setTenants(d.results);
        setSimulacion((s) => ({ ...s, tenant: s.tenant || String(d.results[0]?.id || "") }));
      }).catch(manejarError);
    }
  }, [monitoreo, esAdmin, manejarError]);

  async function simular(resolver) {
    try {
      const r = await api("/plataforma/alertas/simular/", {
        method: "POST", body: { tenant: simulacion.tenant, tipo: simulacion.tipo, resolver },
      });
      flash("success", r.detail);
      cargar();
    } catch (e) {
      manejarError(e);
    }
  }
  useConsultaPeriodica(cargar, true, 30000); // el worker trae las alertas de Grafana cada 30 s

  async function sincronizar() {
    setSincronizando(true);
    try {
      const r = await api("/plataforma/alertas/sincronizar/", { method: "POST" });
      flash("success", r.detail);
      cargar();
    } catch (e) {
      manejarError(e);
    }
    setSincronizando(false);
  }

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-end mb-3 gap-2">
        <div>
          <h1 className="h3 mb-1">Alertas</h1>
          <p className="text-secondary mb-0">
            Las detecta Grafana a partir de las métricas de cada tenant: servicio caído, aumento de errores,
            lentitud y límites de recursos o del plan.
          </p>
        </div>
        <div className="d-flex gap-2">
          {monitoreo?.grafana && (
            <a className="btn btn-outline-secondary" href={monitoreo.grafana} target="_blank" rel="noreferrer">
              <i className="bi bi-graph-up" /> Abrir Grafana
            </a>
          )}
          {esAdmin && (
            <button className="btn btn-primary" onClick={sincronizar} disabled={sincronizando || !monitoreo?.configurado}>
              <i className="bi bi-arrow-repeat" /> Actualizar ahora
            </button>
          )}
        </div>
      </div>

      {monitoreo?.simulado && esAdmin && (
        <div className="panel p-3 mb-3 border-warning">
          <div className="fw-semibold mb-2"><i className="bi bi-cone-striped" /> Modo simulado · probar alertas</div>
          <div className="row g-2 align-items-end">
            <div className="col-md-4">
              <label className="form-label small" htmlFor="s_tenant">Tenant</label>
              <select id="s_tenant" className="form-select" value={simulacion.tenant}
                      onChange={(e) => setSimulacion((s) => ({ ...s, tenant: e.target.value }))}>
                {tenants.length === 0 && <option value="">Crea un tenant primero</option>}
                {tenants.map((t) => <option key={t.id} value={t.id}>{t.nombre} ({t.identificador}/{t.entorno})</option>)}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label small" htmlFor="s_tipo">Alerta</label>
              <select id="s_tipo" className="form-select" value={simulacion.tipo}
                      onChange={(e) => setSimulacion((s) => ({ ...s, tipo: e.target.value }))}>
                {(monitoreo.tipos_alerta || []).map((t) => <option key={t.codigo} value={t.codigo}>{t.nombre}</option>)}
              </select>
            </div>
            <div className="col-md-4 d-flex gap-2">
              <button className="btn btn-warning flex-grow-1" disabled={!simulacion.tenant} onClick={() => simular(false)}>Disparar</button>
              <button className="btn btn-outline-success flex-grow-1" disabled={!simulacion.tenant} onClick={() => simular(true)}>Resolver</button>
            </div>
          </div>
        </div>
      )}

      {monitoreo && !monitoreo.configurado && (
        <div className="alert alert-warning">
          Grafana no está configurado en la plataforma: define <code>GRAFANA_URL</code> y <code>GRAFANA_TOKEN</code> (o
          <code> GRAFANA_PASSWORD</code>). Mientras tanto no llegan alertas nuevas.
        </div>
      )}

      <form className="panel p-3 mb-3 row g-2 align-items-end" onSubmit={f.aplicar}>
        <div className="col-6 col-md-3">
          <label className="form-label small fw-semibold" htmlFor="a_estado">Estado</label>
          <select id="a_estado" className="form-select" value={f.form.estado} onChange={(e) => f.setCampo("estado", e.target.value)}>
            <option value="">Todas</option>
            <option value="ACTIVA">Activas</option>
            <option value="RESUELTA">Resueltas</option>
          </select>
        </div>
        <div className="col-6 col-md-3">
          <label className="form-label small fw-semibold" htmlFor="a_sev">Severidad</label>
          <select id="a_sev" className="form-select" value={f.form.severidad} onChange={(e) => f.setCampo("severidad", e.target.value)}>
            <option value="">Todas</option>
            <option value="critica">Crítica</option>
            <option value="aviso">Aviso</option>
          </select>
        </div>
        <div className="col-6 col-md-3">
          <label className="form-label small fw-semibold" htmlFor="a_ent">Entorno</label>
          <select id="a_ent" className="form-select" value={f.form.entorno} onChange={(e) => f.setCampo("entorno", e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(ENTORNOS).map(([k, t]) => <option key={k} value={k}>{t}</option>)}
          </select>
        </div>
        <div className="col-6 col-md-3 d-flex gap-2">
          <button className="btn btn-primary flex-grow-1">Filtrar</button>
          <button type="button" className="btn btn-outline-secondary" onClick={f.limpiar} aria-label="Limpiar filtros"><i className="bi bi-x-lg" /></button>
        </div>
        {f.activos.tenant && <div className="col-12 small text-secondary">Mostrando solo un tenant.</div>}
      </form>

      {datos && (
        <div className="panel table-responsive"><table className="table mb-0 align-middle">
          <thead><tr><th>Detectada</th><th>Tenant</th><th>Alerta</th><th>Severidad</th><th>Estado</th></tr></thead>
          <tbody>
            {datos.results.map((a) => (
              <tr key={a.id} className={a.estado === "ACTIVA" ? "" : "text-secondary"}>
                <td className="text-nowrap small">{momento(a.detectada_en)}</td>
                <td>
                  {a.tenant ? <Link to={`/plataforma/tenants/${a.tenant.id}`} className="text-decoration-none">{a.tenant.nombre}</Link>
                    : <span>{a.identificador || "—"}</span>}
                  <div className="small text-secondary font-monospace">
                    {a.identificador}{a.entorno && `/${a.entorno}`}{a.servicio && ` · ${a.servicio}`}
                  </div>
                </td>
                <td>
                  <div className="fw-semibold">{a.nombre}</div>
                  <div className="small">{a.resumen}</div>
                  {a.descripcion && <div className="small text-secondary">{a.descripcion}</div>}
                </td>
                <td><Severidad valor={a.severidad} /></td>
                <td className="text-nowrap">
                  <EstadoAlerta estado={a.estado} />
                  {a.resuelta_en && <div className="small text-secondary mt-1">{momento(a.resuelta_en)}</div>}
                </td>
              </tr>
            ))}
            {datos.results.length === 0 && (
              <tr><td colSpan={5} className="text-center text-secondary py-4">
                <i className="bi bi-check-circle text-success" /> No hay alertas con esos filtros.
              </td></tr>
            )}
          </tbody>
        </table></div>
      )}
      <Paginacion datos={datos} onCambiar={f.irAPagina} />
    </>
  );
}
