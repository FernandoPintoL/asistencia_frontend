// Ventana de confirmación (modal de Bootstrap) en lugar de window.confirm / window.prompt.
//
//   const confirmar = useConfirmar();
//   if (await confirmar({ titulo: "¿Suspender?", mensaje: "…", boton: "Suspender" })) { … }
//
// Con `escribir: "texto"` el botón se activa recién cuando se escribe ese texto exacto
// (acciones destructivas). El backend vuelve a validar la confirmación.
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from "react";

const ConfirmarContext = createContext(null);

export function ConfirmarProvider({ children }) {
  const [pedido, setPedido] = useState(null);

  const confirmar = useCallback((opciones) => new Promise((resolver) => {
    setPedido({ ...opciones, resolver });
  }), []);

  function responder(valor) {
    pedido.resolver(valor);
    setPedido(null);
  }

  return (
    <ConfirmarContext.Provider value={confirmar}>
      {children}
      {pedido && <Ventana {...pedido} onResponder={responder} />}
    </ConfirmarContext.Provider>
  );
}

export const useConfirmar = () => useContext(ConfirmarContext);

function Ventana({ titulo, mensaje, boton = "Continuar", variante = "primary", escribir, onResponder }) {
  const id = useId();
  const caja = useRef(null);
  const [texto, setTexto] = useState("");
  const listo = !escribir || texto.trim() === escribir;

  useEffect(() => {
    const anterior = document.activeElement;
    document.body.classList.add("modal-open");
    // Foco inicial: el campo a escribir o, si no hay, el botón Cancelar (lo más seguro)
    caja.current?.querySelector("input, [data-cancelar]")?.focus();
    return () => {
      document.body.classList.remove("modal-open");
      anterior?.focus?.();
    };
  }, []);

  function teclas(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      onResponder(false);
      return;
    }
    if (e.key !== "Tab") return;
    // Mantener el foco dentro de la ventana
    const enfocables = [...caja.current.querySelectorAll("button:not(:disabled), input")];
    const [primero, ultimo] = [enfocables[0], enfocables[enfocables.length - 1]];
    if (e.shiftKey && document.activeElement === primero) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      primero.focus();
    }
  }

  return (
    <>
      <div className="modal-backdrop fade show" />
      <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true"
           aria-labelledby={`${id}-titulo`} onKeyDown={teclas}
           onMouseDown={(e) => e.target === e.currentTarget && onResponder(false)}>
        <div className="modal-dialog modal-dialog-centered" ref={caja}>
          <form className="modal-content" onSubmit={(e) => { e.preventDefault(); if (listo) onResponder(true); }}>
            <div className="modal-header">
              <h2 className="modal-title h5" id={`${id}-titulo`}>{titulo}</h2>
              <button type="button" className="btn-close" aria-label="Cancelar" onClick={() => onResponder(false)} />
            </div>
            <div className="modal-body">
              <div className="confirmar-mensaje">{mensaje}</div>
              {escribir && (
                <div className="mt-3">
                  <label className="form-label small" htmlFor={`${id}-escribir`}>
                    Para confirmar, escribe <code className="user-select-all">{escribir}</code>
                  </label>
                  <input id={`${id}-escribir`} className="form-control font-monospace" autoComplete="off"
                         spellCheck={false} value={texto} onChange={(e) => setTexto(e.target.value)} />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" data-cancelar onClick={() => onResponder(false)}>
                Cancelar
              </button>
              <button type="submit" className={`btn btn-${variante}`} disabled={!listo}>{boton}</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
