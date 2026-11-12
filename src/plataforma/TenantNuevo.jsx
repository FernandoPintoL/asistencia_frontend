import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useManejarError, useTitulo } from "../sesion";
import { Campo, ENTORNOS, erroresDeCampos } from "./comun";

const VACIO = {
  nombre: "", identificador: "", contacto_nombre: "", contacto_email: "", contacto_telefono: "",
  entorno: "dev", plan: "", motor: "terraform", app_version: "main",
};

/** "Colegio San José" → "colegio-san-jose" (sugerencia; el usuario puede cambiarlo). */
function sugerirIdentificador(nombre) {
  return nombre.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 20).replace(/-+$/, "");
}

/** Tarjeta de un plan con sus características (RF-03). */
export function TarjetaPlan({ plan, elegido, onElegir, deshabilitado = false }) {
  return (
    <button type="button" disabled={deshabilitado} onClick={() => onElegir(plan.codigo)}
            className={`plan-tarjeta panel p-3 h-100 w-100 text-start d-flex flex-column ${elegido ? "elegido" : ""}`}
            aria-pressed={elegido}>
      <div className="d-flex flex-wrap justify-content-between align-items-baseline column-gap-2">
        <span className="h5 mb-0">{plan.nombre}</span>
        <span className="fw-semibold text-nowrap">US$ {Number(plan.precio_mensual_usd).toFixed(0)}<span className="small text-secondary">/mes</span></span>
      </div>
      {plan.descripcion && <p className="small text-secondary mt-1 mb-2">{plan.descripcion}</p>}
      <ul className="list-unstyled small mb-0 plan-lista">
        <li><i className="bi bi-people" /> Hasta <b>{plan.max_estudiantes}</b> estudiantes por módulo</li>
        <li><i className="bi bi-collection" /> Hasta <b>{plan.max_modulos}</b> módulos guardados</li>
        <li><i className="bi bi-hdd" /> Base de datos de <b>{plan.disco_db_gb} GB</b></li>
        <li><i className="bi bi-clock-history" /> Respaldos guardados <b>{plan.retencion_respaldos_dias} días</b></li>
        <li><i className="bi bi-cpu" /> Backend {plan.tipo_backend} · Base {plan.tipo_db} · Web {plan.tipo_frontend}</li>
      </ul>
    </button>
  );
}

/** RF-07 / RF-08: crear un tenant eligiendo plan, entorno y motor. */
export default function TenantNuevo() {
  useTitulo("Nuevo tenant");
  const navigate = useNavigate();
  const manejarError = useManejarError();
  const [form, setForm] = useState(VACIO);
  const [idEditado, setIdEditado] = useState(false);
  const [planes, setPlanes] = useState([]);
  const [motores, setMotores] = useState([]);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    api("/plataforma/planes/?activos=1").then((p) => {
      setPlanes(p);
      setForm((f) => ({ ...f, plan: f.plan || p[0]?.codigo || "" }));
    }).catch(manejarError);
    api("/plataforma/motores/").then(setMotores).catch(manejarError);
  }, [manejarError]);

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  function cambiarNombre(e) {
    const nombre = e.target.value;
    setForm((f) => ({ ...f, nombre, identificador: idEditado ? f.identificador : sugerirIdentificador(nombre) }));
  }

  async function enviar(e) {
    e.preventDefault();
    setEnviando(true);
    setErrores({});
    try {
      const r = await api("/plataforma/tenants/", { method: "POST", body: form });
      navigate(`/plataforma/operaciones/${r.operacion.id}`, { state: { flash: { tipo: "success", texto: r.detail } } });
    } catch (err) {
      const campos = erroresDeCampos(err);
      if (Object.keys(campos).length) setErrores(campos);
      else manejarError(err);
      setEnviando(false);
    }
  }

  const invalido = (c) => `form-control ${errores[c] ? "is-invalid" : ""}`;

  return (
    <>
      <h1 className="h3 mb-1">Nuevo tenant</h1>
      <p className="text-secondary mb-4">Se crearán 3 servidores en AWS (frontend, backend y base de datos) solo para esta institución. Tarda de 5 a 10 minutos.</p>
      <form onSubmit={enviar}>
        <div className="row g-4">
          <div className="col-lg-5">
            <div className="panel p-4">
              <h2 className="h5 mb-3">Institución</h2>
              <Campo id="t_nombre" etiqueta="Nombre" error={errores.nombre}>
                <input id="t_nombre" className={invalido("nombre")} required maxLength={80} value={form.nombre} onChange={cambiarNombre} />
              </Campo>
              <Campo id="t_id" etiqueta="Identificador único" error={errores.identificador}
                     ayuda="Minúsculas, números y guiones (3 a 20). Se usa en los nombres de los recursos de AWS.">
                <input id="t_id" className={`${invalido("identificador")} font-monospace`} required maxLength={20}
                       pattern="[a-z][a-z0-9\-]{1,18}[a-z0-9]" value={form.identificador}
                       onChange={(e) => { setIdEditado(true); set("identificador")(e); }} />
              </Campo>
              <h2 className="h5 mt-4 mb-3">Contacto</h2>
              <Campo id="t_cn" etiqueta="Nombre del contacto" error={errores.contacto_nombre}>
                <input id="t_cn" className={invalido("contacto_nombre")} value={form.contacto_nombre} onChange={set("contacto_nombre")} />
              </Campo>
              <Campo id="t_ce" etiqueta="Correo" error={errores.contacto_email} ayuda="También será el correo del administrador del tenant.">
                <input id="t_ce" type="email" className={invalido("contacto_email")} required value={form.contacto_email} onChange={set("contacto_email")} />
              </Campo>
              <Campo id="t_ct" etiqueta="Teléfono" error={errores.contacto_telefono}>
                <input id="t_ct" className={invalido("contacto_telefono")} value={form.contacto_telefono} onChange={set("contacto_telefono")} />
              </Campo>
            </div>
          </div>

          <div className="col-lg-7">
            <div className="panel p-4 mb-4">
              <h2 className="h5 mb-3">Plan</h2>
              {errores.plan && <div className="alert alert-danger py-2">{errores.plan}</div>}
              <div className="row g-3">
                {planes.map((p) => (
                  <div key={p.id} className="col-md-6 col-xl-4">
                    <TarjetaPlan plan={p} elegido={form.plan === p.codigo} onElegir={(c) => setForm((f) => ({ ...f, plan: c }))} />
                  </div>
                ))}
              </div>
            </div>
            <div className="panel p-4">
              <h2 className="h5 mb-3">Despliegue</h2>
              <div className="row">
                <div className="col-md-4">
                  <Campo id="t_ent" etiqueta="Entorno" error={errores.entorno}>
                    <select id="t_ent" className="form-select" value={form.entorno} onChange={set("entorno")}>
                      {Object.entries(ENTORNOS).map(([k, t]) => <option key={k} value={k}>{t}</option>)}
                    </select>
                  </Campo>
                </div>
                <div className="col-md-4">
                  <Campo id="t_motor" etiqueta="Motor" error={errores.motor} ayuda="Herramienta que crea los recursos.">
                    <select id="t_motor" className="form-select" value={form.motor} onChange={set("motor")}>
                      {motores.map((m) => (
                        <option key={m.codigo} value={m.codigo} disabled={!m.disponible}>
                          {m.nombre}{m.disponible ? "" : " (próximamente)"}
                        </option>
                      ))}
                    </select>
                  </Campo>
                </div>
                <div className="col-md-4">
                  <Campo id="t_ver" etiqueta="Versión de la app" error={errores.app_version} ayuda="Rama o tag de git.">
                    <input id="t_ver" className={`${invalido("app_version")} font-monospace`} required value={form.app_version} onChange={set("app_version")} />
                  </Campo>
                </div>
              </div>
              <button className="btn btn-primary btn-lg w-100 mt-2" disabled={enviando || !form.plan}>
                {enviando ? "Registrando…" : "Crear tenant y desplegar"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
