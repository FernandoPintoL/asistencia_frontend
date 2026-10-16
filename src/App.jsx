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

export default function App() {
  return (
    <Routes>
      {/* Estudiante */}
      <Route path="/" element={<LoginEstudiante />} />
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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
