import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api } from "../../api";
import Plantilla from "../../components/Plantilla";
import { useManejarError, useSesion, useTitulo } from "../../sesion";

export default function LoginAdmin() {
  useTitulo("Administración · Ingresar");
  const { sesion, entrar } = useSesion();
  const navigate = useNavigate();
  const manejarError = useManejarError();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [enviando, setEnviando] = useState(false);

  if (sesion?.rol === "admin") return <Navigate to="/panel" replace />;

  async function enviar(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      const d = await api("/panel/login/", { method: "POST", body: { username, password } });
      entrar({ token: d.token, rol: "admin", nombre: d.nombre });
      navigate("/panel");
    } catch (err) {
      manejarError(err);
      setEnviando(false);
    }
  }

  return (
    <Plantilla>
      <div className="row justify-content-center pt-4"><div className="col-md-5 col-lg-4">
        <h1 className="h3 mb-4">Acceso de administración</h1>
        <form onSubmit={enviar} className="panel p-4">
          <label className="form-label fw-semibold" htmlFor="id_username">Usuario</label>
          <input id="id_username" className="form-control mb-3" required autoFocus autoComplete="username"
                 value={username} onChange={(e) => setUsername(e.target.value)} />
          <label className="form-label fw-semibold" htmlFor="id_password">Contraseña</label>
          <input id="id_password" type="password" className="form-control mb-4" required autoComplete="current-password"
                 value={password} onChange={(e) => setPassword(e.target.value)} />
          <button className="btn btn-primary w-100" disabled={enviando}>Ingresar</button>
        </form>
        <p className="text-center mt-4 small"><Link to="/" className="text-secondary">Volver al acceso de estudiantes</Link></p>
      </div></div>
    </Plantilla>
  );
}
