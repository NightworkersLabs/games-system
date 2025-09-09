// build.js
import { build } from "esbuild";
import { nodeExternalsPlugin } from "esbuild-node-externals";
import { copy } from "esbuild-plugin-copy";

const scripts = {
  server: "./src/scripts/server.ts",
  "data-explorer": "./src/scripts/data-explorer.ts",
  scraper: "./src/scripts/scraper.ts",
  bts: "./src/scripts/_bts.ts",
};

/**
 * @typedef {import('esbuild').BuildOptions} BuildOptions
 */

/**
 * @type {BuildOptions}
 */
const optionsBase = (folderName) => ({
  bundle: true,
  sourcemap: true,
  platform: "node",
  outfile: `./dist/${folderName}/index.js`,
  minify: false,
  plugins: [
    nodeExternalsPlugin(),
    copy({
      assets: [
        {
          from: ["./abi/*"],
          to: ["./abi"],
        },
        {
          from: ["./src/prisma/client/libquery*"],
          to: [".."],
        },
      ],
    }),
  ],
  format: "cjs",
  target: ["node22"], // Adjust as per your Node.js version
});

await Promise.allSettled(
  Object.entries(scripts).map(async ([script, path]) => {
    build({
      ...optionsBase(script),
      entryPoints: [path],
    });
  }),
);
