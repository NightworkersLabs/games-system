import _backlinks from '#/config/backlink_references'
import type { AvailableNetwork } from '#/contrib/networksCompiler'

//
export type BacklinkTracker = keyof typeof _backlinks

//
export interface BacklinkReferenceBase {
    /** representative of a sponsor / a tracking context. Should be specifically unique in the blockchain */
    trackerId: number
    /** light description of the sponsor / tracking context */
    dashboardDescription: string
    /** determines whenever we have to make a logo of the sponsor appear on the dApp, with full-fledge labels and "X / featuring" advertisement */
    sponsorIsComprehensive?: boolean
    /** social link */
    hyperlink?: string
    /** pick between any handled named network as default network when any user uses its backlink */
    preferredNetwork?: AvailableNetwork
    /** defaults to .png */
    imgExt?: string
}

//
export type BacklinksDefinition = {
  [uniqueName in BacklinkTracker]: BacklinkReferenceBase
}

//
//
//

//
export interface WithDashboardName {
  /** lower-case, url-path compatible name. Determines dashboard url and logo location in source files */
  uniqueDashboardName: BacklinkTracker
}

//
export type BacklinkReference = WithDashboardName & BacklinkReferenceBase

//
export type BacklinkStorage = {
    [uniqueName in BacklinkTracker]: BacklinkReference
}

//
const defaultBacklinkStorage = Object.entries(_backlinks).reduce(
  (output, [uniqueDashboardName, backlinkRef]) => {
    //
    output[uniqueDashboardName] = {
      ...backlinkRef,
      uniqueDashboardName
    }

    //
    return output
  //
  }, {} as BacklinkStorage
)

//
export default defaultBacklinkStorage
