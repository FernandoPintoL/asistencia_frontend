import { useCallback, useEffect, useState } from "react";
import { api } from "../../api";
import Estado from "../../components/Estado";
import Paginacion from "../../components/Paginacion";
import { useFiltros } from "../../filtros";
import { fecha, fechaDia, hora } from "../../formato";
import { useFlash, useManejarError, useTitulo } from "../../sesion";

export default function Asistencias() {
  useTitulo("Asistencias");
  const { flash } = useFlash();
  const manejarError = useManejarError();
  const { form, consulta, setCampo, aplicar, limpiar, irAPagina } = useFiltros(["q", "fecha"]);
  const [d, setD] = useState(null);

  const cargar = useCallback(
    () => api(`/panel/asistencias/?${consulta}`).then(setD).catch(manejarError),
    [consulta, manejarError],
  );
  useEffect(() => {
    cargar();
  }, [cargar]);

  async function corregir(fila, estado) {
    try {
      const r = await api("/panel/asistencias/modificar/", {
        method: "POST", body: { estudiante: fila.estudiante.id, fecha: fila.fecha.id, estado },
      });
      flash("success", r.detail);
    } catch (e) {
      manejarError(e, "warning");
    }
    cargar();
  }

  if (!d) return null;
  return (
    <>
      <h1 className="h3 mb-3">Asistencias <span className="text-secondary fs-6">· {d.modulo.nombre}</span></h1>
      <form className="row g-2 mb-3" onSubmit={aplicar}>
        <div className="col-md-5">
          <input className="form-control" value={form.q} onChange={(e) => setCampo("q", e.target.value)}
                 placeholder="Estudiante: nombre o número de registro" />
        </div>
        <div className="col-md-4">
          <select className="form-select" value={form.fecha} onChange={(e) => setCampo("fecha", e.target.value)}>
            <option value="">Todas las fechas</option>
            {d.fechas.map((f) => <option key={f.id} value={String(f.id)}>{fechaDia(f.fecha)}</option>)}
          </select>
        </div>
        <div className="col-auto">
          <button className="btn btn-primary">Filtrar</button>{" "}
          <button type="button" className="btn btn-link" onClick={limpiar}>Limpiar</button>
        </div>
      </form>
      <div className="row g-3 mb-3">
        <div className="col-4"><div className="panel p-3"><div className="stat text-success">{d.totales.presentes}</div><div className="text-secondary">Presentes</div></div></div>
        <div className="col-4"><div className="panel p-3"><div className="stat" style={{ color: "var(--bad)" }}>{d.totales.faltas}</div><div className="text-secondary">Ausentes</div></div></div>
        <div className="col-4"><div className="panel p-3"><div className="stat" style={{ color: "var(--warn)" }}>{d.totales.pendientes}</div><div className="text-secondary">Pendientes</div></div></div>
      </div>
      <div className="panel table-responsive"><table className="table mb-0 align-middle">
        <thead><tr><th>Fecha</th><th>Estudiante</th><th>Estado</th><th>Hora marca</th><th className="text-end">Corregir</th></tr></thead>
        <tbody>
          {d.results.map((f) => (
            <tr key={`${f.fecha.id}-${f.estudiante.id}`}>
              <td className="text-nowrap">{fecha(f.fecha.fecha)}</td>
              <td>{f.estudiante.nombre} <span className="text-secondary small">{f.estudiante.nro_registro}</span></td>
              <td>
                <Estado estado={f.estado} />
                {f.corregido && <> <i className="bi bi-pencil-square text-secondary" title="Modificado por el administrador" /></>}
              </td>
              <td>{f.hora_marca ? hora(f.hora_marca) : "—"}</td>
              <td className="text-end">
                {f.estado !== "PRESENTE" && <button className="btn btn-sm btn-outline-success" onClick={() => corregir(f, "PRESENTE")}>Presente</button>}{" "}
                {f.estado !== "FALTA" && <button className="btn btn-sm btn-outline-danger" onClick={() => corregir(f, "FALTA")}>Falta</button>}
              </td>
            </tr>
          ))}
          {d.results.length === 0 && <tr><td colSpan={5} className="text-center text-secondary py-4">No hay registros con esos filtros.</td></tr>}
        </tbody>
      </table></div>
      <Paginacion datos={d} onCambiar={irAPagina} />
    </>
  );
}
