import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  build: {
    target: ["chrome111", "firefox128", "safari16.4"],
    rollupOptions: { input: { main: "index.html", about: "about.html" } },
  },
});
