import { writeJSONSync } from 'fs-extra'
import { getCompiledNetworkInfos } from './networksCompiler'

import { EOL } from 'os'

const compiledFilePath = './networks.compiled.json'

//
function compileNetworks () {
  // get compiled infos
  const compiled = getCompiledNetworkInfos()

  // overrides compiled networks JSON
  writeJSONSync(
    compiledFilePath,
    compiled, {
      spaces: 2,
      EOL
    }
  )

  // log
  console.log(`== Generated [${compiledFilePath}] with =>`, compiled)
}

// run script when invoked
compileNetworks()
