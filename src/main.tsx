import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register Service Worker for PWA
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").then(
      (registration) => {
        console.log("[SW] Registered:", registration.scope);
      },
      (error) => {
        console.log("[SW] Registration failed:", error);
      }
    );
  });
}

createRoot(document.getElementById("root")!).render(<App />);
