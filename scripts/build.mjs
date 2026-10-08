import { transformFileAsync } from "@babel/core"
import { mkdir, writeFile } from "node:fs/promises"

// Installed plugins live in node_modules, which the runtime JSX transformer
// skips. Ship reactive Solid output instead of relying on runtime compilation.
const result = await transformFileAsync(new URL("../src/tui.tsx", import.meta.url).pathname, {
  babelrc: false,
  configFile: false,
  presets: [
    ["babel-preset-solid", { generate: "universal", moduleName: "@opentui/solid" }],
    "@babel/preset-typescript",
  ],
  plugins: [() => ({
    visitor: {
      ImportDeclaration(path) {
        if (path.node.source.value === "../rpc") path.node.source.value = "../rpc.ts"
      },
    },
  })],
})
if (!result?.code) throw new Error("TUI compilation produced no output")
await mkdir(new URL("../dist/", import.meta.url), { recursive: true })
await writeFile(new URL("../dist/tui.js", import.meta.url), result.code + "\n")
