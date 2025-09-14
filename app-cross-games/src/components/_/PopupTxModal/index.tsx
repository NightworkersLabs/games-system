import shallow from 'zustand/shallow'

import BasicPopupTxModal from '#/src/components/_/PopupTxModal/Basic'
import PopupTxModalTracker from '#/src/components/_/PopupTxModal/PopupTxModalTracker'
import SecurePopupTxModal from '#/src/components/_/PopupTxModal/Secure'
import { useNWStore } from '#/src/lib/store/main'
import { isBasicPopupTx } from '#/src/lib/store/slices/popup-tx/handler'

const PopupTxModal = () => {
  //
  const {
    isPopupTxVisible,
    currentPopupTx
  } = useNWStore(s => ({
    isPopupTxVisible: s.isPopupTxVisible,
    currentPopupTx: s.currentPopupTx
  }), shallow)

  //
  return (
    currentPopupTx == null
      ? <></>
      : (
        isPopupTxVisible === false
          ? <PopupTxModalTracker popupTx={currentPopupTx} />
          : (
            isBasicPopupTx(currentPopupTx)
              ? <BasicPopupTxModal popupTx={currentPopupTx} />
              : <SecurePopupTxModal popupTx={currentPopupTx} />
          )
      )
  )
}

export default PopupTxModal; 
