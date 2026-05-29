import React from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

function App() {
  return (
    <div className="app">
      <h1>Pocket Scrapbook</h1>

      <div className="card">
        <h2>Welcome</h2>
        <p>Your fresh rebuild is working.</p>

        <button>Create Scrapbook</button>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
