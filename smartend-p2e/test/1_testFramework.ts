import './_context'

import { expect } from 'chai'
import { TraitsPack } from 'nft-assets/read'

//
// FRAMEWORK
//

export const testFramework = () =>
  describe('Test framework', () => {
    describe('Assets Packer', () => {
      function _testingContiguousTraitsTypes (packs: TraitsPack[]) {
        let i = 0
        packs.forEach(e => {
          expect(e.traitTypeIndex).to.be.equal(i)
          i++
        })
      }
      function _testingContiguousAssetsIndices (packs: TraitsPack[]) {
        packs.forEach(p => {
          let i = 0
          p.assetsIndices.forEach(e => {
            expect(e).to.be.equal(i)
            const assetIndex = p.traits[e].assetIndex
            expect(assetIndex).to.be.equal(i)
            i++
          })
        })
      }

      it('should not have more than 256 assets by trait type', function () {
        this.nwContext.nftAssets.forEach(e => {
          expect(e.traits.length).to.be.lessThanOrEqual(256)
        })
      })

      it('should not produce asset names which are untrimmed, containing double spaces, "_", "." or "-" characters', function () {
        this.nwContext.nftAssets.forEach(e => {
          e.traits.forEach(i => {
            expect(i.assetName).to.not.contain('_')
            expect(i.assetName).to.not.contain('-')
            expect(i.assetName).to.not.contain('  ')
            expect(i.assetName).to.not.contain('.')
            expect(i.assetName[0]).to.not.equal(' ')
            expect(i.assetName[i.assetName.length - 1]).to.not.equal(' ')
          })
        })
      })

      describe('For Hookers', () => {
        before(async function () {
          this.hookerAssets = this.nwContext.nftAssets.filter(e => e.isHooker)
        })

        it('should have contiguous trait types values', function () {
          _testingContiguousTraitsTypes(this.hookerAssets)
        })

        it('should have contiguous assets indices', function () {
          _testingContiguousAssetsIndices(this.hookerAssets)
        })

        it('should have 7 traits types', function () {
          expect(this.hookerAssets.length).to.be.equal(7)
        })
      })

      describe('For Pimps', () => {
        before(async function () {
          this.pimpAssets = this.nwContext.nftAssets.filter(e => !e.isHooker)
        })

        it('should have contiguous trait types values', function () {
          _testingContiguousTraitsTypes(this.pimpAssets)
        })

        it('should have contiguous assets indices', function () {
          _testingContiguousAssetsIndices(this.pimpAssets)
        })

        it('should have 8 traits types', function () {
          expect(this.pimpAssets.length).to.be.equal(8)
        })
      })
    })
  })
