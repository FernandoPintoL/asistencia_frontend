import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import Paginacion from "../components/Paginacion";
import { useFiltros } from "../filtros";
import { useManejarError, useTitulo } from "../sesion";
import { momento } from "./comun";

/** RF-20: quién hizo qué, cuándo y sobre qué. */
export default function Auditoria() {
  useTitulo("Auditoría");
  const manejarError = useManejarError();
  const f = useFiltros(["tenant"]);
  const [datos, setDatos] = useState(null);

  const cargar = useCallback(
    () => api(`/plataforma/auditoria/?${f.consulta}`).then(setDatos).catch(manejarError),
    [f.consulta, manejarError],
  );
  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <>
      <h1 className="h3 mb-1">Auditoría</h1>
      <p className="text-secondary mb-3">Acciones sobre planes y tenants. El resultado de cada operación está en Operaciones.</p>
      {datos && (
        <div className="panel table-responsive"><table className="table mb-0 align-middle">
          <thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Sobre</th><th>Detalle</th></tr></thead>
          <tbody>
            {datos.results.map((a) => (
              <tr key={a.id}>
                <td className="text-nowrap small">{momento(a.fecha)}</td>
                <td>{a.usuario}</td>
                <td>{a.accion}{a.operacion && <> · <Link to={`/plataforma/operaciones/${a.operacion}`}>#{a.operacion}</Link></>}</td>
                <td>{a.objeto}</td>
                <td className="small font-monospace text-secondary text-break" style={{ maxWidth: 320 }}>
                  {Object.keys(a.detalle || {}).length ? JSON.stringify(a.detalle) : ""}
                </td>
              </tr>
            ))}
            {datos.results.length === 0 && <tr><td colSpan={5} className="text-center text-secondary py-4">Sin registros.</td></tr>}
          </tbody>
        </table></div>
      )}
      <Paginacion datos={datos} onCambiar={f.irAPagina} />
    </>
  );
}
