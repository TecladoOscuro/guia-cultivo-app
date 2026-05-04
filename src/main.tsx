// IMPORTANTE: polyfill Temporal DEBE importarse antes de cualquier otra cosa.
// Schedule-X usa Temporal en top-level de sus módulos.
import "./lib/polyfillTemporal";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App";
import { initPwaUpdate } from "./lib/pwaUpdate";

const basename = import.meta.env.BASE_URL.replace(/\/$/, "");

initPwaUpdate();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </StrictMode>
);
