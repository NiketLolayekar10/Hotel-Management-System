
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ThemeProvider } from "./components/ui/theme-provider";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="light" storageKey="hotel-theme">
    <App />
  </ThemeProvider>
);  