import { useEffect, useState } from "react";
import { api } from "../../api";
import Paginacion from "../../components/Paginacion";
import { useFiltros } from "../../filtros";
import { useManejarError, useTitulo } from "../../sesion";

export default function Estudiantes() {
  useTitulo("Estudiantes");
  const manejarError = useManejarError();
  const { activos, form, consulta, setCampo, aplicar, limpiar, irAPagina } = useFiltros(["q"]);
  const [d, setD] = useState(null);

  useEffect(() => {
    api(`/panel/estudiantes/?${consulta}`).then(setD).catch(manejarError);
  }, [consulta, manejarError]);

  if (!d) return null;
  return (
    <>
      <h1 className="h3 mb-3">Estudiantes <span className="text-secondary fs-6">· {d.modulo.nombre} · {d.count}</span></h1>
      <form className="row g-2 mb-3" onSubmit={aplicar}>
        <div className="col-sm-8 col-md-6">
          <input className="form-control" value={form.q} onChange={(e) => setCampo("q", e.target.value)}
                 placeholder="Buscar por nombre o número de registro" />
        </div>
        <div className="col-auto">
          <button className="btn btn-primary">Buscar</button>
          {activos.q && <button type="button" className="btn btn-link" onClick={limpiar}>Limpiar</button>}
        </div>
      </form>
      <div className="panel table-responsive"><table className="table mb-0">
        <thead><tr><th>Registro</th><th>Nombre</th><th>Correo</th></tr></thead>
        <tbody>
          {d.results.map((e) => <tr key={e.id}><td>{e.nro_registro}</td><td>{e.nombre}</td><td>{e.correo}</td></tr>)}
          {d.results.length === 0 && <tr><td colSpan={3} className="text-center text-secondary py-4">Ningún estudiante coincide con la búsqueda.</td></tr>}
        </tbody>
      </table></div>
      <Paginacion datos={d} onCambiar={irAPagina} />
    </>
  );
}
