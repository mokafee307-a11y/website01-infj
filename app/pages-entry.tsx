import { createRoot } from "react-dom/client";
import Prototype from "./Prototype";
import "./globals.css";

const root = document.getElementById("root");
if (!root) throw new Error("Missing website root");
createRoot(root).render(<Prototype />);
