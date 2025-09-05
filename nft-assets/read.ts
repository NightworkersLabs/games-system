import { readdirSync, readFileSync } from 'fs'

interface BaseNFT {
    isHooker?: boolean
    traitTypeIndex?: number
}

interface Trait {
    assetIndex?: number
    assetName?: string
    assetData?: Buffer
}

interface ReadNFTAsset extends Trait, BaseNFT {
    path?: string
}

export interface TraitsPack extends BaseNFT {
    assetsIndices?: number[]
    traits?: Trait[]
}

function _readDirNightworkers (basePath: string) : ReadNFTAsset[] {
  return readdirSync(basePath, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && dirent.name !== '.git')
    .map<ReadNFTAsset>(dirent => {
      return {
        path: basePath + '/' + dirent.name,
        isHooker: dirent.name === 'hooker'
      }
    })
}

function _readTraitsTypes (nftFolder: ReadNFTAsset): ReadNFTAsset[] {
  return readdirSync(nftFolder.path, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && dirent.name !== '.git')
    .map<ReadNFTAsset>(dirent => {
      return {
        path: nftFolder.path + '/' + dirent.name,
        isHooker: nftFolder.isHooker,
        traitTypeIndex: _getIndexFromDirName(dirent.name)
      }
    })
    .sort((a, b) => a.traitTypeIndex - b.traitTypeIndex)
}

function _getIndexFromDirName (dirname: string) {
  return Number(dirname.substring(0, dirname.indexOf('_'))) - 1
}

function _readAssets (traitFolder: ReadNFTAsset): ReadNFTAsset[] {
  return readdirSync(traitFolder.path, { withFileTypes: true })
    .filter(dirent => dirent.isFile())
    .map<ReadNFTAsset>(dirent => {
      const fp = traitFolder.path + '/' + dirent.name
      return {
        path: fp,
        isHooker: traitFolder.isHooker,
        traitTypeIndex: traitFolder.traitTypeIndex,
        assetName: dirent.name
          .substring(0, dirent.name.lastIndexOf('.'))
          .substring(dirent.name.indexOf('_') + 1)
          .split('-')
          .join(' '),
        assetData: readFileSync(fp),
        assetIndex: _getIndexFromDirName(dirent.name)
      }
    })
}

export function _readTraitsTypesFlat (directoryToRead: string) : ReadNFTAsset[] {
  return _readDirNightworkers(directoryToRead)
    .flatMap(_readTraitsTypes)
}

export function produceNamesArrayFrom (traitsPacks: TraitsPack[]) : any[] {
  //
  const output = [[], []]

  //
  for (const pack of traitsPacks) {
    output[pack.isHooker ? 0 : 1].push(
      pack.traits.map(e => e.assetName)
    )
  }

  //
  return output
}

export function readNFTAssetsRepositoryFlat (directoryToRead: string) : ReadNFTAsset[] {
  return _readTraitsTypesFlat(directoryToRead)
    .flatMap(_readAssets)
}

export function readNFTAssetsRepositoryPacker (directoryToRead: string) : TraitsPack[] {
  return _readTraitsTypesFlat(directoryToRead)
    .map<TraitsPack>(e => {
      //
      const assets = _readAssets(e)
      //
      return {
        isHooker: e.isHooker,
        traitTypeIndex: e.traitTypeIndex,
        assetsIndices: assets
          .map(e => e.assetIndex)
          .sort((a, b) => a - b),
        traits: assets.map(e => {
          return {
            assetIndex: e.assetIndex,
            assetName: e.assetName,
            assetData: e.assetData
          }
        })
          .sort((a, b) => a.assetIndex - b.assetIndex)
      }
    })
}
