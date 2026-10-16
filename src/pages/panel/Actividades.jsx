import { useEffect, useState } from "react";
import { api } from "../../api";
import Paginacion from "../../components/Paginacion";
import { useFiltros } from "../../filtros";
import { fechaHora } from "../../formato";
import { useManejarError, useTitulo } from "../../sesion";

export default function Actividades() {
  useTitulo("Actividades");
  const manejarError = useManejarError();
  const { form, consulta, setCampo, aplicar, limpiar, irAPagina } = useFiltros(["q", "fecha"]);
  const [d, setD] = useState(null);

  useEffect(() => {
    api(`/panel/actividades/?${consulta}`).then(setD).catch(manejarError);
  }, [consulta, manejarError]);

  if (!d) return null;
  return (
    <>
      <h1 className="h3 mb-3">Historial de actividades <span className="text-secondary fs-6">· {d.modulo.nombre}</span></h1>
      <form className="row g-2 mb-3" onSubmit={aplicar}>
        <div className="col-md-5">
          <input className="form-control" value={form.q} onChange={(e) => setCampo("q", e.target.value)} placeholder="Estudiante o usuario" />
        </div>
        <div className="col-md-3">
          <input type="date" className="form-control" value={form.fecha} onChange={(e) => setCampo("fecha", e.target.value)} />
        </div>
        <div className="col-auto">
          <button className="btn btn-primary">Filtrar</button>{" "}
          <button type="button" className="btn btn-link" onClick={limpiar}>Limpiar</button>
        </div>
      </form>
      <div className="panel table-responsive"><table className="table mb-0">
        <thead><tr><th>Fecha y hora</th><th>Usuario</th><th>Acción</th><th>Registro afectado</th><th>Cambio</th></tr></thead>
        <tbody>
          {d.results.map((a) => (
            <tr key={a.id}>
              <td className="text-nowrap">{fechaHora(a.fecha_hora)}</td>
              <td>{a.usuario}<div className="small text-secondary">{a.rol}</div></td>
              <td>{a.accion}</td>
              <td>{a.registro_afectado || "—"}</td>
              <td className="text-nowrap">
                {a.valor_anterior ? `${a.valor_anterior} → ${a.valor_nuevo}` : a.valor_nuevo || "—"}
              </td>
            </tr>
          ))}
          {d.results.length === 0 && <tr><td colSpan={5} className="text-center text-secondary py-4">No hay actividades con esos filtros.</td></tr>}
        </tbody>
      </table></div>
      <Paginacion datos={d} onCambiar={irAPagina} />
    </>
  );
}
