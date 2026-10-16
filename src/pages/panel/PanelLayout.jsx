import { NavLink, Outlet } from "react-router-dom";
import Plantilla from "../../components/Plantilla";
import { useSesion } from "../../sesion";

const ENLACES = [
  ["/panel", "Resumen", true],
  ["/panel/estudiantes", "Estudiantes"],
  ["/panel/asistencias", "Asistencias"],
  ["/panel/actividades", "Actividades"],
  ["/panel/modulos", "Módulos"],
  ["/panel/nuevo-modulo", "Nuevo módulo"],
];

/** Barra del administrador + la página elegida (equivale a base_panel.html). */
export default function PanelLayout() {
  const { salir } = useSesion();
  const barra = (
    <header className="topbar">
      <div className="container contenedor d-flex flex-wrap align-items-center justify-content-between py-2 gap-2">
        <span className="brand">Control de asistencia <span className="fw-normal text-white-50">· Administración</span></span>
        <nav className="nav">
          {ENLACES.map(([ruta, texto, exacto]) => (
            <NavLink key={ruta} to={ruta} end={exacto} className="nav-link">{texto}</NavLink>
          ))}
        </nav>
        <button className="btn btn-sm btn-outline-light" onClick={() => salir()}>Cerrar sesión</button>
      </div>
    </header>
  );
  return <Plantilla barra={barra}><Outlet /></Plantilla>;
}
