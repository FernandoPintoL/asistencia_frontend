import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import { fecha } from "../../formato";
import { useConfirmar } from "../../components/Confirmar";
import { useManejarError, useTitulo } from "../../sesion";

/**
 * Paso 1: subir los dos Excel → el backend los valida (no guarda nada).
 * Paso 2: vista previa → al confirmar se envían de nuevo los mismos archivos y se activa el módulo.
 */
export default function ModuloImportar() {
  const navigate = useNavigate();
  const manejarError = useManejarError();
  const pedirConfirmacion = useConfirmar(); // "confirmar" ya es el paso 2 de la importación
  const [activo, setActivo] = useState(null);
  const [nombre, setNombre] = useState("");
  const [archivos, setArchivos] = useState({ estudiantes: null, fechas: null });
  const [errores, setErrores] = useState([]);
  const [vista, setVista] = useState(null);
  const [enviando, setEnviando] = useState(false);
  useTitulo(vista ? "Vista previa" : "Nuevo módulo");

  useEffect(() => {
    api("/modulo-activo/").then((d) => setActivo(d.modulo)).catch(manejarError);
  }, [manejarError]);

  function datos() {
    const fd = new FormData();
    fd.append("nombre", nombre);
    if (archivos.estudiantes) fd.append("estudiantes", archivos.estudiantes);
    if (archivos.fechas) fd.append("fechas", archivos.fechas);
    return fd;
  }

  async function enviar(ruta) {
    setEnviando(true);
    try {
      return await api(ruta, { method: "POST", body: datos() });
    } catch (e) {
      if (e.data.errores) {
        setErrores(e.data.errores);
        if (vista) volver();
      } else {
        manejarError(e);
      }
      return null;
    } finally {
      setEnviando(false);
    }
  }

  // Al volver al formulario los campos de archivo quedan vacíos: hay que elegirlos de nuevo.
  function volver() {
    setVista(null);
    setArchivos({ estudiantes: null, fechas: null });
  }

  async function validar(e) {
    e.preventDefault();
    const r = await enviar("/panel/modulos/importar/validar/");
    if (r) {
      setErrores([]);
      setVista(r);
    }
  }

  async function confirmar() {
    const ok = await pedirConfirmacion({
      titulo: "¿Activar el módulo nuevo?",
      mensaje: (
        <p className="mb-0">Se activará un módulo nuevo sin registros de asistencia. El módulo actual se conserva en la
          base de datos, pero dejará de estar activo.</p>
      ),
      boton: "Activar módulo",
    });
    if (!ok) return;
    const r = await enviar("/panel/modulos/importar/confirmar/");
    if (r) navigate("/panel", { state: { flash: { tipo: "success", texto: r.detail } } });
  }

  if (vista) {
    return (
      <>
        <h1 className="h3 mb-1">Vista previa · {vista.nombre}</h1>
        <p className="text-secondary">Los archivos son válidos: {vista.estudiantes.length} estudiantes y {vista.fechas.length} fechas de clase. Todavía no se guardó nada.</p>
        <div className="row g-4">
          <div className="col-lg-7"><h2 className="h6">Estudiantes</h2>
            <div className="panel table-responsive" style={{ maxHeight: 340, overflow: "auto" }}><table className="table table-sm mb-0">
              <thead><tr><th>Registro</th><th>Nombre</th><th>Correo</th></tr></thead>
              <tbody>{vista.estudiantes.map((e) => <tr key={e.nro_registro}><td>{e.nro_registro}</td><td>{e.nombre}</td><td>{e.correo}</td></tr>)}</tbody>
            </table></div></div>
          <div className="col-lg-5"><h2 className="h6">Fechas de clase</h2>
            <div className="panel table-responsive" style={{ maxHeight: 340, overflow: "auto" }}><table className="table table-sm mb-0">
              <thead><tr><th>Fecha</th><th>Inicio</th><th>Fin</th></tr></thead>
              <tbody>{vista.fechas.map((f) => <tr key={f.fecha}><td>{fecha(f.fecha)}</td><td>{f.inicio}</td><td>{f.fin}</td></tr>)}</tbody>
            </table></div></div>
        </div>
        <div className="mt-4 d-flex gap-2">
          <button className="btn btn-primary" onClick={confirmar} disabled={enviando}>Activar módulo</button>
          <button className="btn btn-outline-secondary" onClick={volver}>Cancelar</button>
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="h3 mb-1">Activar un nuevo módulo</h1>
      <p className="text-secondary">Sube los dos archivos Excel. Antes de activar verás una vista previa.
        {activo && <> El módulo actual (<strong>{activo.nombre}</strong>) dejará de estar activo, pero sus datos se conservan.</>}</p>

      {errores.length > 0 && (
        <div className="alert alert-danger"><strong>Corrige estos errores y vuelve a subir los archivos:</strong>
          <ul className="mb-0 mt-2">{errores.map((e) => <li key={e}>{e}</li>)}</ul></div>
      )}

      <form onSubmit={validar} className="panel p-4">
        <div className="mb-3"><label className="form-label fw-semibold" htmlFor="nombre">Nombre del módulo</label>
          <input id="nombre" className="form-control" value={nombre} onChange={(e) => setNombre(e.target.value)}
                 placeholder="Ej.: Módulo 2 · Base de datos" required /></div>
        <div className="row g-3 mb-4">
          <div className="col-md-6"><label className="form-label fw-semibold" htmlFor="estudiantes">Excel de estudiantes</label>
            <input id="estudiantes" type="file" accept=".xlsx" className="form-control" required
                   onChange={(e) => setArchivos((a) => ({ ...a, estudiantes: e.target.files[0] || null }))} />
            <div className="form-text">Columnas: Número de registro · Nombre completo · Correo electrónico</div></div>
          <div className="col-md-6"><label className="form-label fw-semibold" htmlFor="fechas">Excel de fechas</label>
            <input id="fechas" type="file" accept=".xlsx" className="form-control" required
                   onChange={(e) => setArchivos((a) => ({ ...a, fechas: e.target.files[0] || null }))} />
            <div className="form-text">Columnas: Fecha (dd/mm/aaaa) · Hora inicio · Hora fin</div></div>
        </div>
        <button className="btn btn-primary" disabled={enviando}>Validar y ver vista previa</button>
      </form>
    </>
  );
}
