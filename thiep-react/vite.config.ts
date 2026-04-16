import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Thư mục chứa 1.svg … 8.svg (cùng cấp với thiep-react) */
const thiepDir = path.resolve(__dirname, "../Thiệp cưới");
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@thiep": thiepDir,
    },
  },
  server: {
    fs: {
      allow: [path.resolve(__dirname, "..")],
    },
  },
});
