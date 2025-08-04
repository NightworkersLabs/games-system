import { useNWStore } from 'lib/store/main'
import { isBasicPopupTx } from 'lib/store/slices/popup-tx/handler'
import shallow from 'zustand/shallow'
import BasicPopupTxModal from './Basic'
import PopupTxModalTracker from './PopupTxModalTracker'
import SecurePopupTxModal from './Secure'

export default function PopupTxModal () {
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
    <>
      { isPopupTxVisible === true && currentPopupTx != null && (
        isBasicPopupTx(currentPopupTx)
          ? <BasicPopupTxModal popupTx={currentPopupTx} />
          : <SecurePopupTxModal popupTx={currentPopupTx} />
      )}
      {isPopupTxVisible === false && currentPopupTx != null &&
                <PopupTxModalTracker popupTx={currentPopupTx} />
      }
    </>
  )
}
