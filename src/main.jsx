import React from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

function App() {
  return (
    <div style={{ padding: 40, background: "white", color: "black" }}>
      <h1>TEST WORKS</h1>
      <p>If you see this, React is loading.</p>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
