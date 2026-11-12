import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.min.css";
import "./estilos.css";
import App from "./App";
import { ConfirmarProvider } from "./components/Confirmar";
import { FlashProvider, SesionProvider } from "./sesion";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <FlashProvider>
        <SesionProvider>
          <ConfirmarProvider>
            <App />
          </ConfirmarProvider>
        </SesionProvider>
      </FlashProvider>
    </BrowserRouter>
  </StrictMode>,
);
