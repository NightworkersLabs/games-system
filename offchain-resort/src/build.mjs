// build.js
import { build } from 'esbuild'
import { nodeExternalsPlugin } from 'esbuild-node-externals'
import { copy } from 'esbuild-plugin-copy'

build({
  entryPoints: ['./src/server.ts'],
  bundle: true,
  sourcemap: true,
  platform: 'node',
  outfile: './dist/index.js',
  minify: false,
  plugins: [
    nodeExternalsPlugin(),
    copy({
      assets: {
        from: ['./abi/*'],
        to: ['./abi']
      }
    })
  ],
  format: 'esm',
  target: ['node22'] // Adjust as per your Node.js version
}).catch(() => process.exit(1))
