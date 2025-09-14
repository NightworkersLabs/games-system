import { writeJSONSync } from 'fs-extra'
import { EOL } from 'os'

import { getCompiledNetworkInfos } from '#/contrib/networksCompiler'

const compiledFilePath = './config/networks.compiled.json'

//
const compileNetworks = () => {
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
