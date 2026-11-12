import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import Paginacion from "../components/Paginacion";
import { useFiltros } from "../filtros";
import { useManejarError, useTitulo } from "../sesion";
import { ESTADOS_OPERACION, EstadoOperacion, TIPOS_OPERACION, duracion, enCurso, momento, useConsultaPeriodica } from "./comun";

/** Historial de operaciones: quién, cuándo, qué y con qué resultado (RF-20). */
export default function Operaciones() {
  useTitulo("Operaciones");
  const manejarError = useManejarError();
  const f = useFiltros(["estado", "tipo", "tenant"]);
  const [datos, setDatos] = useState(null);

  const cargar = useCallback(
    () => api(`/plataforma/operaciones/?${f.consulta}`).then(setDatos).catch(manejarError),
    [f.consulta, manejarError],
  );
  useEffect(() => {
    cargar();
  }, [cargar]);
  useConsultaPeriodica(cargar, !!datos?.results.some(enCurso), 4000);

  return (
    <>
      <h1 className="h3 mb-1">Operaciones</h1>
      <p className="text-secondary mb-3">Cada creación, actualización, cambio de plan o eliminación se ejecuta en segundo plano y queda registrada aquí.</p>

      <form className="panel p-3 mb-3 row g-2 align-items-end" onSubmit={f.aplicar}>
        <div className="col-6 col-md-3">
          <label className="form-label small fw-semibold" htmlFor="o_estado">Estado</label>
          <select id="o_estado" className="form-select" value={f.form.estado} onChange={(e) => f.setCampo("estado", e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(ESTADOS_OPERACION).map(([k, [t]]) => <option key={k} value={k}>{t}</option>)}
          </select>
        </div>
        <div className="col-6 col-md-3">
          <label className="form-label small fw-semibold" htmlFor="o_tipo">Tipo</label>
          <select id="o_tipo" className="form-select" value={f.form.tipo} onChange={(e) => f.setCampo("tipo", e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(TIPOS_OPERACION).map(([k, t]) => <option key={k} value={k}>{t}</option>)}
          </select>
        </div>
        <div className="col-md-3 d-flex gap-2">
          <button className="btn btn-primary flex-grow-1">Filtrar</button>
          <button type="button" className="btn btn-outline-secondary" onClick={f.limpiar} aria-label="Limpiar filtros"><i className="bi bi-x-lg" /></button>
        </div>
        {f.activos.tenant && <div className="col-12 small text-secondary">Mostrando solo un tenant.</div>}
      </form>

      {datos && (
        <div className="panel table-responsive"><table className="table mb-0 align-middle">
          <thead><tr><th>#</th><th>Tenant</th><th>Tipo</th><th>Estado</th><th>Solicitada por</th><th>Inicio</th><th>Duración</th></tr></thead>
          <tbody>
            {datos.results.map((op) => (
              <tr key={op.id}>
                <td><Link to={`/plataforma/operaciones/${op.id}`}>#{op.id}</Link></td>
                <td>
                  <Link to={`/plataforma/tenants/${op.tenant.id}`} className="text-decoration-none">{op.tenant.nombre}</Link>
                  <div className="small text-secondary font-monospace">{op.tenant.identificador}/{op.tenant.entorno}</div>
                </td>
                <td>{op.tipo_display}{op.reintento_de && <div className="small text-secondary">reintento de #{op.reintento_de}</div>}</td>
                <td>
                  <EstadoOperacion estado={op.estado} />
                  {op.estado === "FALLIDA" && <div className="small text-danger mt-1 text-truncate" style={{ maxWidth: 260 }} title={op.error}>{op.error}</div>}
                </td>
                <td>{op.solicitada_por_nombre}</td>
                <td className="text-nowrap small">{momento(op.iniciada_en || op.creada_en)}</td>
                <td className="text-nowrap small">{duracion(op.duracion_seg)}</td>
              </tr>
            ))}
            {datos.results.length === 0 && (
              <tr><td colSpan={7} className="text-center text-secondary py-4">No hay operaciones con esos filtros.</td></tr>
            )}
          </tbody>
        </table></div>
      )}
      <Paginacion datos={datos} onCambiar={f.irAPagina} />
    </>
  );
}
