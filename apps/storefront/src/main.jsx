import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import { getRouteFromHash } from "./utils/routing";

import "./index.css";
import "./styles/fonts.css";
import "./styles/search.css";
import "./styles/shop.css";
import "./styles/home.css";
import "./styles/products.css";

async function startStorefront() {
  // Keep readable static product HTML until the interactive page chunk is ready.
  if (getRouteFromHash().type === "product") {
    await import("./pages/ProductPage");
  }
  createRoot(document.getElementById("root")).render(
    <StrictMode><App /></StrictMode>
  );
}

startStorefront().catch((error) => {
  console.error("Unable to start the interactive storefront:", error);
});
