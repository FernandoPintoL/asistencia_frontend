import { useEffect, useState } from "react";
import { api } from "../api";
import { useManejarError, useTitulo } from "../sesion";
import { Barras, duracion } from "./comun";

/**
 * RF-08: los 4 motores crean la misma infraestructura; aquí se comparan con las operaciones
 * reales de la plataforma: cuánto tarda cada una y cuántas terminan bien.
 */
export default function ComparacionMotores() {
  useTitulo("Comparación de motores");
  const manejarError = useManejarError();
  const [d, setD] = useState(null);

  useEffect(() => {
    api("/plataforma/comparacion-motores/").then(setD).catch(manejarError);
  }, [manejarError]);

  if (!d) return null;
  const nombres = Object.fromEntries(d.motores.map((m) => [m.codigo, m.nombre]));
  const hayDatos = d.motores.some((m) => m.total > 0);

  return (
    <>
      <h1 className="h3 mb-1">Comparación de motores</h1>
      <p className="text-secondary mb-4">
        Terraform, OpenTofu, Pulumi y CloudFormation crean los mismos recursos. Esta comparación usa las
        operaciones reales de la plataforma; la duración es la de las operaciones exitosas, de principio a fin.
        {" "}Las fallidas incluyen errores del entorno (por ejemplo, el programa del motor sin instalar o un
        límite de la cuenta de AWS); el detalle de cada una está en Operaciones.
        {d.simuladas_excluidas > 0 && ` No se cuenta${d.simuladas_excluidas > 1 ? "n" : ""} ${d.simuladas_excluidas} operaci${d.simuladas_excluidas > 1 ? "ones" : "ón"} del modo simulado.`}
      </p>

      <div className="panel table-responsive mb-4"><table className="table mb-0 align-middle">
        <thead><tr><th>Motor</th><th className="text-end">Operaciones</th><th className="text-end">Exitosas</th><th className="text-end">Fallidas</th><th style={{ minWidth: 200 }}>Tasa de éxito</th></tr></thead>
        <tbody>
          {d.motores.map((m) => (
            <tr key={m.codigo}>
              <td className="fw-semibold">{m.nombre}</td>
              <td className="text-end">{m.total}</td>
              <td className="text-end">{m.exitosas}</td>
              <td className="text-end">{m.fallidas}</td>
              <td>
                {m.tasa_exito == null ? <span className="text-secondary small">Sin operaciones</span> : (
                  <Barras etiquetaAncho="0" max={100} filas={[{ clave: m.codigo, etiqueta: "", valor: m.tasa_exito, texto: `${m.tasa_exito} %` }]} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table></div>

      {!hayDatos && <div className="alert alert-secondary">Todavía no hay operaciones terminadas para comparar.</div>}

      <h2 className="h5 mb-3">Duración promedio por operación</h2>
      <div className="row g-3">
        {d.por_tipo.map((t) => {
          const filas = Object.entries(t.motores).map(([codigo, v]) => ({
            clave: codigo,
            etiqueta: nombres[codigo] || codigo,
            valor: v.promedio_seg,
            texto: duracion(v.promedio_seg),
            detalle: `${nombres[codigo]}: promedio ${duracion(v.promedio_seg)} · mín. ${duracion(v.min_seg)} · máx. ${duracion(v.max_seg)} · ${v.n} operación${v.n > 1 ? "es" : ""}`,
          }));
          return (
            <div key={t.tipo} className="col-md-6 col-xl-4">
              <div className="panel p-4 h-100">
                <h3 className="h6 mb-3">{t.tipo_display}</h3>
                <Barras filas={filas} />
                <div className="small text-secondary mt-3">
                  {Object.entries(t.motores).map(([codigo, v]) => (
                    <div key={codigo}>{nombres[codigo]}: {v.n} op. · {duracion(v.min_seg)} a {duracion(v.max_seg)}</div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
