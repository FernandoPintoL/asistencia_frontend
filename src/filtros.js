import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Filtros guardados en la URL (?q=...&fecha=...&page=2), igual que el GET de Django.
 * - activos: lo que está en la URL (se usa para pedir datos al backend)
 * - form / setCampo: lo que el usuario está escribiendo
 */
export function useFiltros(campos) {
  const [params, setParams] = useSearchParams();
  const activos = Object.fromEntries(campos.map((c) => [c, params.get(c) || ""]));
  const [form, setForm] = useState(activos);

  // Si la URL cambia por otro medio (botón Atrás del navegador), el formulario la sigue.
  const claveUrl = campos.map((c) => activos[c]).join("\u0000");
  useEffect(() => {
    setForm(activos);
  }, [claveUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const consulta = new URLSearchParams(
    Object.entries({ ...activos, page: params.get("page") || "" }).filter(([, v]) => v),
  ).toString();

  return {
    activos,
    form,
    consulta, // "q=juan&page=2" para la API
    setCampo: (campo, valor) => setForm((f) => ({ ...f, [campo]: valor })),
    aplicar: (e) => {
      e?.preventDefault();
      setParams(Object.fromEntries(Object.entries(form).filter(([, v]) => v)));
    },
    limpiar: () => {
      setForm(Object.fromEntries(campos.map((c) => [c, ""])));
      setParams({});
    },
    irAPagina: (n) => setParams({ ...Object.fromEntries(Object.entries(activos).filter(([, v]) => v)), page: n }),
  };
}
