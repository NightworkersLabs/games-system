import { useNWStore } from 'lib/store/main'

import App from 'components/App'

import { useEffect, useState } from 'react'

import Disclaimer from './App/Disclaimer'

import { motion, AnimatePresence } from 'framer-motion'

//
export default function NWEntryPoint (props: {
    isStoreCompatible: boolean
}) {
  //
  const initiateWeb3 = useNWStore(s => s.initiateWeb3)

  const [validatedDisclaimer, setValidatedDisclaimer] = useState<boolean>(false)

  //
  useEffect(() => {
    const isDisclaimerValidated = sessionStorage.getItem('validatedDisclaimer')
    setValidatedDisclaimer(isDisclaimerValidated != null)
    //
  }, [])

  //
  useEffect(() => {
    //
    if (!validatedDisclaimer) return

    //
    return initiateWeb3()
    //
  }, [initiateWeb3, validatedDisclaimer])

  //
  return (
    <AnimatePresence exitBeforeEnter>
      <motion.div
        style={!validatedDisclaimer ? { display: 'flex', flex: 1, justifyContent: 'center' } : { flex: 1 }}
        key={validatedDisclaimer ? 'app' : 'disclaimer'}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.33 }}
        exit={{ opacity: 0 }}
      >
        {validatedDisclaimer
          ? <App isStoreCompatible={props.isStoreCompatible} />
          : <Disclaimer validate={() => {
            sessionStorage.setItem('validatedDisclaimer', 'true')
            setValidatedDisclaimer(true)
          }} />
        }</motion.div>
    </AnimatePresence>
  )
}
