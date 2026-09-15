import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { safeGetItem } from "./lib/safeStorage";

// Apply saved theme on load (guarded for Safari private / blocked storage)
const savedTheme = safeGetItem("theme");
if (savedTheme === "dark" || !savedTheme) {
  document.documentElement.classList.add("dark");
} else {
  document.documentElement.classList.remove("dark");
}

createRoot(document.getElementById("root")!).render(<App />);
