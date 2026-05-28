import { defineConfig } from "vite";
import uniPlugin from "@dcloudio/vite-plugin-uni";
import { resolve } from "node:path";

const uni = uniPlugin.default ?? uniPlugin;

export default defineConfig({
  envDir: resolve(__dirname, "../.."),
  plugins: [uni()]
});
