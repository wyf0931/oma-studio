import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import legacy from "@vitejs/plugin-legacy";
import browserslist from "browserslist";
import { browserslistToTargets } from "lightningcss";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));
const targets = browserslist.loadConfig({ path: projectRoot });

export default defineConfig({
  root: "frontend",
  publicDir: "../static",
  base: "/static/",
  plugins: [
    tailwindcss(),
    legacy({
      modernTargets: targets,
      modernPolyfills: true,
      renderLegacyChunks: false,
    }),
  ],
  css: {
    transformer: "lightningcss",
    lightningcss: { targets: browserslistToTargets(browserslist(targets)) },
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    cssMinify: "lightningcss",
    manifest: true,
  },
});
