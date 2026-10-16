import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { fecha } from "../../formato";
import { useFlash, useManejarError, useTitulo } from "../../sesion";

export default function Modulos() {
  useTitulo("Módulos");
  const { flash } = useFlash();
  const manejarError = useManejarError();
  const [lista, setLista] = useState(null);

  const cargar = useCallback(() => api("/panel/modulos/").then(setLista).catch(manejarError), [manejarError]);
  useEffect(() => {
    cargar();
  }, [cargar]);

  async function accion(m, tipo, tipoAviso, body) {
    try {
      const r = await api(`/panel/modulos/${m.id}/${tipo}/`, { method: "POST", body });
      flash(tipoAviso, r.detail);
    } catch (e) {
      manejarError(e);
    }
    cargar();
  }

  function deshabilitar(m) {
    if (window.confirm(`Se deshabilitará «${m.nombre}». Ningún estudiante podrá ingresar hasta habilitar un módulo. Los datos se conservan. ¿Continuar?`)) {
      accion(m, "deshabilitar", "warning");
    }
  }

  function habilitar(m) {
    if (window.confirm(`Se habilitará «${m.nombre}». El módulo activo actual quedará deshabilitado. ¿Continuar?`)) {
      accion(m, "habilitar", "success");
    }
  }

  function eliminar(m) {
    const t = window.prompt(
      "ELIMINAR DEFINITIVAMENTE. Se borrarán estudiantes, fechas, asistencias y actividades de este módulo. " +
      `No se puede deshacer.\n\nEscribe el nombre exacto para confirmar:\n${m.nombre}`,
    );
    if (t !== null) accion(m, "eliminar", "success", { confirmacion: t });
  }

  if (!lista) return null;
  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-end mb-3 gap-2">
        <div>
          <h1 className="h3 mb-1">Módulos</h1>
          <p className="text-secondary mb-0">Solo un módulo puede estar habilitado a la vez. Habilitar y deshabilitar no borra datos; Eliminar sí, y es definitivo.</p>
        </div>
        <Link className="btn btn-primary" to="/panel/nuevo-modulo">Importar un nuevo módulo</Link>
      </div>
      <div className="panel table-responsive"><table className="table mb-0 align-middle">
        <thead><tr><th>Módulo</th><th>Creado</th><th>Estudiantes</th><th>Fechas</th><th>Marcas</th><th>Estado</th><th className="text-end">Acción</th></tr></thead>
        <tbody>
          {lista.map((m) => (
            <tr key={m.id} className={m.activo ? "hoy" : ""}>
              <td className="fw-semibold">{m.nombre}</td>
              <td className="text-nowrap">{fecha(m.creado_en)}</td>
              <td>{m.n_estudiantes}</td><td>{m.n_fechas}</td><td>{m.n_asistencias}</td>
              <td>
                {m.activo ? <span className="badge-estado e-PRESENTE">Habilitado</span>
                  : <span className="badge-estado e-PROGRAMADA">Deshabilitado</span>}
              </td>
              <td className="text-end">
                {m.activo ? (
                  <button className="btn btn-sm btn-outline-danger" onClick={() => deshabilitar(m)}>Deshabilitar</button>
                ) : (
                  <>
                    <button className="btn btn-sm btn-outline-success" onClick={() => habilitar(m)}>Habilitar</button>{" "}
                    <button className="btn btn-sm btn-danger" onClick={() => eliminar(m)}><i className="bi bi-trash" /> Eliminar</button>
                  </>
                )}
              </td>
            </tr>
          ))}
          {lista.length === 0 && (
            <tr><td colSpan={7} className="text-center text-secondary py-4">Aún no hay módulos. Importa estudiantes y fechas para crear el primero.</td></tr>
          )}
        </tbody>
      </table></div>
    </>
  );
}
