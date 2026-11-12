import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import { useFlash, useManejarError, useTitulo } from "../sesion";
import { Campo, erroresDeCampos } from "./comun";

const NUEVO = {
  codigo: "", nombre: "", descripcion: "", orden: 10, tipo_frontend: "t3.micro", tipo_backend: "t3.micro",
  tipo_db: "t3.micro", disco_db_gb: 10, max_estudiantes: 100, max_modulos: 2, retencion_respaldos_dias: 7,
  precio_mensual_usd: "0", activo: true,
};

const CAMPOS_NUMERO = ["orden", "disco_db_gb", "max_estudiantes", "max_modulos", "retencion_respaldos_dias"];

/** RF-01, RF-02, RF-04: catálogo de planes, sus recursos y límites; el administrador los edita. */
export default function Planes() {
  useTitulo("Planes");
  const { flash } = useFlash();
  const manejarError = useManejarError();
  const [planes, setPlanes] = useState(null);
  const [editando, setEditando] = useState(null); // null | plan (con id) | NUEVO
  const [errores, setErrores] = useState({});

  const cargar = useCallback(() => api("/plataforma/planes/").then(setPlanes).catch(manejarError), [manejarError]);
  useEffect(() => {
    cargar();
  }, [cargar]);

  const set = (campo) => (e) => {
    const v = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setEditando((p) => ({ ...p, [campo]: CAMPOS_NUMERO.includes(campo) && v !== "" ? Number(v) : v }));
  };

  async function guardar(e) {
    e.preventDefault();
    setErrores({});
    const { id, actualizado_en, tenants_activos, ...datos } = editando; // eslint-disable-line no-unused-vars
    try {
      const r = id
        ? await api(`/plataforma/planes/${id}/`, { method: "PATCH", body: datos })
        : await api("/plataforma/planes/", { method: "POST", body: datos });
      flash("success", `Plan «${r.nombre}» guardado.${r.aviso ? ` ${r.aviso}` : ""}`);
      setEditando(null);
      cargar();
    } catch (err) {
      const campos = erroresDeCampos(err);
      if (Object.keys(campos).length) setErrores(campos);
      else manejarError(err);
    }
  }

  const entrada = (campo, tipo = "text", extra = {}) => (
    <input id={`pl_${campo}`} type={tipo} className={`form-control ${errores[campo] ? "is-invalid" : ""}`}
           value={editando[campo] ?? ""} onChange={set(campo)} required={extra.required ?? true} {...extra} />
  );

  if (!planes) return null;
  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-end mb-3 gap-2">
        <div>
          <h1 className="h3 mb-1">Planes</h1>
          <p className="text-secondary mb-0">Recursos y límites de cada plan. Los tenants toman los cambios en su próxima actualización.</p>
        </div>
        {!editando && <button className="btn btn-primary" onClick={() => { setErrores({}); setEditando(NUEVO); }}><i className="bi bi-plus-lg" /> Nuevo plan</button>}
      </div>

      {editando && (
        <form className="panel p-4 mb-3" onSubmit={guardar}>
          <h2 className="h5 mb-3">{editando.id ? `Editar «${editando.nombre}»` : "Nuevo plan"}</h2>
          <div className="row">
            <div className="col-md-3"><Campo id="pl_codigo" etiqueta="Código" error={errores.codigo} ayuda={editando.id ? "No se puede cambiar." : "Minúsculas y guiones."}>
              {entrada("codigo", "text", { disabled: !!editando.id, pattern: "[a-z][a-z0-9\\-]{1,29}" })}</Campo></div>
            <div className="col-md-3"><Campo id="pl_nombre" etiqueta="Nombre" error={errores.nombre}>{entrada("nombre")}</Campo></div>
            <div className="col-md-4"><Campo id="pl_descripcion" etiqueta="Descripción" error={errores.descripcion}>{entrada("descripcion", "text", { required: false })}</Campo></div>
            <div className="col-md-2"><Campo id="pl_orden" etiqueta="Orden" error={errores.orden}>{entrada("orden", "number", { min: 0 })}</Campo></div>
          </div>
          <h3 className="h6 text-secondary mt-2">Cómputo (tipo de instancia EC2 de cada servicio)</h3>
          <div className="row">
            <div className="col-md-4"><Campo id="pl_tipo_frontend" etiqueta="Frontend" error={errores.tipo_frontend}>{entrada("tipo_frontend")}</Campo></div>
            <div className="col-md-4"><Campo id="pl_tipo_backend" etiqueta="Backend" error={errores.tipo_backend}>{entrada("tipo_backend")}</Campo></div>
            <div className="col-md-4"><Campo id="pl_tipo_db" etiqueta="Base de datos" error={errores.tipo_db}>{entrada("tipo_db")}</Campo></div>
          </div>
          <h3 className="h6 text-secondary mt-2">Almacenamiento, límites y precio</h3>
          <div className="row">
            <div className="col-md-3"><Campo id="pl_retencion_respaldos_dias" etiqueta="Retención de respaldos (días)" error={errores.retencion_respaldos_dias} ayuda="Cuánto tiempo se guarda cada respaldo de la base.">{entrada("retencion_respaldos_dias", "number", { min: 1, max: 365 })}</Campo></div>
          </div>
          <div className="row">
            <div className="col-md-3"><Campo id="pl_disco_db_gb" etiqueta="Disco de la base (GB)" error={errores.disco_db_gb}>{entrada("disco_db_gb", "number", { min: 8, max: 1000 })}</Campo></div>
            <div className="col-md-3"><Campo id="pl_max_estudiantes" etiqueta="Máx. estudiantes por módulo" error={errores.max_estudiantes}>{entrada("max_estudiantes", "number", { min: 1 })}</Campo></div>
            <div className="col-md-3"><Campo id="pl_max_modulos" etiqueta="Máx. módulos" error={errores.max_modulos}>{entrada("max_modulos", "number", { min: 1 })}</Campo></div>
            <div className="col-md-3"><Campo id="pl_precio_mensual_usd" etiqueta="Precio mensual (US$)" error={errores.precio_mensual_usd}>{entrada("precio_mensual_usd", "number", { min: 0, step: "0.01" })}</Campo></div>
          </div>
          <div className="form-check mb-3">
            <input id="pl_activo" type="checkbox" className="form-check-input" checked={!!editando.activo} onChange={set("activo")} />
            <label className="form-check-label" htmlFor="pl_activo">Activo (se ofrece a tenants nuevos)</label>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-primary">Guardar</button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => setEditando(null)}>Cancelar</button>
          </div>
        </form>
      )}

      <div className="panel table-responsive"><table className="table mb-0 align-middle">
        <thead><tr><th>Plan</th><th>Frontend / Backend / Base</th><th>Disco base</th><th>Estudiantes</th><th>Módulos</th><th>Respaldos</th><th>Precio</th><th>Tenants</th><th /></tr></thead>
        <tbody>
          {planes.map((p) => (
            <tr key={p.id} className={p.activo ? "" : "text-secondary"}>
              <td><span className="fw-semibold">{p.nombre}</span> {!p.activo && <span className="badge-estado e-PROGRAMADA">Inactivo</span>}
                <div className="small text-secondary font-monospace">{p.codigo}</div></td>
              <td className="font-monospace small">{p.tipo_frontend} / {p.tipo_backend} / {p.tipo_db}</td>
              <td>{p.disco_db_gb} GB</td>
              <td>{p.max_estudiantes}</td>
              <td>{p.max_modulos}</td>
              <td>{p.retencion_respaldos_dias} días</td>
              <td>US$ {p.precio_mensual_usd}</td>
              <td>{p.tenants_activos}</td>
              <td className="text-end"><button className="btn btn-sm btn-outline-primary" onClick={() => { setErrores({}); setEditando(p); }}>Editar</button></td>
            </tr>
          ))}
        </tbody>
      </table></div>
    </>
  );
}
