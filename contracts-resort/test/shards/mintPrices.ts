import 'test/_context'

import { expect } from 'chai'

import { parseEther } from 'ethers/lib/utils'

export const mintPrices = () =>
  describe('Default mint price', () => {
    describe('Gen 0', function () {
      it('should have correct initial default price (1.5 AVAX)', async function () {
        expect(this.payableMintPrice.base).to.eq(parseEther('1.5'))
      })

      it('should have correct initial whitelisted mint price (-20%, 1.2 AVAX)', async function () {
        expect(this.payableMintPrice.wl).to.eq(parseEther('1.2'))
      })

      it('should have correct initial scarce mint price (+20%, 1.8 AVAX)', async function () {
        expect(this.payableMintPrice.scarce).to.eq(parseEther('1.8'))
      })
    })

    describe('Gen 1+', () => {
      it('should have no $LOLLY cost until Gen1 (first 10k)', async function () {
        const payableMintPrice = await this.nightworkersGame.lollyMintCostOf(10_000)
        expect(payableMintPrice).to.eq(parseEther('0'))
      })

      it('should have 20k $LOLLY cost below 40% of pool (< 20k)', async function () {
        const expected = parseEther('20000')
        expect(await this.nightworkersGame.lollyMintCostOf(10_001)).to.eq(expected)
        expect(await this.nightworkersGame.lollyMintCostOf(20_000)).to.eq(expected)
      })

      it('should have 40k $LOLLY cost below 80% of pool (<= 40k)', async function () {
        const expected = parseEther('40000')
        expect(await this.nightworkersGame.lollyMintCostOf(20_001)).to.eq(expected)
        expect(await this.nightworkersGame.lollyMintCostOf(40_000)).to.eq(expected)
      })

      it('should have 80k $LOLLY cost above 80% of pool (> 40k)', async function () {
        const expected = parseEther('60000')
        expect(await this.nightworkersGame.lollyMintCostOf(40_001)).to.eq(expected)
        expect(await this.nightworkersGame.lollyMintCostOf(50_000)).to.eq(expected)
      })

      it('should NOT get a price for a token over 50k limit', async function () {
        await expect(this.nightworkersGame.lollyMintCostOf(50_001)).to.be.revertedWith('token out of bonds')
      })
    })
  })
