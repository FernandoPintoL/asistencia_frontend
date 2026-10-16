import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { fecha, fechaHoraCorta } from "../../formato";
import { useManejarError, useTitulo } from "../../sesion";

async function descargarExcel(manejarError) {
  try {
    const resp = await api("/panel/exportar/", { descarga: true });
    const nombre = /filename="(.+)"/.exec(resp.headers.get("Content-Disposition") || "")?.[1] || "asistencias.xlsx";
    const url = URL.createObjectURL(await resp.blob());
    const a = Object.assign(document.createElement("a"), { href: url, download: nombre });
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    manejarError(e);
  }
}

export default function Dashboard() {
  useTitulo("Resumen");
  const manejarError = useManejarError();
  const [d, setD] = useState(null);

  useEffect(() => {
    api("/panel/resumen/").then(setD).catch(manejarError);
  }, [manejarError]);

  if (!d) return null;
  if (!d.modulo) {
    return (
      <div className="panel p-5 text-center">
        <h1 className="h3">Todavía no hay un módulo activo</h1>
        <p className="text-secondary">Sube el Excel de estudiantes y el de fechas para empezar.</p>
        <Link className="btn btn-primary" to="/panel/nuevo-modulo">Importar estudiantes y fechas</Link>
      </div>
    );
  }

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-end mb-4 gap-2">
        <div><p className="text-secondary mb-0">Módulo activo</p><h1 className="h2 mb-0">{d.modulo.nombre}</h1></div>
        <button className="btn btn-outline-primary" onClick={() => descargarExcel(manejarError)}>
          <i className="bi bi-file-earmark-excel me-1" />Exportar asistencias a Excel
        </button>
      </div>
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3"><div className="panel p-3"><div className="stat">{d.total_estudiantes}</div><div className="text-secondary">Estudiantes</div></div></div>
        <div className="col-6 col-md-3"><div className="panel p-3"><div className="stat">{d.total_fechas}</div><div className="text-secondary">Fechas de clase</div></div></div>
        <div className="col-6 col-md-3"><div className="panel p-3"><div className="stat">{d.hay_clase_hoy ? `${d.presentes_hoy}/${d.total_estudiantes}` : "—"}</div><div className="text-secondary">Presentes hoy</div></div></div>
        <div className="col-6 col-md-3"><div className="panel p-3"><div className="stat" style={{ fontSize: "1.4rem" }}>{d.proxima ? fecha(d.proxima) : "—"}</div><div className="text-secondary">Próxima clase</div></div></div>
      </div>
      <h2 className="h5 mb-3">Últimas actividades</h2>
      <div className="panel table-responsive"><table className="table mb-0">
        <thead><tr><th>Cuándo</th><th>Usuario</th><th>Acción</th><th>Registro</th></tr></thead>
        <tbody>
          {d.ultimas.map((a) => (
            <tr key={a.id}><td className="text-nowrap">{fechaHoraCorta(a.fecha_hora)}</td><td>{a.usuario}</td><td>{a.accion}</td><td>{a.registro_afectado}</td></tr>
          ))}
          {d.ultimas.length === 0 && <tr><td colSpan={4} className="text-center text-secondary py-4">Aún no hay actividad.</td></tr>}
        </tbody>
      </table></div>
    </>
  );
}
