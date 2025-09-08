import {
  Flex,
  Button,
  Text
} from '@chakra-ui/react'
import { useMemo } from 'react'

import { useNWStore } from 'lib/store/main'
import shallow from 'zustand/shallow'

//
export default function MintButton () {
  //
  const {
    discountedMintsLeft,
    publicLaunch,
    whitelistLaunch,
    howManyToMint,
    mintingPaused,
    maxMintableNFTs,
    howManyMinted,
    freeMintsLeft,
    setHowManyToMint,
    secureMint
  } = useNWStore(s => ({
    discountedMintsLeft: s.discountedMintsLeft,
    publicLaunch: s.publicLaunch,
    whitelistLaunch: s.whitelistLaunch,
    howManyToMint: s.howManyToMint,
    mintingPaused: s.mintingPaused,
    maxMintableNFTs: s.maxMintableNFTs,
    howManyMinted: s.howManyMinted,
    freeMintsLeft: s.freeMintsLeft,
    setHowManyToMint: s.setHowManyToMint,
    secureMint: s.secureMint
  }), shallow)

  //
  const canMint = useMemo(() => {
    if (mintingPaused) {
      return false
    }
    if (howManyMinted >= maxMintableNFTs) {
      return false
    }
    if (whitelistLaunch) {
      return discountedMintsLeft > 0 || freeMintsLeft > 0
    } else {
      return publicLaunch ?? false
    }
  }, [
    discountedMintsLeft,
    freeMintsLeft,
    howManyMinted,
    maxMintableNFTs,
    mintingPaused,
    publicLaunch,
    whitelistLaunch
  ])

  //
  return (
    <Flex direction="column" className="pixelFont">
      <Flex justify="center" align="center" w="max" mx="auto">
        <Button
          isDisabled={!canMint}
          variant="unstyled"
          onClick={() => setHowManyToMint(howManyToMint + 1)}
        >+</Button>
        <Text>{howManyToMint}</Text>
        <Button
          isDisabled={!canMint}
          variant="unstyled"
          onClick={() => setHowManyToMint(howManyToMint - 1)}
        >-</Button>
      </Flex>
      <Button
        size='md'
        variant='glowing'
        onClick={secureMint}
        isDisabled={!canMint}
      >
          MINT !
      </Button>
    </Flex>
  )
}
