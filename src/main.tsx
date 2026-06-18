import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import { AuthProvider } from "./appState";
import { App } from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(<StrictMode><AuthProvider><App /><Toaster richColors toastOptions={{ classNames: { toast: "rounded-2xl border-stone-200 shadow-[0_18px_50px_rgba(28,25,23,0.14)]", title: "font-semibold" } }} /></AuthProvider></StrictMode>);
