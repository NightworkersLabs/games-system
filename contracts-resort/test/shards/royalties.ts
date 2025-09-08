import { expect } from 'chai'

import 'test/_context'

export const royalties = () =>
  describe('NFT Royalty fees', function () {
    before(async function () {
      await this.mintOrderer.unchecked()
      const tokenId = await this.nightworkersGame.minted()
      this.buyPrice = 1000
      this.royaltyInfo = await this.nightworkersGame.royaltyInfo(tokenId, this.buyPrice)
    })

    it('should be sent to another contract rather than the minter contract', async function () {
      expect(this.royaltyInfo[0]).to.not.be.equal(0)
      expect(this.royaltyInfo[0]).to.not.be.equal(this.nightworkersGame.address)
    })

    it('should represent 5% of the initial buy price', async function () {
      expect(this.royaltyInfo[1]).to.be.equal(1000 * 0.05)
    })
  })
