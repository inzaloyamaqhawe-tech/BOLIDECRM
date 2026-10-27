import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Light is the default; apply a previously chosen dark theme before React
// paints so authenticated and sign-in screens do not flash between modes.
document.documentElement.classList.toggle("dark",localStorage.getItem("bolide-crm:theme")==="dark");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
