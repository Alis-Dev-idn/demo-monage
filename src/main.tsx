import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/globals.css";
import App from "./App.tsx";
import { setupApi } from "@/utils/api";
import { initDemoEnvironment } from "./mocks/initDemo";

setupApi();

initDemoEnvironment().finally(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
