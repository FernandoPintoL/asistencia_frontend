import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import Estado from "../components/Estado";
import Plantilla from "../components/Plantilla";
import { fechaDia, hora } from "../formato";
import { useFlash, useManejarError, useSesion, useTitulo } from "../sesion";

export default function MiAsistencia() {
  useTitulo("Mi asistencia");
  const { sesion, salir } = useSesion();
  const { flash } = useFlash();
  const manejarError = useManejarError();
  const [datos, setDatos] = useState(null);
  const [marcando, setMarcando] = useState(false);

  const cargar = useCallback(
    () => api("/estudiante/mi-asistencia/").then(setDatos).catch(manejarError),
    [manejarError],
  );
  useEffect(() => {
    cargar();
  }, [cargar]);

  async function marcar() {
    setMarcando(true);
    try {
      const r = await api("/estudiante/marcar/", { method: "POST" });
      flash("success", r.detail);
    } catch (e) {
      manejarError(e);
    }
    await cargar();
    setMarcando(false);
  }

  const barra = (
    <header className="topbar">
      <div className="container contenedor d-flex align-items-center justify-content-between py-2">
        <span className="brand">Control de asistencia</span>
        <div>
          <span className="text-white-50 me-3 small d-none d-sm-inline">{sesion?.nombre}</span>
          <button className="btn btn-sm btn-outline-light" onClick={() => salir()}>Cerrar sesión</button>
        </div>
      </div>
    </header>
  );

  if (!datos) return <Plantilla barra={barra} />;
  const { estudiante: est, clase_hoy, filas } = datos;

  return (
    <Plantilla barra={barra}>
      <div className="panel p-4 mb-4">
        <div className="row align-items-center g-3">
          <div className="col-md-7">
            <h1 className="h3 mb-1">Hola, {est.nombre}</h1>
            <p className="text-secondary mb-0">Registro {est.nro_registro} · {est.modulo}</p>
            <p className="mb-0 mt-2">
              {clase_hoy ? `Hoy hay clase de ${clase_hoy.fecha.inicio} a ${clase_hoy.fecha.fin}.` : "Hoy no hay clase programada."}
            </p>
          </div>
          <div className="col-md-5 text-md-end">
            {datos.puede_marcar ? (
              <button className="btn btn-primary btn-mark" onClick={marcar} disabled={marcando}>
                <i className="bi bi-check2-circle me-2" />Marcar asistencia
              </button>
            ) : (
              <button className="btn btn-secondary btn-mark" disabled>
                {clase_hoy ? "Asistencia ya definida" : "Sin clase hoy"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-6"><div className="panel p-3"><div className="stat text-success">{datos.presentes}</div><div className="text-secondary">Asistencias</div></div></div>
        <div className="col-6"><div className="panel p-3"><div className="stat" style={{ color: "var(--bad)" }}>{datos.faltas}</div><div className="text-secondary">Faltas</div></div></div>
      </div>

      <h2 className="h5 mb-3">Mi historial</h2>
      <div className="panel table-responsive">
        <table className="table mb-0 align-middle">
          <thead><tr><th>Fecha</th><th>Horario</th><th>Estado</th><th>Hora de la marca</th></tr></thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.fecha.id} className={f.es_hoy ? "hoy" : ""}>
                <td>{fechaDia(f.fecha.fecha)}{f.es_hoy && <span className="small text-secondary"> (hoy)</span>}</td>
                <td>{f.fecha.inicio} – {f.fecha.fin}</td>
                <td><Estado estado={f.estado} /></td>
                <td>
                  {f.hora_marca ? hora(f.hora_marca)
                    : f.corregido ? <span className="small text-secondary">Corregido por administración</span> : "—"}
                </td>
              </tr>
            ))}
            {filas.length === 0 && (
              <tr><td colSpan={4} className="text-center text-secondary py-4">No hay fechas de clase cargadas.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Plantilla>
  );
}
