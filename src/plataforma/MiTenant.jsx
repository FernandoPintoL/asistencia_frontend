import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useManejarError, useTitulo } from "../sesion";
import { Enlace, EstadoTenant, Progreso, useConsultaPeriodica } from "./comun";

/** Administrador del tenant: consulta el estado de los servicios de su institución. */
export default function MiTenant() {
  useTitulo("Mis servicios");
  const manejarError = useManejarError();
  const [cuenta, setCuenta] = useState(null);

  const cargar = useCallback(() => api("/plataforma/mi-cuenta/").then(setCuenta).catch(manejarError), [manejarError]);
  useEffect(() => {
    cargar();
  }, [cargar]);
  const tenants = cuenta?.tenants || [];
  useConsultaPeriodica(cargar, tenants.some((t) => t.operacion_en_curso), 5000);

  if (!cuenta) return null;
  return (
    <>
      <h1 className="h3 mb-1">Mis servicios</h1>
      <p className="text-secondary mb-4">Estado de la aplicación de asistencia de tu institución.</p>
      {tenants.length === 0 && <div className="panel p-4 text-secondary">No tienes instituciones asignadas.</div>}
      <div className="row g-3">
        {tenants.map((t) => (
          <div key={t.id} className="col-md-6">
            <div className="panel p-4 h-100">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <h2 className="h5 mb-0">{t.nombre}</h2>
                  <span className="small text-secondary">{t.entorno_display} · Plan {t.plan.nombre}</span>
                </div>
                <EstadoTenant estado={t.estado} />
              </div>
              {t.operacion_en_curso && (
                <div className="my-3">
                  <div className="small fw-semibold mb-1">{t.operacion_en_curso.tipo_display} en curso</div>
                  <Progreso op={t.operacion_en_curso} />
                </div>
              )}
              <dl className="row small mb-3 mt-3">
                <dt className="col-5">Aplicación</dt><dd className="col-7"><Enlace url={t.salidas?.url_frontend} /></dd>
                <dt className="col-5">Panel</dt><dd className="col-7"><Enlace url={t.salidas?.url_panel_admin} /></dd>
                <dt className="col-5">Versión</dt><dd className="col-7 font-monospace">{t.app_version}</dd>
                <dt className="col-5">Alertas activas</dt>
                <dd className="col-7">
                  {t.alertas_activas > 0
                    ? <Link to={`/plataforma/alertas?tenant=${t.id}&estado=ACTIVA`} className="text-danger fw-semibold">{t.alertas_activas}</Link>
                    : <span className="text-success">Ninguna</span>}
                </dd>
              </dl>
              <Link to={`/plataforma/tenants/${t.id}`} className="btn btn-sm btn-outline-primary">Ver detalle</Link>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
