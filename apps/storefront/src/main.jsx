import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";

import "./index.css";
import "./styles/fonts.css";
import "./styles/search.css";
import "./styles/shop.css";
import "./styles/home.css";
import "./styles/products.css";

createRoot(
  document.getElementById("root")
).render(
  <StrictMode>
    <App />
  </StrictMode>
);
