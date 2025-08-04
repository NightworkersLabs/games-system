/* eslint-disable no-unused-expressions */
import 'test/_context'

import { expect } from 'chai'
import { parse } from 'svg-parser'

import { NFTMetadata } from 'scripts/deploy/framework/NFTMetadata'

export const tokenMetadata = () =>
  describe('Token Metadata', () => {
    before(async function () {
      //
      await this.mintOrderer.unchecked()

      //
      const latestMintedToken = await this.nightworkersGame.minted()
      const nftMetadata = await this.nightworkersGame.tokenURI(latestMintedToken)
      this.mintedNFT = new NFTMetadata(nftMetadata)
      this.mintedNFT.outputAsSVG()
      this.mintedNFT.outputAsJSON()
    })

    it('should have description', function () {
      expect(this.mintedNFT.description).to.not.be.empty
      expect(this.mintedNFT.description.length).to.equals(326)
    })

    it('should have a name with token count', function () {
      //
      const name: string = this.mintedNFT.name
      expect(name).to.not.be.empty

      //
      const idIndex = name.indexOf('#')
      expect(idIndex).to.not.be.lessThan(0)

      //
      const tokenIdStr = name.substring(idIndex + 1)
      expect(parseInt(tokenIdStr)).to.not.be.NaN
    })

    it('should have correct number of filled attributes', function () {
      const attributes: object = this.mintedNFT.attributes
      expect(attributes).to.not.be.empty

      let tokenType: string
      for (const attribute of Object.entries(attributes)) {
        //
        const tt = attribute[1].trait_type
        const v = attribute[1].value

        //
        expect(tt).to.not.be.empty
        expect(v).to.not.be.empty

        //
        if (tt === 'Type') tokenType = v
      }

      expect(tokenType).to.not.be.empty
      expect(tokenType).to.be.oneOf(['Hooker', 'Pimp'])

      const expectedAttributesCount = tokenType === 'Hooker' ? 9 : 11
      expect(attributes).to.be.lengthOf(expectedAttributesCount)
    })

    it('should have correctly formated SVG Image', function () {
      const imageAsSVG = this.mintedNFT.getSVG()
      expect(imageAsSVG).to.not.be.empty

      //
      const xmlContent = parse(imageAsSVG)
      expect(xmlContent.children.length).to.equals(1)
      expect(xmlContent.children[0].children.length).to.be.greaterThanOrEqual(7)

      //
      for (const img of xmlContent.children[0].children) {
        const pngImage = img.properties['xlink:href']
        expect(pngImage.length).to.be.greaterThan(22)
      }
    })
  })
