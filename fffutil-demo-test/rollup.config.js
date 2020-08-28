import resolve from "@rollup/plugin-node-resolve";

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
];

export default {
  input: "src/index.js",
  output: {
    file: "dist/bundle.js",
    format: "cjs",
  },
  plugins: [resolve()],
};
