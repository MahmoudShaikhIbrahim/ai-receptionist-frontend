// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";

import "./index.css";   // Apple design system (MUST be first)
import "./styles.css";   // Support styles (CallDashboard, etc.)

import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);