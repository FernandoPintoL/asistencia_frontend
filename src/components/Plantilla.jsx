import { Mensajes } from "../sesion";

/** Estructura común de cada pantalla (equivale a base.html). */
export default function Plantilla({ barra, children }) {
  return (
    <>
      {barra}
      <main className="container contenedor py-4">
        <Mensajes />
        {children}
      </main>
    </>
  );
}
