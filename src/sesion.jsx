// Sesión (token JWT) y mensajes de aviso, compartidos por toda la aplicación.
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { alExpirarSesion, guardarSesion, leerSesion } from "./api";

export const LOGIN = { estudiante: "/", admin: "/panel/login" };

// ───────────── Mensajes (equivalente a django.contrib.messages) ─────────────

const FlashContext = createContext(null);

export function FlashProvider({ children }) {
  const location = useLocation();
  const [mensajes, setMensajes] = useState([]);

  // Al cambiar de página se borran los avisos anteriores; si la navegación
  // trae un aviso (navigate(ruta, { state: { flash } })) se muestra ese.
  useEffect(() => {
    const f = location.state?.flash;
    setMensajes(f ? [{ ...f, id: location.key }] : []);
  }, [location.key]); // eslint-disable-line react-hooks/exhaustive-deps

  const flash = useCallback((tipo, texto) => {
    setMensajes((m) => [...m, { tipo, texto, id: `${Date.now()}-${Math.random()}` }]);
  }, []);
  const cerrar = useCallback((id) => setMensajes((m) => m.filter((x) => x.id !== id)), []);

  return <FlashContext.Provider value={{ mensajes, flash, cerrar }}>{children}</FlashContext.Provider>;
}

export const useFlash = () => useContext(FlashContext);

export function Mensajes() {
  const { mensajes, cerrar } = useFlash();
  return mensajes.map((m) => (
    <div key={m.id} className={`alert alert-${m.tipo} alert-dismissible`} role="alert">
      {m.texto}
      <button type="button" className="btn-close" aria-label="Cerrar" onClick={() => cerrar(m.id)} />
    </div>
  ));
}

// ───────────── Sesión ─────────────

const SesionContext = createContext(null);

export function SesionProvider({ children }) {
  const navigate = useNavigate();
  const [sesion, setSesion] = useState(leerSesion);

  const entrar = useCallback((datos) => {
    guardarSesion(datos);
    setSesion(datos);
  }, []);

  const salir = useCallback(
    (flash, rol = leerSesion()?.rol) => {
      guardarSesion(null);
      setSesion(null);
      navigate(LOGIN[rol] || "/", { state: flash ? { flash } : undefined });
    },
    [navigate],
  );

  // Token vencido o módulo cambiado: el backend responde 401 y volvemos al login.
  useEffect(() => {
    // Se usa el rol de la petición rechazada: si fallan varias a la vez, la sesión ya puede estar borrada.
    alExpirarSesion((rol) => salir({ tipo: "danger", texto: "Tu sesión ya no es válida. Ingresa nuevamente." }, rol));
  }, [salir]);

  return <SesionContext.Provider value={{ sesion, entrar, salir }}>{children}</SesionContext.Provider>;
}

export const useSesion = () => useContext(SesionContext);

/** Protege una ruta: si no hay sesión con ese rol, manda al login. */
export function RequiereRol({ rol, children }) {
  const { sesion } = useSesion();
  if (sesion?.rol !== rol) return <Navigate to={LOGIN[rol]} replace />;
  return children;
}

/** Manejo común de errores de la API dentro de una página. */
export function useManejarError() {
  const { flash } = useFlash();
  const navigate = useNavigate();
  return useCallback(
    (e, tipo = "danger") => {
      if (e.manejado || e.status === 401) return; // ya se redirigió al login
      if (e.data?.sin_modulo) {
        navigate("/panel/modulos", { state: { flash: { tipo: "danger", texto: e.message } } });
        return;
      }
      flash(tipo, e.message);
    },
    [flash, navigate],
  );
}

export function useTitulo(titulo) {
  useEffect(() => {
    document.title = titulo;
  }, [titulo]);
}
