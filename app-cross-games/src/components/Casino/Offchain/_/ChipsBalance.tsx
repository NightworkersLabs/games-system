import { motion, useAnimation } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import shallow from 'zustand/shallow'

import { Flex, Image,Text, Tooltip } from '@chakra-ui/react'
import { faRotate, faWarning } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { CASINO_COIN_NAME } from '#/src/consts'
import { useNWStore } from '#/src/lib/store/main'

const usePrevious = <T,>(value: T): T | undefined => {
  const ref = useRef<T>(null)
  useEffect(() => {
    ref.current = value
  })
  return ref.current
}

const ChipsBalance = (props: {
    isFullMode?: boolean
}) => {
  //
  const allChipsBalance = useNWStore(s => s.allChipsBalance)

  //
  return (
    <Flex
      alignSelf='center' alignItems='center' position='relative'
      gap='2' px='3' py='1' zIndex='3'
      backgroundColor='#00000066' borderTopRadius='5px'
      fontSize={props.isFullMode ? '1.1rem' : '1rem'}
    >
      <Flex top='-.3rem' left='0' right='0' margin='auto' gap='1'
        position='absolute' textAlign='center' alignItems='center' justifyContent='center' fontSize='.4em'
        zIndex='2'
      >
        <Text color='#ffc95e' textShadow='1px 1px 0px #a84b1c' className='pixelFont'>{props.isFullMode && 'My '}{CASINO_COIN_NAME}</Text>
      </Flex>
      <motion.div
        variants={{
          ok: {
            color: '#FFF',
            transform: 'scale(1)'
          },
          emptyBalance: {
            color: ['rgba(255,255,255,255)', '#fb7fbe'],
            transform: ['scale(1)', 'scale(1.03)'],
            transition: {
              duration: 1,
              repeat: Infinity,
              ease: 'circOut',
              repeatType: 'reverse'
            }
          }
        }}
        initial='ok'
        animate={allChipsBalance === 0 ? 'emptyBalance' : 'ok'}
      >
        <BalanceDisplay explicitMode={props.isFullMode} />
      </motion.div>
      {props.isFullMode && <RefreshBalanceButton />}
    </Flex>
  )
}

//
const BalanceDisplay = (props: {
    explicitMode: boolean
}) => {
  //
  const {
    chipsBalance,
    syncChipsBalance$
  } = useNWStore(s => ({
    chipsBalance: s.chipsBalance,
    syncChipsBalance$: s.syncChipsBalance$
  }), shallow)

  // auto-update chips balance
  useEffect(() => {
    if (chipsBalance == null) {
      syncChipsBalance$.raise()
    }
  }, [chipsBalance, syncChipsBalance$])

  //
  return (
    <Flex gap='3' alignItems='center' p='.25em'>
      <Flex gap='1' direction={props.explicitMode ? 'column-reverse' : 'row'}>
        <MiniBalanceDisplay balanceValue={chipsBalance?.withdrawable} descr={props.explicitMode && 'classic'} />
        <MiniBalanceDisplay balanceValue={chipsBalance?.sluggish} descr={props.explicitMode && 'slugs'} hueRotateDeg={180} />
      </Flex>
    </Flex>
  )
}

//
const MiniBalanceDisplay = (props: {
    balanceValue: number,
    descr?: string,
    hueRotateDeg?: number
}) => {
  //
  const running = useNWStore(s => s.syncChipsBalanceRS)

  //
  const previousBalance = usePrevious(props.balanceValue)

  //
  const controls = useAnimation()

  //
  const [balanceChange, setBalanceChange] = useState<number>(0)

  //
  useEffect(() => {
    //
    if (previousBalance == null) return

    //
    setBalanceChange(props.balanceValue - previousBalance)

    //
    controls.start('moving')

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.balanceValue])

  //
  return (
    <Flex alignItems='center' gap='2' fontSize='.8rem'>
      <Image
        src='/resources/casino/CHIP_14.png'
        boxSize='.9em'
        alt={props.descr + ' ' + CASINO_COIN_NAME}
        filter={props.hueRotateDeg ? `hue-rotate(${props.hueRotateDeg}deg)` : null}
      />
      <Flex position='relative'>
        <motion.div
          style={{
            position: 'absolute',
            fontWeight: 'bold',
            textShadow: '1px 1px 0px #3b0a0a',
            right: 0,
            color: balanceChange >= 0 ? '#2fe52f' : '#ca2424'
          }}
          animate={controls}
          initial='idle'
          variants={{
            idle: {
              opacity: 0
            },
            moving: {
              opacity: [1, 0],
              y: [0, 30]
            }
          }}
          transition={{
            ease: 'easeOut',
            duration: 0.66
          }}
        >{balanceChange >= 0 && '+'}{balanceChange}</motion.div>
        <Text fontWeight='bold' textAlign='right'>{
          running === true
            ? '---'
            : (props.balanceValue ?? '---')
        }</Text>
      </Flex>
      {props.descr &&
                <Text fontStyle='italic' fontSize='.6rem' flex='1' textAlign='right'
                >{props.descr}</Text>}
    </Flex>
  )
}

//
const RefreshBalanceButton = () => {
  //
  const {
    running,
    casinoAuthSignature,
    syncChipsBalance$
  } = useNWStore(s => ({
    running: s.syncChipsBalanceRS,
    casinoAuthSignature: s.casinoAuthSignature,
    syncChipsBalance$: s.syncChipsBalance$
  }), shallow)

  //
  return (
    <Tooltip hasArrow label={running === true ? 'Updating...' : 'Update Balance ?'}>
      <Flex
        boxShadow='0px 0px 13px 3px #370b24'
        className={running === true ? 'rb spinning' : 'rb'}
        onClick={running === true || casinoAuthSignature === null ? null : () => syncChipsBalance$.raise()}
        cursor='pointer'
        backgroundColor='#4b3179'
        p='6px'
        borderRadius='10px'
        _hover={{ transform: 'scale(1.1)' }}
        gap='1'
        alignItems='center'
      >
        <FontAwesomeIcon icon={faRotate} fontSize='.8em' />
        { typeof running === 'string' && (
          <Tooltip hasArrow label={'Failed to update balance : ' + running}>
            <Flex>
              <FontAwesomeIcon icon={faWarning} fontSize='.8rem' color='#ffc164' />
            </Flex>
          </Tooltip>
        )}
      </Flex>
    </Tooltip>
  )
}

export default ChipsBalance;