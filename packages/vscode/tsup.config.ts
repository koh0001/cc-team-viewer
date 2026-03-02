import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/extension.ts"],
  format: ["cjs"], // VS Code 확장은 CommonJS 필요
  clean: true,
  sourcemap: true,
  external: ["vscode"],
  noExternal: ["@cc-team-viewer/core"], // ESM core를 CJS 번들에 인라인
});
