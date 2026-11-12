import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useConfirmar } from "../components/Confirmar";
import { useFlash, useManejarError, useSesion, useTitulo } from "../sesion";
import { Enlace, EstadoEc2, EstadoOperacion, EstadoTenant, Progreso, Severidad, momento, tamano, useConsultaPeriodica } from "./comun";

// Igual que servicios.PERMITIDAS en el backend (que es quien decide de verdad)
const PERMITE = {
  actualizar: ["ACTIVO", "ERROR"],
  cambiarPlan: ["ACTIVO", "SUSPENDIDO", "ERROR"],
  previsualizar: ["PENDIENTE", "ACTIVO", "SUSPENDIDO", "ERROR"],
  suspender: ["ACTIVO", "ERROR"],
  reanudar: ["SUSPENDIDO", "ERROR"],
  respaldar: ["ACTIVO"],
  restaurar: ["ACTIVO"],
  eliminar: ["PENDIENTE", "ACTIVO", "SUSPENDIDO", "ERROR"],
};

const RESUMEN_AWS = {
  encendidas: "encendidas",
  detenidas: "detenidas",
  en_transicion: "encendiéndose o deteniéndose",
  mixtas: "unas encendidas y otras detenidas",
  faltan: "incompletas (falta alguna)",
};

function Dato({ etiqueta, children }) {
  return (
    <div className="col-sm-6 col-lg-4 mb-3">
      <div className="small text-secondary">{etiqueta}</div>
      <div className="fw-semibold">{children}</div>
    </div>
  );
}

export default function TenantDetalle() {
  const { id } = useParams();
  const { sesion } = useSesion();
  const esAdmin = sesion.rol === "plataforma";
  const navigate = useNavigate();
  const manejarError = useManejarError();
  const { flash } = useFlash();
  const confirmar = useConfirmar();
  const [t, setT] = useState(null);
  const [aws, setAws] = useState(null); // estado real de las instancias en AWS
  const [consultandoAws, setConsultandoAws] = useState(false);
  const [respaldos, setRespaldos] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [version, setVersion] = useState("");
  const [enviando, setEnviando] = useState(false);
  useTitulo(t ? `Tenant · ${t.nombre}` : "Tenant");

  const cargar = useCallback(() => Promise.all([
    api(`/plataforma/tenants/${id}/`).then((d) => { setT(d); setVersion((v) => v || d.app_version); }),
    api(`/plataforma/tenants/${id}/respaldos/`).then(setRespaldos),
    api(`/plataforma/alertas/?tenant=${id}&estado=ACTIVA`).then((d) => setAlertas(d.results)),
  ]).catch(manejarError), [id, manejarError]);
  useEffect(() => {
    cargar();
  }, [cargar]);
  useConsultaPeriodica(cargar, !!t?.operacion_en_curso, 4000);

  // Consulta a AWS aparte (más lenta): al abrir, cuando cambia el estado del tenant y a pedido
  const consultarAws = useCallback(() => {
    setConsultandoAws(true);
    return api(`/plataforma/tenants/${id}/instancias/`)
      .then(setAws)
      .catch((e) => setAws({ error: e.message }))
      .finally(() => setConsultandoAws(false));
  }, [id]);
  const estadoTenant = t?.estado;
  const hayInstancias = !!t?.salidas?.instancias;
  useEffect(() => {
    if (hayInstancias) consultarAws();
  }, [consultarAws, estadoTenant, hayInstancias]);

  async function encolar(ruta, body) {
    setEnviando(true);
    try {
      const r = await api(`/plataforma/tenants/${id}/${ruta}/`, { method: "POST", body });
      navigate(`/plataforma/operaciones/${r.operacion.id}`, { state: { flash: { tipo: "success", texto: r.detail } } });
    } catch (e) {
      manejarError(e);
      setEnviando(false);
    }
  }

  async function suspender() {
    const ok = await confirmar({
      titulo: `¿Suspender «${t.nombre}»?`,
      mensaje: (
        <>
          <p>Primero se toma un respaldo de la base y luego se detienen sus 3 servidores.
            Nadie podrá usar la aplicación hasta reanudarlo.</p>
          <p className="mb-0 text-secondary">Los datos, la configuración y la dirección web se conservan.</p>
        </>
      ),
      boton: "Suspender",
      variante: "warning",
    });
    if (ok) encolar("suspender", {});
  }

  async function reanudar() {
    const ok = await confirmar({
      titulo: `¿Reanudar «${t.nombre}»?`,
      mensaje: <p className="mb-0">Se encenderán sus 3 servidores. La aplicación vuelve a estar disponible en unos minutos.</p>,
      boton: "Reanudar",
      variante: "success",
    });
    if (ok) encolar("reanudar", {});
  }

  async function restaurar(r) {
    const ok = await confirmar({
      titulo: "Restaurar respaldo",
      mensaje: (
        <>
          <p>Se restaurará el respaldo del <b>{momento(r.creado_en)}</b>.</p>
          <p><b>Todos los datos actuales</b> (módulos, estudiantes, asistencias) se reemplazarán por los del
            respaldo. Antes se guardará un respaldo de seguridad de los datos actuales.</p>
          <p className="mb-0 text-secondary">La aplicación estará fuera de servicio unos minutos.</p>
        </>
      ),
      boton: "Restaurar",
      variante: "danger",
      escribir: t.identificador,
    });
    if (ok) encolar("restaurar", { respaldo: r.id, confirmacion: t.identificador });
  }

  async function sincronizar() {
    const detenidas = aws.resumen === "detenidas";
    const ok = await confirmar({
      titulo: "Sincronizar con AWS",
      mensaje: (
        <>
          <p>En AWS sus 3 instancias están <b>{aws.resumen}</b>, pero la plataforma registra
            «{t.estado_display}». Probablemente se {detenidas ? "detuvieron" : "encendieron"} desde la consola de AWS.</p>
          <p className="mb-0">El tenant quedará como <b>«{detenidas ? "Suspendido" : "Activo"}»</b>. Solo cambia el
            registro de la plataforma: no se toca nada en AWS.</p>
        </>
      ),
      boton: "Sincronizar",
    });
    if (!ok) return;
    setEnviando(true);
    try {
      const r = await api(`/plataforma/tenants/${id}/sincronizar/`, { method: "POST", body: {} });
      flash("success", r.detail);
      await cargar();
    } catch (e) {
      manejarError(e);
    }
    setEnviando(false);
  }

  if (!t) return null;
  const libre = !t.operacion_en_curso && !enviando;
  const puede = (accion) => esAdmin && libre && PERMITE[accion].includes(t.estado);
  const s = t.salidas || {};

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-start mb-3 gap-2">
        <div>
          {esAdmin && <Link to="/plataforma" className="small text-secondary text-decoration-none"><i className="bi bi-arrow-left" /> Tenants</Link>}
          <h1 className="h3 mb-1 mt-1">{t.nombre}</h1>
          <div className="d-flex gap-2 align-items-center">
            <span className="font-monospace text-secondary">{t.identificador}</span>
            <EstadoTenant estado={t.estado} />
          </div>
        </div>
        {esAdmin && t.estado !== "ELIMINADO" && (
          <div className="d-flex flex-wrap gap-2">
            {t.suspendido ? (
              <button className="btn btn-success" disabled={!puede("reanudar")} onClick={reanudar}>
                <i className="bi bi-play-fill" /> Reanudar
              </button>
            ) : (
              <button className="btn btn-outline-secondary" disabled={!puede("suspender")} onClick={suspender}>
                <i className="bi bi-pause-fill" /> Suspender
              </button>
            )}
            <Link className={`btn btn-outline-primary ${puede("cambiarPlan") ? "" : "disabled"}`}
                  to={`/plataforma/tenants/${t.id}/cambiar-plan`}>Cambiar plan</Link>
            <button className="btn btn-outline-secondary" disabled={!puede("previsualizar")}
                    onClick={() => encolar("previsualizar", {})}
                    title="Calcula con el motor qué recursos cambiarían, sin aplicar nada">Previsualizar cambios</button>
            <Link className={`btn btn-outline-danger ${puede("eliminar") ? "" : "disabled"}`}
                  to={`/plataforma/tenants/${t.id}/eliminar`}><i className="bi bi-trash" /> Eliminar</Link>
          </div>
        )}
      </div>

      {t.suspendido && t.estado !== "ELIMINADO" && (
        <div className="alert alert-secondary d-flex gap-2 align-items-start">
          <i className="bi bi-pause-circle fs-5" />
          <div>
            <b>Tenant suspendido.</b> Sus 3 servidores están detenidos y la aplicación no responde.
            Se conservan la base de datos, la configuración y la dirección web; solo se paga el
            almacenamiento y la IP. {esAdmin && "Usa «Reanudar» para volver a encenderlo."}
          </div>
        </div>
      )}

      {aws && !aws.error && !aws.coincide && (
        <div className="alert alert-warning d-flex flex-wrap gap-2 align-items-start" role="status">
          <i className="bi bi-exclamation-triangle fs-5" />
          <div className="flex-grow-1">
            <b>El estado en AWS no coincide.</b> La plataforma registra «{t.estado_display}», pero en AWS las
            instancias están <b>{RESUMEN_AWS[aws.resumen] || aws.resumen}</b>.
            {aws.motivo && <div className="small mt-1">{aws.motivo}</div>}
          </div>
          {esAdmin && aws.sincronizable && (
            <button className="btn btn-sm btn-warning" disabled={!libre} onClick={sincronizar}>
              <i className="bi bi-arrow-repeat" /> Sincronizar estado
            </button>
          )}
        </div>
      )}

      {t.operacion_en_curso && (
        <div className="panel p-3 mb-3 border-primary">
          <div className="d-flex justify-content-between mb-2">
            <span className="fw-semibold">{t.operacion_en_curso.tipo_display} en curso</span>
            <Link to={`/plataforma/operaciones/${t.operacion_en_curso.id}`}>Ver progreso</Link>
          </div>
          <Progreso op={t.operacion_en_curso} />
        </div>
      )}

      <div className="row g-3">
        <div className="col-lg-8">
          <div className="panel p-4 mb-3">
            <h2 className="h5 mb-3">Datos</h2>
            <div className="row">
              <Dato etiqueta="Plan">{t.plan.nombre}</Dato>
              <Dato etiqueta="Entorno">{t.entorno_display}</Dato>
              <Dato etiqueta="Motor">{t.motor_display}</Dato>
              <Dato etiqueta="Versión de la app"><span className="font-monospace">{t.app_version}</span></Dato>
              <Dato etiqueta="Disco de la base">{t.disco_db_gb ? `${t.disco_db_gb} GB` : "—"}</Dato>
              <Dato etiqueta="Prefijo de recursos"><span className="font-monospace small">{t.prefijo_recursos}</span></Dato>
              <Dato etiqueta="Contacto">{t.contacto_nombre || "—"}<div className="small fw-normal">{t.contacto_email}</div></Dato>
              <Dato etiqueta="Administradores del tenant">{t.administradores.join(", ") || "—"}</Dato>
              <Dato etiqueta="Creado">{momento(t.creado_en)}</Dato>
            </div>
          </div>

          <div className="panel p-4">
            <h2 className="h5 mb-3">Servicios</h2>
            {s.url_frontend ? (
              <>
                <div className="row">
                  <Dato etiqueta="Aplicación (estudiantes)"><Enlace url={s.url_frontend} /></Dato>
                  <Dato etiqueta="Panel del administrador"><Enlace url={s.url_panel_admin} /></Dato>
                  <Dato etiqueta="API"><Enlace url={s.url_api} /></Dato>
                </div>
                {s.instancias && (
                  <>
                    <div className="d-flex justify-content-between align-items-baseline mt-2">
                      <h3 className="h6 mb-0">Servidores</h3>
                      <button className="btn btn-sm btn-link text-decoration-none p-0" onClick={consultarAws}
                              disabled={consultandoAws} title="Volver a consultar el estado en AWS">
                        <i className={`bi bi-arrow-clockwise d-inline-block ${consultandoAws ? "girando" : ""}`} /> Consultar AWS
                      </button>
                    </div>
                    <div className="table-responsive"><table className="table table-sm mb-0 mt-1 align-middle">
                      <thead><tr><th>Servicio</th><th>Instancia EC2</th><th>Tipo</th><th>IP privada</th><th>Estado en AWS</th></tr></thead>
                      <tbody>
                        {["frontend", "backend", "db"].map((k) => {
                          const real = aws?.instancias?.find((i) => i.servicio === k);
                          return (
                            <tr key={k}>
                              <td>{k === "db" ? "Base de datos" : k[0].toUpperCase() + k.slice(1)}</td>
                              <td className="font-monospace small text-nowrap">{s.instancias[k]}</td>
                              <td className="font-monospace small">{real?.tipo || "—"}</td>
                              <td className="font-monospace small">{s.ips_privadas?.[k]}</td>
                              <td>
                                {real ? <EstadoEc2 estado={real.estado} />
                                  : <span className="text-secondary small">{consultandoAws ? "Consultando…" : "—"}</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table></div>
                    {aws?.error && (
                      <div className="small text-danger mt-2">
                        <i className="bi bi-exclamation-circle" /> No se pudo consultar AWS: {aws.error}
                      </div>
                    )}
                  </>
                )}
                {esAdmin && s.leer_admin_password && (
                  <details className="mt-3 small">
                    <summary>Contraseña inicial del administrador del tenant</summary>
                    <p className="mt-2 mb-1 text-secondary">No se muestra aquí: se guarda cifrada en AWS SSM. Para leerla:</p>
                    <code className="d-block p-2 bg-light rounded text-break">{s.leer_admin_password}</code>
                  </details>
                )}
              </>
            ) : (
              <p className="text-secondary mb-0">Aún no hay servicios desplegados.</p>
            )}
          </div>
        </div>

        <div className="col-lg-4">
          {esAdmin && t.estado !== "ELIMINADO" && (
            <div className="panel p-4 mb-3">
              <h2 className="h5 mb-2">Actualizar</h2>
              <p className="small text-secondary">Vuelve a aplicar la infraestructura. Si cambias la versión, se despliega en los mismos servidores (sin recrearlos): primero el backend con sus migraciones y después el frontend.</p>
              <label className="form-label small fw-semibold" htmlFor="t_version">Versión de la app (rama o tag)</label>
              <div className="input-group">
                <input id="t_version" className="form-control font-monospace" value={version} onChange={(e) => setVersion(e.target.value)} />
                <button className="btn btn-primary" disabled={!puede("actualizar") || !version.trim()}
                        onClick={() => encolar("actualizar", { app_version: version.trim() })}>Actualizar</button>
              </div>
            </div>
          )}

          <div className="panel p-4 mb-3">
            <div className="d-flex justify-content-between align-items-baseline mb-2">
              <h2 className="h5 mb-0">Monitoreo</h2>
              {t.grafana && (
                <a href={t.grafana} target="_blank" rel="noreferrer" className="small">
                  Ver en Grafana <i className="bi bi-box-arrow-up-right" />
                </a>
              )}
            </div>
            {alertas.length === 0 ? (
              <p className="small text-secondary mb-0"><i className="bi bi-check-circle text-success" /> Sin alertas activas.</p>
            ) : (
              <ul className="list-unstyled mb-0">
                {alertas.map((a) => (
                  <li key={a.id} className="border-top py-2">
                    <div className="d-flex justify-content-between gap-2">
                      <span className="fw-semibold small">{a.nombre}</span>
                      <Severidad valor={a.severidad} />
                    </div>
                    <div className="small">{a.resumen}</div>
                    <div className="small text-secondary">Detectada {momento(a.detectada_en)}</div>
                  </li>
                ))}
              </ul>
            )}
            <Link to={`/plataforma/alertas?tenant=${t.id}`} className="small d-inline-block mt-2">Historial de alertas</Link>
          </div>

          <div className="panel p-4 mb-3">
            <div className="d-flex justify-content-between align-items-baseline mb-1">
              <h2 className="h5 mb-0">Respaldos</h2>
              {esAdmin && t.estado !== "ELIMINADO" && (
                <button className="btn btn-sm btn-outline-primary" disabled={!puede("respaldar")}
                        onClick={() => encolar("respaldos", {})}>
                  <i className="bi bi-cloud-arrow-up" /> Respaldar ahora
                </button>
              )}
            </div>
            <p className="small text-secondary">Copias de la base de datos. Se guardan según la retención del plan.</p>
            <ul className="list-unstyled mb-0">
              {respaldos.map((r) => (
                <li key={r.id} className="border-top py-2">
                  <div className="d-flex justify-content-between align-items-center gap-2">
                    <div>
                      <div className="fw-semibold small">{momento(r.creado_en)}</div>
                      <div className="small text-secondary">
                        {r.motivo_display} · {tamano(r.tamano_bytes)}
                        {!r.de_esta_instalacion && " · de una instalación anterior"}
                      </div>
                      <div className="small text-secondary">Se borra el {momento(r.expira_en).slice(0, 10)}</div>
                    </div>
                    {esAdmin && (
                      <button className="btn btn-sm btn-outline-warning" disabled={!puede("restaurar")}
                              onClick={() => restaurar(r)} title="Reemplaza los datos actuales por los de este respaldo">
                        Restaurar
                      </button>
                    )}
                  </div>
                </li>
              ))}
              {respaldos.length === 0 && <li className="text-secondary small">Aún no hay respaldos.</li>}
            </ul>
          </div>

          <div className="panel p-4">
            <div className="d-flex justify-content-between align-items-baseline mb-2">
              <h2 className="h5 mb-0">Operaciones</h2>
              {esAdmin && <Link to={`/plataforma/operaciones?tenant=${t.id}`} className="small">Ver todas</Link>}
            </div>
            <ul className="list-unstyled mb-0">
              {t.operaciones.map((op) => (
                <li key={op.id} className="border-top py-2">
                  <Link to={`/plataforma/operaciones/${op.id}`} className="d-flex justify-content-between text-decoration-none">
                    <span>{op.tipo_display}</span>
                    <EstadoOperacion estado={op.estado} />
                  </Link>
                  <div className="small text-secondary">{momento(op.creada_en)} · {op.solicitada_por_nombre}</div>
                </li>
              ))}
              {t.operaciones.length === 0 && <li className="text-secondary small">Sin operaciones.</li>}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
