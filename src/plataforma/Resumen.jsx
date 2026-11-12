import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useManejarError, useTitulo } from "../sesion";
import { Barras, EstadoOperacion, Progreso, SaludApp, Severidad, momento, useConsultaPeriodica } from "./comun";

const ORDEN_SALUD = ["caido", "instalando", "en_operacion", "responde", "suspendido", "sin_desplegar"];
const NOMBRE_SALUD = {
  responde: "Responden", instalando: "Instalando", caido: "Caídas",
  suspendido: "Detenidas (suspendidos)", en_operacion: "En operación", sin_desplegar: "Sin desplegar",
};

function Cifra({ valor, etiqueta, sub, to, alerta }) {
  const contenido = (
    <div className={`panel p-3 h-100 ${alerta ? "border-danger" : ""}`}>
      <div className="stat">{valor}</div>
      <div className="text-secondary">{etiqueta}</div>
      {sub && <div className="stat-sub mt-1">{sub}</div>}
    </div>
  );
  return to ? <Link to={to} className="tarjeta-link">{contenido}</Link> : contenido;
}

/** Página de inicio del administrador: el estado de toda la plataforma de un vistazo. */
export default function Resumen() {
  useTitulo("Inicio · Plataforma");
  const manejarError = useManejarError();
  const [d, setD] = useState(null);
  const [ips, setIps] = useState(null);
  const [salud, setSalud] = useState(null);
  const [tenants, setTenants] = useState([]);

  const cargar = useCallback(() => api("/plataforma/resumen/").then(setD).catch(manejarError), [manejarError]);
  const cargarSalud = useCallback(() => Promise.all([
    api("/plataforma/salud/").then((r) => setSalud(r.tenants)),
    api("/plataforma/tenants/").then((r) => setTenants(r.results)),
  ]).catch(manejarError), [manejarError]);

  useEffect(() => {
    cargar();
    cargarSalud();
    api("/plataforma/aws/cuotas/").then((r) => setIps(r.ips_elasticas)).catch(() => setIps(null));
  }, [cargar, cargarSalud]);
  useConsultaPeriodica(cargar, !!d?.en_curso.length, 4000);
  useConsultaPeriodica(cargarSalud, true, 60000); // la salud cambia despacio: cada minuto

  if (!d) return null;
  const t = d.tenants;

  const conteoSalud = salud ? Object.values(salud).reduce((c, s) => ({ ...c, [s.estado]: (c[s.estado] || 0) + 1 }), {}) : {};
  const problemas = tenants.filter((x) => ["caido", "instalando"].includes(salud?.[x.id]?.estado));
  const ops = d.operaciones_30_dias;

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-end mb-3 gap-2">
        <div>
          <h1 className="h3 mb-1">Inicio</h1>
          <p className="text-secondary mb-0">Estado de la plataforma de tenants de un vistazo.</p>
        </div>
        <div className="d-flex gap-2">
          <Link className="btn btn-outline-primary" to="/plataforma/motores"><i className="bi bi-bar-chart" /> Comparar motores</Link>
          <Link className="btn btn-primary" to="/plataforma/tenants/nuevo"><i className="bi bi-plus-lg" /> Nuevo tenant</Link>
        </div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-6 col-lg-2">
          <Cifra valor={t.total} etiqueta="Tenants" sub={`${t.activos} activos · ${t.suspendidos} suspendidos`} to="/plataforma/tenants" />
        </div>
        <div className="col-6 col-lg-2">
          <Cifra valor={conteoSalud.responde ?? "…"} etiqueta="Apps que responden"
                 sub={salud ? `de ${Object.keys(salud).length - (conteoSalud.sin_desplegar || 0)} desplegadas` : "consultando…"} />
        </div>
        <div className="col-6 col-lg-2">
          <Cifra valor={d.alertas_activas} etiqueta="Alertas activas" alerta={d.alertas_activas > 0}
                 to="/plataforma/alertas?estado=ACTIVA" />
        </div>
        <div className="col-6 col-lg-2">
          <Cifra valor={t.con_error} etiqueta="Con error" alerta={t.con_error > 0} to="/plataforma/tenants?estado=ERROR" />
        </div>
        <div className="col-6 col-lg-2">
          <Cifra valor={`$${Number(d.facturacion_mensual_usd).toLocaleString("es-BO", { maximumFractionDigits: 0 })}`}
                 etiqueta="Facturación / mes" sub={`${d.tenants_facturables} tenants según su plan (USD)`} />
        </div>
        <div className="col-6 col-lg-2">
          <Cifra valor={ips ? `${ips.usadas}/${ips.limite}` : "—"} etiqueta="IPs elásticas" alerta={ips?.libres === 0}
                 sub={ips ? (ips.libres ? `${ips.libres} libre${ips.libres > 1 ? "s" : ""}` : "Sin IPs para tenants nuevos") : "sin datos de AWS"} />
        </div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-lg-4">
          <div className="panel p-4 h-100">
            <h2 className="h6 mb-3">Tenants por estado</h2>
            <Barras filas={t.por_estado.map((e) => ({ clave: e.codigo, etiqueta: e.nombre, valor: e.total }))} />
          </div>
        </div>
        <div className="col-lg-4">
          <div className="panel p-4 h-100">
            <h2 className="h6 mb-3">Tenants por motor</h2>
            <Barras filas={t.por_motor.map((e) => ({ clave: e.codigo, etiqueta: e.nombre, valor: e.total }))} />
            <h2 className="h6 mt-4 mb-3">Tenants por plan</h2>
            <Barras filas={t.por_plan.map((e) => ({ clave: e.codigo, etiqueta: e.nombre, valor: e.total }))} />
          </div>
        </div>
        <div className="col-lg-4">
          <div className="panel p-4 h-100">
            <h2 className="h6 mb-3">Aplicaciones</h2>
            {!salud ? <p className="small text-secondary mb-0">Consultando cada aplicación…</p> : (
              <>
                <Barras filas={ORDEN_SALUD.filter((k) => conteoSalud[k]).map((k) => ({
                  clave: k, etiqueta: NOMBRE_SALUD[k], valor: conteoSalud[k],
                }))} />
                {problemas.length > 0 && (
                  <ul className="list-unstyled mb-0 mt-3">
                    {problemas.map((x) => (
                      <li key={x.id} className="border-top py-2 d-flex justify-content-between gap-2 align-items-center">
                        <Link to={`/plataforma/tenants/${x.id}`} className="small fw-semibold text-decoration-none">{x.nombre}</Link>
                        <SaludApp salud={salud[x.id]} />
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-lg-6">
          <div className="panel p-4 h-100">
            <div className="d-flex justify-content-between align-items-baseline mb-2">
              <h2 className="h6 mb-0">Operaciones</h2>
              <Link to="/plataforma/operaciones" className="small">Ver todas</Link>
            </div>
            <p className="small text-secondary">
              Últimos 30 días: <b>{ops.total}</b> operaciones, {ops.exitosas} exitosas y {ops.fallidas} fallidas.
            </p>
            {d.en_curso.length === 0 && <p className="small text-secondary mb-0">No hay operaciones en curso.</p>}
            <ul className="list-unstyled mb-0">
              {d.en_curso.map((op) => (
                <li key={op.id} className="border-top py-2">
                  <Link to={`/plataforma/operaciones/${op.id}`} className="d-flex justify-content-between text-decoration-none mb-1">
                    <span>{op.tipo_display} · {op.tenant.nombre}</span>
                    <EstadoOperacion estado={op.estado} />
                  </Link>
                  <Progreso op={op} />
                </li>
              ))}
            </ul>
            {d.ultimas_fallidas.length > 0 && (
              <>
                <h3 className="h6 mt-3 mb-1">Últimas fallidas</h3>
                <ul className="list-unstyled mb-0">
                  {d.ultimas_fallidas.map((op) => (
                    <li key={op.id} className="border-top py-2">
                      <Link to={`/plataforma/operaciones/${op.id}`} className="text-decoration-none">
                        {op.tipo_display} · {op.tenant.nombre}
                      </Link>
                      <div className="small text-secondary text-truncate" title={op.error}>{momento(op.creada_en)} · {op.error || "—"}</div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
        <div className="col-lg-6">
          <div className="panel p-4 h-100">
            <div className="d-flex justify-content-between align-items-baseline mb-2">
              <h2 className="h6 mb-0">Alertas activas</h2>
              <Link to="/plataforma/alertas" className="small">Ver todas</Link>
            </div>
            {d.alertas.length === 0 ? (
              <p className="small text-secondary mb-0"><i className="bi bi-check-circle text-success" /> Sin alertas activas.</p>
            ) : (
              <ul className="list-unstyled mb-0">
                {d.alertas.map((a) => (
                  <li key={a.id} className="border-top py-2">
                    <div className="d-flex justify-content-between gap-2">
                      <span className="small fw-semibold">{a.nombre} · {a.tenant?.nombre || a.identificador || "—"}</span>
                      <Severidad valor={a.severidad} />
                    </div>
                    <div className="small">{a.resumen}</div>
                    <div className="small text-secondary">Detectada {momento(a.detectada_en)}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
