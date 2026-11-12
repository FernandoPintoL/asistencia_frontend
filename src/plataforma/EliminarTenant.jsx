import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useManejarError, useTitulo } from "../sesion";

/** RF-18: mostrar qué recursos y datos se eliminarán y pedir confirmación escrita. */
export default function EliminarTenant() {
  useTitulo("Eliminar tenant");
  const { id } = useParams();
  const navigate = useNavigate();
  const manejarError = useManejarError();
  const [tenant, setTenant] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [confirmacion, setConfirmacion] = useState("");
  const [respaldoFinal, setRespaldoFinal] = useState(true);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    api(`/plataforma/tenants/${id}/`).then(setTenant).catch(manejarError);
    api(`/plataforma/tenants/${id}/eliminacion/`).then(setResumen).catch(manejarError);
  }, [id, manejarError]);

  async function encolar(ruta, body) {
    setEnviando(true);
    try {
      const r = await api(`/plataforma/tenants/${id}/${ruta}/`, { method: "POST", body });
      navigate(`/plataforma/operaciones/${r.operacion.id}`, { state: { flash: { tipo: "warning", texto: r.detail } } });
    } catch (e) {
      manejarError(e);
      setEnviando(false);
    }
  }

  if (!tenant || !resumen) return null;
  const coincide = confirmacion.trim() === resumen.confirmacion;
  return (
    <div className="row justify-content-center"><div className="col-lg-8">
      <Link to={`/plataforma/tenants/${id}`} className="small text-secondary text-decoration-none"><i className="bi bi-arrow-left" /> {tenant.nombre}</Link>
      <h1 className="h3 mb-1 mt-1 text-danger">Eliminar «{tenant.nombre}»</h1>
      <p className="text-secondary mb-4">{resumen.aviso}</p>

      <div className="panel p-4 mb-3 border-danger">
        <h2 className="h6 text-danger"><i className="bi bi-hdd-network" /> Recursos que se eliminarán en AWS</h2>
        <ul className="mb-3">{resumen.recursos.map((r) => <li key={r}>{r}</li>)}</ul>
        <h2 className="h6 text-danger"><i className="bi bi-database-x" /> Datos que se perderán</h2>
        <ul className="mb-3">{resumen.datos.map((d) => <li key={d} className="fw-semibold">{d}</li>)}</ul>
        <h2 className="h6 text-success"><i className="bi bi-shield-check" /> Se conserva</h2>
        <ul className="mb-0">{resumen.se_conserva.map((d) => <li key={d}>{d}</li>)}</ul>
      </div>

      <div className="panel p-4">
        <label className="form-label" htmlFor="confirmar">
          Para confirmar, escribe el identificador <code className="fs-6">{resumen.confirmacion}</code>
        </label>
        <input id="confirmar" className="form-control font-monospace mb-3" autoComplete="off"
               value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} />
        {resumen.respaldo_final && (
          <div className="form-check mb-3">
            <input id="respaldo_final" type="checkbox" className="form-check-input" checked={respaldoFinal}
                   onChange={(e) => setRespaldoFinal(e.target.checked)} />
            <label className="form-check-label" htmlFor="respaldo_final">
              Tomar un respaldo final de la base antes de eliminar (recomendado: permite restaurar si se vuelve a crear)
            </label>
          </div>
        )}
        <div className="d-flex flex-wrap gap-2">
          <button className="btn btn-danger" disabled={!coincide || enviando}
                  onClick={() => encolar("eliminar", { confirmacion, respaldo_final: respaldoFinal })}>
            <i className="bi bi-trash" /> Eliminar definitivamente
          </button>
          <button className="btn btn-outline-secondary" disabled={enviando}
                  onClick={() => encolar("previsualizar", { destruir: true })}
                  title="Ejecuta el motor en modo plan -destroy y lista los recursos exactos, sin borrar nada">
            Ver lista exacta con el motor
          </button>
        </div>
      </div>
    </div></div>
  );
}
