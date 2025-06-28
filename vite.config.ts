import { defineConfig, type UserConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import UnoCSS from "unocss/vite";

export default defineConfig({
  plugins: [UnoCSS(), solidPlugin()],
  server: {
    port: 3000,
  },
  build: {
    target: "esnext",
  },
  // https://github.com/andi23rosca/solid-markdown/issues/33
  optimizeDeps: {
    include: ["solid-markdown > micromark", "solid-markdown > unified"],
  },
}) satisfies UserConfig as UserConfig;
