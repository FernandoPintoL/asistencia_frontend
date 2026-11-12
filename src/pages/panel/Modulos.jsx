import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { fecha } from "../../formato";
import { useConfirmar } from "../../components/Confirmar";
import { useFlash, useManejarError, useTitulo } from "../../sesion";

export default function Modulos() {
  useTitulo("Módulos");
  const { flash } = useFlash();
  const confirmar = useConfirmar();
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

  async function deshabilitar(m) {
    const ok = await confirmar({
      titulo: `¿Deshabilitar «${m.nombre}»?`,
      mensaje: <p className="mb-0">Ningún estudiante podrá ingresar hasta que habilites un módulo. Los datos se conservan.</p>,
      boton: "Deshabilitar",
      variante: "warning",
    });
    if (ok) accion(m, "deshabilitar", "warning");
  }

  async function habilitar(m) {
    const ok = await confirmar({
      titulo: `¿Habilitar «${m.nombre}»?`,
      mensaje: <p className="mb-0">El módulo activo actual quedará deshabilitado (sus datos se conservan).</p>,
      boton: "Habilitar",
      variante: "success",
    });
    if (ok) accion(m, "habilitar", "success");
  }

  async function eliminar(m) {
    const ok = await confirmar({
      titulo: "Eliminar módulo definitivamente",
      mensaje: (
        <>
          <p>Se borrarán los estudiantes, fechas, asistencias y actividades de <b>{m.nombre}</b>.</p>
          <p className="mb-0 text-danger fw-semibold">No se puede deshacer.</p>
        </>
      ),
      boton: "Eliminar",
      variante: "danger",
      escribir: m.nombre,
    });
    if (ok) accion(m, "eliminar", "success", { confirmacion: m.nombre });
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
