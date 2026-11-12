import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { api } from "../api";
import Plantilla from "../components/Plantilla";
import { useManejarError, useSesion, useTitulo } from "../sesion";

export default function Login() {
  useTitulo("Plataforma · Ingresar");
  const { sesion, entrar } = useSesion();
  const navigate = useNavigate();
  const manejarError = useManejarError();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [enviando, setEnviando] = useState(false);

  if (sesion?.rol === "plataforma" || sesion?.rol === "tenant") return <Navigate to="/plataforma" replace />;

  async function enviar(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      const d = await api("/plataforma/login/", { method: "POST", body: { username, password } });
      entrar({ token: d.token, rol: d.rol, nombre: d.nombre });
      navigate("/plataforma");
    } catch (err) {
      manejarError(err);
      setEnviando(false);
    }
  }

  return (
    <Plantilla>
      <div className="row justify-content-center pt-4"><div className="col-md-5 col-lg-4">
        <h1 className="h3 mb-1">Plataforma de tenants</h1>
        <p className="text-secondary mb-4">Administración de instituciones, planes y despliegues.</p>
        <form onSubmit={enviar} className="panel p-4">
          <label className="form-label fw-semibold" htmlFor="p_username">Usuario</label>
          <input id="p_username" className="form-control mb-3" required autoFocus autoComplete="username"
                 value={username} onChange={(e) => setUsername(e.target.value)} />
          <label className="form-label fw-semibold" htmlFor="p_password">Contraseña</label>
          <input id="p_password" type="password" className="form-control mb-4" required autoComplete="current-password"
                 value={password} onChange={(e) => setPassword(e.target.value)} />
          <button className="btn btn-primary w-100" disabled={enviando}>Ingresar</button>
        </form>
      </div></div>
    </Plantilla>
  );
}
