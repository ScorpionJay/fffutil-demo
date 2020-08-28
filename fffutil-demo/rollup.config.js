import { terser } from "rollup-plugin-terser";

import json from "rollup-plugin-json";
import { name, version } from "./package.json";

const mode = process.env.NODE_ENV;
const isDev = mode === "development";

const banner = `/*!
 * ${name}.js ${version}
 * Build in ${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}
 */`;

const outputs = [
  {
    file: "dist/index.cjs.js",
    format: "cjs",
  },
  {
    file: "dist/index.es.js",
    format: "es",
  },
  {
    file: "dist/index.umd.js",
    format: "umd",
    name: "fffutil",
  },
].map((item) => {
  !isDev && (item.banner = banner);
  return item;
});

const config = outputs.map((item) => ({
  input: "src/index.js",
  output: item,
  plugins: [
    json(),
    !isDev &&
      terser({
        compress: { warnings: true, drop_console: false, unused: true },
        output: {
          comments: /fffutil/i,
        },
      }),
  ],
}));

export default config;
