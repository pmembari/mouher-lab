import { build, loadEnv, resolveConfig } from "vite";
import { mkdtemp, readFile, writeFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const mode = process.argv[2] || "production";
const config = await resolveConfig({ mode }, "build");
const base = config.base;
if (!base.startsWith("/") || !base.endsWith("/")) throw new Error("Prerender requires a root-relative Vite base ending in '/'.");
const env = { ...loadEnv(mode, root, "VITE_"), ...process.env };
const siteUrl = env.VITE_SITE_URL || "https://pmembari.github.io/mouher-lab/";
const url = new URL(siteUrl);
if (!/^https?:$/.test(url.protocol) || url.pathname !== base || url.search || url.hash) {
  throw new Error("VITE_SITE_URL must be the full public site URL with the same path as Vite base.");
}
const output = path.resolve(root, config.build.outDir);
const temporary = await mkdtemp(path.join(root, ".prerender-"));
try {
  await build({ mode, build: { ssr: "src/prerender.jsx", outDir: temporary, emptyOutDir: true,
    rollupOptions: { output: { entryFileNames: "prerender.mjs" } } } });
  const { loadBuildCatalog, generatePages } = await import(pathToFileURL(path.join(temporary, "prerender.mjs")).href);
  const catalog = await loadBuildCatalog(env);
  const shell = await readFile(path.join(output, "index.html"), "utf8");
  const result = generatePages(shell, catalog, { base, siteUrl });
  for (const [publicPath, html] of result.pages) {
    // HTTP servers decode URL segments before resolving their filesystem path.
    const relative = decodeURIComponent(publicPath.slice(base.length));
    const destination = path.join(output, relative, "index.html");
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, html);
  }
  await writeFile(path.join(output, "sitemap.xml"), result.sitemap);
  await writeFile(path.join(output, ".nojekyll"), "");
  console.log(`Prerendered ${result.productCount} products; ${result.pages.size} public pages (${catalog.source}).`);
} finally {
  await rm(temporary, { recursive: true, force: true });
}
