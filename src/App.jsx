import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { RequiereRol } from "./sesion";
import LoginEstudiante from "./pages/LoginEstudiante";
import MiAsistencia from "./pages/MiAsistencia";
import LoginAdmin from "./pages/panel/LoginAdmin";
import PanelLayout from "./pages/panel/PanelLayout";
import Dashboard from "./pages/panel/Dashboard";
import Estudiantes from "./pages/panel/Estudiantes";
import Asistencias from "./pages/panel/Asistencias";
import Actividades from "./pages/panel/Actividades";
import Modulos from "./pages/panel/Modulos";
import ModuloImportar from "./pages/panel/ModuloImportar";

// Plataforma de tenants: solo se incluye al compilar con VITE_PLATAFORMA=true.
// Los tenants compilan sin esa variable y su build no contiene este código.
const PLATAFORMA = import.meta.env.VITE_PLATAFORMA === "true";
const RutasPlataforma = PLATAFORMA ? lazy(() => import("./plataforma/Rutas")) : null;

export default function App() {
  return (
    <Routes>
      {/* Estudiante */}
      <Route path="/" element={PLATAFORMA ? <Navigate to="/plataforma" replace /> : <LoginEstudiante />} />
      <Route path="/mi-asistencia" element={<RequiereRol rol="estudiante"><MiAsistencia /></RequiereRol>} />

      {/* Administrador */}
      <Route path="/panel/login" element={<LoginAdmin />} />
      <Route path="/panel" element={<RequiereRol rol="admin"><PanelLayout /></RequiereRol>}>
        <Route index element={<Dashboard />} />
        <Route path="estudiantes" element={<Estudiantes />} />
        <Route path="asistencias" element={<Asistencias />} />
        <Route path="actividades" element={<Actividades />} />
        <Route path="modulos" element={<Modulos />} />
        <Route path="nuevo-modulo" element={<ModuloImportar />} />
      </Route>

      {/* Plataforma de tenants */}
      {PLATAFORMA && (
        <Route path="/plataforma/*" element={<Suspense fallback={null}><RutasPlataforma /></Suspense>} />
      )}

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
