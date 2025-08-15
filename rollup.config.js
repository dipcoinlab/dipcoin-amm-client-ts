import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";

var rollup_config = [
  {
    input: "src/index.ts",
    output: [
      {
        file: "dist/index.esm.js",
        format: "esm",
        sourcemap: true,
      },
      {
        file: "dist/index.cjs.js",
        format: "cjs",
        sourcemap: true,
        exports: "auto", // ensure CJS exports are correct
      },
      {
        file: "./dist/index.mjs",
        format: "es",
        sourcemap: true,
      },
    ],
    plugins: [
      nodeResolve({
        preferBuiltins: false,
      }),
      commonjs(),
      typescript(),
      terser({
        compress: {
          drop_console: true,
        },
      }),
    ],
  },
];
export { rollup_config as default };
