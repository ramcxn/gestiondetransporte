import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { setupPWA } from "./pwa-register";
import { setupCacheBusting } from "./lib/cache-busting";

setupCacheBusting();

createRoot(document.getElementById("root")!).render(<App />);

setupPWA();
