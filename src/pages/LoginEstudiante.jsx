import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api } from "../api";
import Plantilla from "../components/Plantilla";
import { useManejarError, useSesion, useTitulo } from "../sesion";

export default function LoginEstudiante() {
  useTitulo("Ingresar · Control de asistencia");
  const { sesion, entrar } = useSesion();
  const navigate = useNavigate();
  const manejarError = useManejarError();
  const [modulo, setModulo] = useState(undefined);
  const [identificador, setIdentificador] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    api("/modulo-activo/").then((d) => setModulo(d.modulo)).catch(manejarError);
  }, [manejarError]);

  if (sesion?.rol === "estudiante") return <Navigate to="/mi-asistencia" replace />;

  async function enviar(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      const d = await api("/estudiante/login/", { method: "POST", body: { identificador } });
      entrar({ token: d.token, rol: "estudiante", nombre: d.nombre });
      navigate("/mi-asistencia");
    } catch (err) {
      manejarError(err);
      setEnviando(false);
    }
  }

  return (
    <Plantilla>
      <div className="row justify-content-center pt-4">
        <div className="col-md-6 col-lg-5">
          <h1 className="h2 mb-1">Marca tu asistencia</h1>
          <p className="text-secondary mb-4">
            {modulo === undefined ? " " : modulo ? <>Módulo activo: <strong>{modulo.nombre}</strong></> : "Aún no hay un módulo activo."}
          </p>
          <form onSubmit={enviar} className="panel p-4">
            <label htmlFor="identificador" className="form-label fw-semibold">Correo o número de registro</label>
            <input id="identificador" className="form-control form-control-lg mb-3" autoFocus required
                   placeholder="juan@gmail.com o 1001" autoComplete="username"
                   value={identificador} onChange={(e) => setIdentificador(e.target.value)} />
            <button className="btn btn-primary btn-lg w-100" disabled={enviando}>Ingresar</button>
          </form>
          <p className="text-center mt-4 small">
            <Link to="/panel/login" className="text-secondary">Acceso para administradores</Link>
          </p>
        </div>
      </div>
    </Plantilla>
  );
}
