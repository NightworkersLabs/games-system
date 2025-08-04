/* eslint-disable camelcase */
import type { NextApiRequest, NextApiResponse } from 'next'

import assetsNames from 'public/resources/nft-assets/name.json'

const NOTORIETY_SCORES = [8, 7, 6, 5]

enum CommonTraitsTypes {
    'Body',
    'Attire',
    'Hair',
    'Face',
    'Eyes',
    'Headgear',
    'Mouth',
    'Notoriety'
}

interface ERC721MetadataAttribute {
    trait_type: string
    value: string | number
    display_type?: string
}

export interface ERC721Metadata {
    description: string
    image: string
    name: string,
    attributes: ERC721MetadataAttribute[]
}

export abstract class NWERC721LightMetadata {
  tokenId: number
  isHooker: boolean
  generation: number
  nScore?: number
}

export interface NWERC721GameMetadata extends NWERC721LightMetadata {
    name: string
    image_url: string
}

class NWERC721Metadata extends NWERC721LightMetadata {
  //
  indices: number[] = []

  //
  typeMA: ERC721MetadataAttribute
  generationMA: ERC721MetadataAttribute
  commonTraitsMA: ERC721MetadataAttribute[] = []
  notorietyMA?: ERC721MetadataAttribute
  notorietyScoreMA?: ERC721MetadataAttribute

  //
  //
  //

  private static _separator = '-'
  private static _unknown = '*UNKNOWN*'

  private static _safeCastToInt (toCast: string, attrName: string) {
    //
    const casted = parseInt(toCast)

    //
    if (isNaN(casted)) {
      throw new Error(`Attribute "${attrName}" missing from URI !`)
    }

    //
    return casted
  }

  //
  //
  //

  private _setTokenId (splitted: string[], i: number) {
    this.tokenId = NWERC721Metadata._safeCastToInt(splitted[i], 'Token ID')
  }

  private _setIsHooker (splitted: string[], i: number) {
    const attr = 'Type'
    const casted = NWERC721Metadata._safeCastToInt(splitted[i], attr)

    //
    this.isHooker = !casted
    this.typeMA = {
      trait_type: attr,
      value: this.isHooker ? 'Hooker' : 'Pimp'
    }
  }

  private _setGeneration (splitted: string[], i: number) {
    const attr = 'Generation'
    this.generation = NWERC721Metadata._safeCastToInt(splitted[i], attr)
    this.generationMA = {
      trait_type: attr,
      value: this.generation
    }
  }

  private _setCommonTraits (splitted: string[], index: number) : number {
    //
    const cttCount = Object.keys(CommonTraitsTypes).length / 2 - (this.isHooker ? 1 : 0)

    //
    let i = 0
    for (i; i < cttCount; i++) {
      //
      const attr = CommonTraitsTypes[i]
      const assetId = NWERC721Metadata._safeCastToInt(splitted[index + i], attr)

      //
      this.indices.push(assetId)

      //
      this.commonTraitsMA.push({
        trait_type: attr,
        value: assetsNames[this.isHooker ? 0 : 1][i][assetId] || NWERC721Metadata._unknown
      })
    }

    //
    return i - 1 + index
  }

  private _setNotorietyScore (splitted: string[], i: number) {
    const attr = 'Notoriety Score'
    this.nScore = NOTORIETY_SCORES[NWERC721Metadata._safeCastToInt(splitted[i], attr)]
    this.notorietyScoreMA = {
      trait_type: attr,
      value: this.nScore || NWERC721Metadata._unknown
    }
  }

  //
  //
  //

  constructor (compiledMetadataAsStr: string) {
    super()
    //
    const splitted = compiledMetadataAsStr.split(NWERC721Metadata._separator)
    let i = -1

    //
    this._setTokenId(splitted, ++i)
    this._setIsHooker(splitted, ++i)
    this._setGeneration(splitted, ++i)

    //
    i = this._setCommonTraits(splitted, ++i)

    //
    if (!this.isHooker) {
      this._setNotorietyScore(splitted, i)
    }
  }

  //
  //
  //

  public getAttributes () : ERC721MetadataAttribute[] {
    return [
      this.typeMA,
      this.generationMA,
      ...this.commonTraitsMA,
      ...(this.notorietyScoreMA != null ? [this.notorietyScoreMA] : [])
    ]
  }
}

//
//
//

const expectedScheme = process.env.NODE_ENV === 'development' ? 'http' : 'https'

//
//
//

function _buildTokenSVG (host: string, tokenMetadata: NWERC721Metadata) : string {
  let svg = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" image-rendering="pixelated" viewBox="0 0 350 350">'

  for (let i = 0; i < tokenMetadata.commonTraitsMA.length; i++) {
    const url = _getSvgShardAsPngURI(
      host,
      i + 1,
      tokenMetadata.typeMA.value.toString(),
      tokenMetadata.commonTraitsMA[i],
      tokenMetadata.indices[i]
    )
    svg += `<image height="100%" xlink:href="${url}" />`
  }

  svg += '</svg>'

  //
  return svg
}

function _getSvgShardAsPngURI (host: string, assetIndex: number, typeStr: string, attribute: ERC721MetadataAttribute, indice: number) {
  return `${expectedScheme}://${host}/resources/nft-assets/${typeStr.toLowerCase()}/${assetIndex}_${attribute.trait_type.toLowerCase()}/${__getAssetFilename(attribute, indice)}`
}

function __getAssetFilename (attribute: ERC721MetadataAttribute, indice: number) {
  return `${indice + 1}_${attribute.value.toString().replace(/ /g, () => '-')}.png`
}

function _getSVGUrl (req: NextApiRequest) {
  return `${expectedScheme}://${req.headers.host}${req.url}&svg`
}

//
//
//

function answerWithTokenMetadata (req: NextApiRequest, res: NextApiResponse<ERC721Metadata>, tokenMetadata: NWERC721Metadata) {
  return res.status(200).json({
    name: tokenMetadata.typeMA.value + ' #' + tokenMetadata.tokenId,
    description: 'Night Workers is a play-to-earn NFT game forked from the popular Police and Thief game. ' +
        'As its model, It incorporates probability-based NFT derivatives, with the same well-known engaging and exciting features. ' +
        'This time, it is Hookers vs Pimps : which side are you on ? Richness is now at every street corner !',
    image: _getSVGUrl(req),
    attributes: tokenMetadata.getAttributes()
  })
}

function answerWithTokenSVG (req: NextApiRequest, res: NextApiResponse<ERC721Metadata>, tokenMetadata: NWERC721Metadata) {
  const w = res.status(200)
  if (req.query.raw === undefined) {
    w.setHeader('Content-Type', 'image/svg+xml')
  }
  w.write(_buildTokenSVG(req.headers.host, tokenMetadata))
  w.end()
}

function answerWithGameTokenMetadata (req: NextApiRequest, res: NextApiResponse<ERC721Metadata>, tokenMetadata: NWERC721Metadata) {
  const w = res.status(200)
  w.write(JSON.stringify({
    generation: tokenMetadata.generation,
    isHooker: tokenMetadata.isHooker,
    tokenId: tokenMetadata.tokenId,
    nScore: tokenMetadata.nScore,
    name: tokenMetadata.typeMA.value + ' #' + tokenMetadata.tokenId,
    image_url: _getSVGUrl(req)
  } as NWERC721GameMetadata))
  w.end()
}

//
//
//

export default function handler (req: NextApiRequest, res: NextApiResponse<ERC721Metadata>) {
  //
  const metadataStr = req.query.md
  if (metadataStr == null || metadataStr.length === 0 || !(typeof metadataStr === 'string')) {
    return res.status(500).end()
  }

  //
  try {
    //
    const nwMetadata = new NWERC721Metadata(metadataStr)

    //
    if (req.query.svg !== undefined) {
      return answerWithTokenSVG(req, res, nwMetadata)
    } else if (req.query.g !== undefined) {
      return answerWithGameTokenMetadata(req, res, nwMetadata)
    } else {
      return answerWithTokenMetadata(req, res, nwMetadata)
    }
  } catch (e) {
    const w = res.status(500)
    w.write(e.toString())
    w.end()
  }
}
