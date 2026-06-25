import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { setupPWA } from "./pwa-register";

createRoot(document.getElementById("root")!).render(<App />);

setupPWA();
