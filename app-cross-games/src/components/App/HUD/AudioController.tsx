import type { ChangeEvent, MouseEventHandler, ReactEventHandler} from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Box, Button, Checkbox, Flex, Slider, SliderFilledTrack, SliderThumb, SliderTrack,Tooltip } from '@chakra-ui/react'
import { faArrowsRotate, faMusic, faVolumeHigh,faVolumeLow, faVolumeMute, faVolumeOff } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

//
const AudioController = () => {
  const audioRef = useRef(null)
  const [isPaused, setIsPaused] = useState(true)
  const [autoplay, setAutoplay] = useState(false)
  const [volume, setVolume] = useState(1)

  //
  const onTooglePlay = useCallback<MouseEventHandler<HTMLButtonElement>>(() => {
    if (!audioRef.current) return

    //
    if (audioRef.current.paused) {
      audioRef.current.play()
    } else {
      audioRef.current.pause()
    }
  }, [])

  //
  const onPlayPause = useCallback<ReactEventHandler<HTMLAudioElement>>(() => {
    if (!audioRef.current) return

    //
    setIsPaused(audioRef.current.paused)
  }, [])

  //
  const onFirstUserInteraction = useCallback(() => {
    if (!audioRef.current) return

    //
    audioRef.current.play()

    //
    window.removeEventListener('click', onFirstUserInteraction)
    window.removeEventListener('keydown', onFirstUserInteraction)
  }, [])

  //
  const onAutoPlayChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    localStorage.setItem('autoplay', JSON.stringify(event.target.checked))
    setAutoplay(event.target.checked)
  }, [])

  //
  useEffect(() => {
    //
    const volume = JSON.parse(localStorage.getItem('volume'))
    setVolume(volume !== null ? volume : 40)

    //
    const mustAutoplay = JSON.parse(localStorage.getItem('autoplay'))
    if (mustAutoplay === false) return
    setAutoplay(true)

    //
    window.addEventListener('click', onFirstUserInteraction)
    window.addEventListener('keydown', onFirstUserInteraction)

    //
    return () => {
      window.removeEventListener('click', onFirstUserInteraction)
      window.removeEventListener('keydown', onFirstUserInteraction)
    }
  }, [onFirstUserInteraction])

  //
  useEffect(() => {
    if (!audioRef.current) return

    //
    audioRef.current.volume = volume / 100
    localStorage.setItem('volume', JSON.stringify(volume))
    //
  }, [volume])

  //
  const volumeIcon = useMemo(() => {
    if (volume < 5) return faVolumeOff
    if (volume > 40) return faVolumeHigh
    return faVolumeLow
  }, [volume])

  //
  return (
    <Flex direction='column' gap='1'>
      <Flex justifyContent='space-between' alignItems='center' gap={5}>
        <Button
          leftIcon={<FontAwesomeIcon icon={isPaused ? faMusic : faVolumeMute} />}
          fontSize='.6rem'
          size='sx'
          border="1px"
          px='2'
          py='1'
          borderRadius='5px'
          onClick={onTooglePlay}
        >{isPaused ? 'PLAY' : 'PAUSE'}</Button>
        <Tooltip hasArrow label="Automatically start at first user interaction" placement="right">
          <Box as='span'> {/** required */}
            <Checkbox isChecked={autoplay} onChange={onAutoPlayChange}>
              <FontAwesomeIcon icon={faArrowsRotate} />
            </Checkbox>
          </Box>
        </Tooltip>
        <audio
          ref={audioRef}
          loop={true}
          preload='auto'
          src='/resources/nw-audio.mp3'
          onPlay={onPlayPause}
          onPause={onPlayPause} />
      </Flex>
      <Flex gap='2'>
        <Flex w='16px'>
          <FontAwesomeIcon icon={volumeIcon} />
        </Flex>
        <Slider size='sm' aria-label='slider-ex-2' colorScheme='blackAlpha' value={volume} onChange={setVolume}>
          <SliderTrack>
            <SliderFilledTrack />
          </SliderTrack>
          <SliderThumb />
        </Slider>
      </Flex>
    </Flex>
  )
}

export default AudioController;