// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `pnpm exec hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
// import "./_context";

import { ethers } from 'hardhat'

async function main () {
  _checkPimpHookerRepartition()
  _checHookerNotorietyRepartition()
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

function _checkPimpHookerRepartition () {
  console.log('== following should be around 10% >>')

  //
  for (let y = 0; y < 10; y++) {
    const rounds = 50_000
    const rand = ethers.utils.randomBytes(rounds)
    let w = 0
    for (let i = 0; i < rounds; i++) {
      if (rand[i] % 10 !== 0) continue
      w++
    }

    console.log(' - ', (w / rounds * 100).toFixed(2), '%')
  }
}

function _checHookerNotorietyRepartition () {
  console.log('== following should be around 5%, 15%, 30%, 50% >>')

  //
  for (let y = 0; y < 10; y++) {
    const rounds = 50_000
    const rand = ethers.utils.randomBytes(rounds)

    let veryRare = 0
    let rare = 0
    let uncommon = 0
    let common = 0

    for (let i = 0; i < rounds; i++) {
      const m_ = rand[i] % 100

      //
      if (m_ >= 93) { // top 5 percent
        veryRare++
      } else if (m_ >= 74) { // top 20 percent
        rare++
      } else if (m_ >= 42) { // top 5O percent
        uncommon++
      } else {
        common++
      }
    }

    console.log(' - ',
      (veryRare / rounds * 100).toFixed(2), '%',
      (rare / rounds * 100).toFixed(2), '%',
      (uncommon / rounds * 100).toFixed(2), '%',
      (common / rounds * 100).toFixed(2), '%'
    )
  }
}
