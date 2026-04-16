import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** SVG splash / bridge — nằm trong repo (deploy Vercel chỉ thư mục thiep-react) */
const thiepDir = path.resolve(__dirname, "src/assets/thiep");
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@thiep": thiepDir,
    },
  },
});
