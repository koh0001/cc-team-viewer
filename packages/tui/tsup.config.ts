import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.tsx"],
  format: ["esm"],
  clean: true,
  sourcemap: true,
  // ink/React JSX 지원
  esbuildOptions(options) {
    options.jsx = "automatic";
  },
  banner: {
    js: "#!/usr/bin/env node",
  },
});
