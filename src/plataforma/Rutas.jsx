import { useEffect, useState } from "react";
import { NavLink, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { api } from "../api";
import Plantilla from "../components/Plantilla";
import { RequiereRol, useSesion } from "../sesion";
import Alertas from "./Alertas";
import Auditoria from "./Auditoria";
import CambiarPlan from "./CambiarPlan";
import ComparacionMotores from "./ComparacionMotores";
import EliminarTenant from "./EliminarTenant";
import Login from "./Login";
import MiTenant from "./MiTenant";
import OperacionDetalle from "./OperacionDetalle";
import Operaciones from "./Operaciones";
import Planes from "./Planes";
import Resumen from "./Resumen";
import TenantDetalle from "./TenantDetalle";
import TenantNuevo from "./TenantNuevo";
import Tenants from "./Tenants";

const ENLACES = {
  plataforma: [
    ["/plataforma", "Inicio", true],
    ["/plataforma/tenants", "Tenants"],
    ["/plataforma/planes", "Planes"],
    ["/plataforma/operaciones", "Operaciones"],
    ["/plataforma/motores", "Motores"],
    ["/plataforma/alertas", "Alertas"],
    ["/plataforma/auditoria", "Auditoría"],
  ],
  tenant: [["/plataforma/mi-tenant", "Mis servicios"], ["/plataforma/alertas", "Alertas"]],
};

function Layout() {
  const { sesion, salir } = useSesion();
  const [simulado, setSimulado] = useState(false);
  useEffect(() => {
    api("/plataforma/monitoreo/").then((d) => setSimulado(!!d.simulado)).catch(() => {});
  }, []);
  const barra = (
    <header className="topbar">
      <div className="container contenedor d-flex flex-wrap align-items-center justify-content-between py-2 gap-2">
        <span className="brand">
          Asistencia <span className="fw-normal text-white-50">· Plataforma de tenants</span>
          {simulado && (
            <span className="badge bg-warning text-dark ms-2" title="IAC_SIMULADO=True: no se crea nada en AWS">
              <i className="bi bi-cone-striped" /> Modo simulado
            </span>
          )}
        </span>
        <nav className="nav">
          {ENLACES[sesion.rol].map(([ruta, texto, exacto]) => (
            <NavLink key={ruta} to={ruta} end={exacto} className="nav-link">{texto}</NavLink>
          ))}
        </nav>
        <div className="d-flex align-items-center gap-2">
          <span className="small text-white-50">{sesion.nombre}</span>
          <button className="btn btn-sm btn-outline-light" onClick={() => salir()}>Cerrar sesión</button>
        </div>
      </div>
    </header>
  );
  return <Plantilla barra={barra}><Outlet /></Plantilla>;
}

/** Inicio según el rol: el admin de la plataforma ve el resumen; el de un tenant, sus servicios. */
function Inicio() {
  const { sesion } = useSesion();
  return sesion.rol === "tenant" ? <Navigate to="/plataforma/mi-tenant" replace /> : <Resumen />;
}

const soloPlataforma = (pagina) => <RequiereRol rol="plataforma">{pagina}</RequiereRol>;

export default function RutasPlataforma() {
  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route element={<RequiereRol rol={["plataforma", "tenant"]}><Layout /></RequiereRol>}>
        <Route index element={<Inicio />} />
        <Route path="mi-tenant" element={<MiTenant />} />
        <Route path="tenants" element={soloPlataforma(<Tenants />)} />
        <Route path="tenants/nuevo" element={soloPlataforma(<TenantNuevo />)} />
        <Route path="motores" element={soloPlataforma(<ComparacionMotores />)} />
        <Route path="tenants/:id" element={<TenantDetalle />} />
        <Route path="tenants/:id/cambiar-plan" element={soloPlataforma(<CambiarPlan />)} />
        <Route path="tenants/:id/eliminar" element={soloPlataforma(<EliminarTenant />)} />
        <Route path="planes" element={soloPlataforma(<Planes />)} />
        <Route path="operaciones" element={soloPlataforma(<Operaciones />)} />
        <Route path="operaciones/:id" element={<OperacionDetalle />} />
        <Route path="alertas" element={<Alertas />} />
        <Route path="auditoria" element={soloPlataforma(<Auditoria />)} />
      </Route>
      <Route path="*" element={<Navigate to="/plataforma" replace />} />
    </Routes>
  );
}
