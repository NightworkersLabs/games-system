import type { BigNumber } from 'ethers'

import { CASINO_COIN_NAME } from '#/src/consts'
import { delay } from '#/src/lib/MonitoredPromise'
import type { SEPRunState} from '#/src/lib/SingleExecPromise';
import { SingleExecPromise } from '#/src/lib/SingleExecPromise'
import type { StoreSlice } from '#/src/lib/store/_'
import type { ICasinoBankRulesSlice } from '#/src/lib/store/slices/casino-bank/rules'
import type { IGameSlice } from '#/src/lib/store/slices/game'
import type { IPopupTxSlice } from '#/src/lib/store/slices/popup-tx/handler'
import type { IWeb3Slice } from '#/src/lib/store/slices/web3'

//
export interface ChipConversionResult {
    ts: Date
    howManyChips: number
    destAcc: string
    netEvol: number
}

//
export interface ChipsBalance {
    withdrawable: number
    /** available airdropped chips */
    sluggish: number
}

//
interface ConvertResult {
  balance: ChipsBalance
  /** current state of net balance (total bought - total withdrawed) */
  netEvol: number
}

//
export interface ICasinoBankSlice {
    //
    buyChips: (howMany: number) => void

    //
    latestChipsConversion?: ChipConversionResult
    resetLCCResult: () => void
    convertChips$: SingleExecPromise<number>
    convertChipsRS: SEPRunState

    //
    casinoAuthSignature?: string
    setCasinoAuthSignature: (signature: string) => void
    clearCasinoAuthSignature: () => void
    authenticateForCasino$: SingleExecPromise<void>
    authenticateForCasinoRS: SEPRunState

    //
    chipsBalance?: ChipsBalance
    allChipsBalance?: number
    updateChipsBalance: (newBalance: ChipsBalance) => void

    //
    syncChipsBalance$: SingleExecPromise<void>
    syncChipsBalanceRS: SEPRunState

    //
    casinoBankBalance?: BigNumber
    casinoBankTaxRevenue?: BigNumber
    isCasinoBankUnpaused?: boolean
    updateCasinoBankContext$: SingleExecPromise<void>

    //
    casinoTabIndex: number
    setCasinoTabIndex: (index: number) => void
}

export interface IProtectedCasinoSlice {
    _casinoPOST: <T>(pathSuffix: string, payload?: object) => Promise<T>
}

interface IPrivateSlice {
    //
    _convertChips: (howMany: number) => Promise<void>
    _syncChipsBalance: () => Promise<void>
    _authenticateForCasino: () => Promise<void>

    //
    _updateCasinoBankContext: () => Promise<void>
}

const slice: StoreSlice<
    ICasinoBankSlice & IPrivateSlice & IProtectedCasinoSlice,
    IWeb3Slice & IPopupTxSlice & ICasinoBankRulesSlice & IGameSlice
> = (set, get) => ({
  //
  casinoTabIndex: 0,
  setCasinoTabIndex: casinoTabIndex => set({ casinoTabIndex }),
  //
  buyChips: howMany => get().setupStandardPopupTx({
    description: 'Buy Casino ' + CASINO_COIN_NAME,
    txFunc: () => get().casinoBankContract.buyCasinoChips(get().currentBacklink?.trackerId ?? 0, {
      value: get().getNetCurrencyFromChips(howMany)
    }),
    onSuccess: () => {
      get().syncChipsBalance$.raise()
      get().updateCasinoBankContext$.raise()
    }
  }),
  //
  //
  //
  convertChipsRS: false,
  convertChips$: SingleExecPromise.from(
    n => get()._convertChips(n),
    state => set({ convertChipsRS: state })
  ),
  _convertChips: async howMany => {
    //
    const [chipsBalance] = await Promise.allSettled([
      get()._casinoPOST<ConvertResult>('/convert', { howMuchToConvert: howMany }),
      delay(1_000)
    ])

    //
    if (chipsBalance.status === 'rejected') {
      throw chipsBalance.reason
    }

    //
    get().updateCasinoBankContext$.raise()

    //
    set({
      latestChipsConversion: {
        destAcc: get().currentEOAAddress,
        howManyChips: howMany,
        ts: new Date(),
        netEvol: chipsBalance.value.netEvol
      },
      chipsBalance: chipsBalance.value.balance
    })
  },
  resetLCCResult: () => set({ latestChipsConversion: null }),
  //
  setCasinoAuthSignature: (signature) => set({ casinoAuthSignature: signature }),
  clearCasinoAuthSignature: () => set({
    casinoAuthSignature: null,
    chipsBalance: null
  }),
  //
  //
  //
  authenticateForCasinoRS: false,
  authenticateForCasino$: SingleExecPromise.from(
    () => get()._authenticateForCasino(),
    state => set({ authenticateForCasinoRS: state })
  ),
  _authenticateForCasino: async () => {
    //
    const textToSignResponse = await fetch(
      process.env.NEXT_PUBLIC_SECRET_PROVIDER_URL + '/casino/sign-text'
    )

    //
    if (!textToSignResponse.ok) {
      throw new Error(textToSignResponse.statusText)
    }

    //
    const textToSign = await textToSignResponse.text()

    //
    const casinoAuthSignature = await get().signer.signMessage(textToSign)

    //
    set({ casinoAuthSignature })
  },
  //
  //
  //
  syncChipsBalanceRS: false,
  syncChipsBalance$: SingleExecPromise.from(
    () => get()._syncChipsBalance(),
    state => set({ syncChipsBalanceRS: state })
  ),
  _syncChipsBalance: async () => {
    //
    const [response] = await Promise.allSettled([
      get()._casinoPOST<ChipsBalance>('/balance'),
      delay(500)
    ])

    //
    if (response.status === 'rejected') {
      throw response.reason
    }

    //
    get().updateChipsBalance(response.value)
  },
  updateChipsBalance: newBalance => set({
    chipsBalance: newBalance,
    allChipsBalance: newBalance.sluggish + newBalance.withdrawable
  }),
  //
  //
  //
  _casinoPOST: (pathSuffix, args = {}) => fetch(
    process.env.NEXT_PUBLIC_SECRET_PROVIDER_URL + '/casino' + pathSuffix,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        account: get().currentEOAAddress,
        accSign: get().casinoAuthSignature,
        chainId: get().currentNetwork.chainId,
        ...args
      })
    }
  ).then(res => {
    //
    if (!res.ok) {
      return res.json().then(({ message }) => {
        throw new Error(message ?? res.statusText)
      })
    }

    //
    return res.json()
  }),
  //
  updateCasinoBankContext$: SingleExecPromise.from(() => get()._updateCasinoBankContext()),
  _updateCasinoBankContext: async () => {
    //
    const [
      casinoBankBalance,
      casinoBankTaxRevenue,
      isCasinoPaused
    ] = await Promise.all([
      get().provider.getBalance(get().casinoBankContract.address),
      get().casinoBankContract.taxRevenue() as Promise<BigNumber>,
      get().casinoBankContract.paused() as Promise<boolean>
    ])

    //
    set({
      casinoBankBalance,
      casinoBankTaxRevenue,
      isCasinoBankUnpaused: !isCasinoPaused
    })
  }
})

export default slice
