import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useManejarError, useTitulo } from "../sesion";
import { TarjetaPlan } from "./TenantNuevo";

/** RF-06: elegir otro plan, ver qué recursos se modificarán y confirmar. */
export default function CambiarPlan() {
  useTitulo("Cambiar plan");
  const { id } = useParams();
  const navigate = useNavigate();
  const manejarError = useManejarError();
  const [tenant, setTenant] = useState(null);
  const [planes, setPlanes] = useState([]);
  const [elegido, setElegido] = useState("");
  const [diferencias, setDiferencias] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    api(`/plataforma/tenants/${id}/`).then(setTenant).catch(manejarError);
    api("/plataforma/planes/?activos=1").then(setPlanes).catch(manejarError);
  }, [id, manejarError]);

  useEffect(() => {
    setDiferencias(null);
    if (!elegido) return;
    api(`/plataforma/tenants/${id}/cambio-plan/?plan=${encodeURIComponent(elegido)}`)
      .then(setDiferencias).catch(manejarError);
  }, [elegido, id, manejarError]);

  async function encolar(ruta, body) {
    setEnviando(true);
    try {
      const r = await api(`/plataforma/tenants/${id}/${ruta}/`, { method: "POST", body });
      navigate(`/plataforma/operaciones/${r.operacion.id}`, { state: { flash: { tipo: "success", texto: r.detail } } });
    } catch (e) {
      manejarError(e);
      setEnviando(false);
    }
  }

  if (!tenant) return null;
  return (
    <>
      <Link to={`/plataforma/tenants/${id}`} className="small text-secondary text-decoration-none"><i className="bi bi-arrow-left" /> {tenant.nombre}</Link>
      <h1 className="h3 mb-1 mt-1">Cambiar plan</h1>
      <p className="text-secondary mb-4">Plan actual: <b>{tenant.plan.nombre}</b>. Elige el nuevo plan para ver qué cambiará antes de confirmar.</p>

      <div className="row g-3 mb-4">
        {planes.map((p) => (
          <div key={p.id} className="col-md-6 col-lg-4">
            <TarjetaPlan plan={p} elegido={elegido === p.codigo} onElegir={setElegido}
                         deshabilitado={p.codigo === tenant.plan.codigo} />
            {p.codigo === tenant.plan.codigo && <div className="small text-secondary text-center mt-1">Plan actual</div>}
          </div>
        ))}
      </div>

      {diferencias && (
        <div className="panel p-4">
          <h2 className="h5 mb-3">Qué cambiará</h2>
          {diferencias.cambios.length === 0 ? (
            <p className="text-secondary">Los recursos de ambos planes son iguales.</p>
          ) : (
            <div className="table-responsive"><table className="table align-middle">
              <thead><tr><th>Recurso</th><th>Actual</th><th>Nuevo</th><th>Efecto</th></tr></thead>
              <tbody>
                {diferencias.cambios.map((c) => (
                  <tr key={c.recurso}>
                    <td className="fw-semibold">{c.recurso}</td>
                    <td className="font-monospace small">{c.actual}</td>
                    <td className="font-monospace small">{c.nuevo}</td>
                    <td className="small">{c.efecto}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
          <p className="small mb-3">
            Precio mensual estimado: US$ {diferencias.precio_actual} → <b>US$ {diferencias.precio_nuevo}</b>
          </p>
          {diferencias.hay_reinicio && (
            <div className="alert alert-warning py-2 small">
              <i className="bi bi-exclamation-triangle" /> Algunos servidores se reiniciarán: el tenant tendrá unos minutos sin servicio.
            </div>
          )}
          <div className="d-flex flex-wrap gap-2">
            <button className="btn btn-primary" disabled={enviando}
                    onClick={() => encolar("cambiar-plan", { plan: elegido })}>Confirmar cambio de plan</button>
            <button className="btn btn-outline-secondary" disabled={enviando}
                    onClick={() => encolar("previsualizar", { plan: elegido })}
                    title="Ejecuta el motor en modo plan y lista los recursos exactos, sin aplicar nada">
              Ver detalle exacto con el motor
            </button>
          </div>
        </div>
      )}
    </>
  );
}
