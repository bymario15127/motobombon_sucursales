// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import Router from "./router";
import "./styles/motobombon-tokens.css";
import "./styles/motobombon-pages.css";
import "./styles/admin-design-system.css";
import "./index.css";
import "./styles/responsive-uniform.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>
);
