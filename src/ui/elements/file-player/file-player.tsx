import type { FunctionComponent as FC, RefObject } from 'preact'
import { h, Fragment } from 'preact'
import { memo } from 'preact/compat'
import { useState, useEffect, useRef, useCallback, useMemo } from 'preact/hooks'
import cn from 'classnames'

import { sendAppError } from '~/core/actions'
import { getFileUrl } from '~/core/cache'
import { useCallbackRef, useRAFCallback } from '~/tools/hooks'
import { checkIsSafari } from '~/tools/detect-platform'
import { formatDuration } from '~/tools/format-time'
import { Button } from '~/ui/elements/button'
import { Range } from '~/ui/elements/range'
import { Loader } from '~/ui/elements/loader'

import styles from './file-player.styl'

type Props = {
  class?: string
  fileStreamUrl?: string
  thumbFileKey?: string
  fileKey?: string
  duration?: number
  description?: {
    performer?: string
    title?: string
  }
  type: string
  parentRef: RefObject<HTMLDivElement>
  isActive?: boolean
  isFullscreen?: boolean
  isFakeFullscreen?: boolean
  isVideo?: boolean
  isAudio?: boolean
}

export const FilePlayer: FC<Props> = memo(({
  class: outerStyles,
  fileStreamUrl,
  thumbFileKey,
  fileKey,
  duration,
  description,
  parentRef,
  isActive,
  isFullscreen,
  isFakeFullscreen,
  isVideo,
  isAudio
}) => {
  const isSafari = useMemo(() => checkIsSafari(), [])
  const playerRef = useRef<any>(null)
  const firstRenderRef = useRef(true)
  const controlsHideTimeoutRef = useRef(0)
  const progressChangeTimeoutRef = useRef(0)
  const [controlsHidden, setControlsHidden] = useState(false)
  const [progress, setProgress] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [thumbUrl, setThumbUrl] = useState('')
  const [url, setUrl] = useState('')
  const [hidden, setHidden] = useState(false)
  const [streamLoading, setStreamLoading] = useState(true)

  const [syncProgress, _syncProgressRef, cancelSyncProgressRef] = useRAFCallback(() => {
    if (!playerRef?.current) return
    setProgress(playerRef.current.currentTime)

    if (playerRef.current.paused || playerRef.current.ended) {
      cancelSyncProgressRef.current?.()
      setPlaying(false)
    } else {
      syncProgress()
    }
  }, [playerRef, setProgress, setPlaying])

  const [_play, playRef] = useCallbackRef(() => {
    try {
      playerRef.current?.play?.().catch(ignore)
    } catch (error: any) {
      sendAppError(error)
    }
  }, [])

  const [togglePlay, togglePlayRef] = useCallbackRef((ev: Event|undefined = undefined) => {
    ev?.stopPropagation()
    if (playerRef.current?.paused || playerRef.current?.ended) {
      playRef.current()
    } else {
      playerRef.current?.pause?.()
    }
  }, [playRef])

  const changeProgress = useCallback((value, type) => {
    cancelSyncProgressRef.current?.()
    setProgress(value)
    self.clearTimeout(progressChangeTimeoutRef.current)
    progressChangeTimeoutRef.current = self.setTimeout(() => {
      if (!playerRef.current || type !== 'pointerup') return
      playerRef.current.currentTime = value
    }, 100)
  }, [cancelSyncProgressRef, setProgress])

  const [hideControlsAfterTimeout, hideControlsAfterTimeoutRef] = useCallbackRef(() => {
    self.clearTimeout(controlsHideTimeoutRef.current)
    controlsHideTimeoutRef.current = self.setTimeout(() => {
      if (playerRef.current?.paused || playerRef.current?.ended) return
      setControlsHidden(true)
    }, 2500)
  }, [controlsHideTimeoutRef, setControlsHidden])

  const toggleControls = useCallback(() => {
    if (controlsHidden) {
      hideControlsAfterTimeout()
    }
    setControlsHidden(!controlsHidden)
  }, [controlsHidden, hideControlsAfterTimeout])

  const handlePlayStart = useCallback((ev) => {
    ev.stopPropagation()
    syncProgress()
    setPlaying(true)
    if (isFullscreen) {
      hideControlsAfterTimeout()
    }
    if (streamLoading) {
      setStreamLoading(false)
    }
  }, [isFullscreen, streamLoading, syncProgress, setPlaying, hideControlsAfterTimeout])

  const [handleContentClick, handleContentClickRef] = useCallbackRef((ev) => {
    if (!url) {
      return
    } else if (isFullscreen) {
      if (ev.type === 'click') {
        togglePlay()
      } else if (playing) {
        toggleControls()
      }
    } else {
      togglePlay()
    }
  }, [isFullscreen, url, playing, togglePlay, toggleControls])

  const handleCanPlay = useCallback(() => {
    if (playing) {
      playRef.current()
    }
    if (streamLoading) {
      setStreamLoading(false)
    }
  }, [playRef, streamLoading, playing])

  const handleWaiting = useCallback(() => {
    setStreamLoading(true)
  }, [setStreamLoading])

  const prevent = useCallback(ev => {
    ev.stopPropagation()
    if (controlsHidden) {
      setControlsHidden(false)
    }
    if (isFullscreen) {
      hideControlsAfterTimeout()
    }
  }, [isFullscreen, controlsHidden, hideControlsAfterTimeout])

  // New seek functions
  const seekBackward = useCallback((ev: Event) => {
    ev.stopPropagation()
    if (!playerRef.current) return
    const newTime = Math.max(0, playerRef.current.currentTime - 10)
    playerRef.current.currentTime = newTime
    setProgress(newTime)
  }, [playerRef, setProgress])

  const seekForward = useCallback((ev: Event) => {
    ev.stopPropagation()
    if (!playerRef.current || !duration) return
    const newTime = Math.min(duration, playerRef.current.currentTime + 10)
    playerRef.current.currentTime = newTime
    setProgress(newTime)
  }, [playerRef, duration, setProgress])

  useEffect(() => {
    if (!fileStreamUrl) return
    setUrl(fileStreamUrl)
    setStreamLoading(true)
  }, [fileStreamUrl])

  useEffect(() => {
    if (!fileKey) return

    const url = getFileUrl(fileKey)
    if (!url) return

    setUrl(url)

    return () => URL.revokeObjectURL(url)
  }, [fileKey])

  useEffect(() => {
    if (!url || !isActive) return
    if (fileKey) {
      playerRef.current?.play?.().catch(ignore)
    }
  }, [isActive, fileKey, url])

  useEffect(() => {
    if (playing) return
    self.clearTimeout(controlsHideTimeoutRef.current)
    setControlsHidden(false)
  }, [playing])

  useEffect(() => {
    if (!thumbFileKey || thumbUrl) return

    const url = getFileUrl(thumbFileKey)
    if (!url) return

    setThumbUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [thumbFileKey, thumbUrl])

  useEffect(() => {
    if (firstRenderRef.current) return

    if (!isFullscreen) {
      self.clearTimeout(controlsHideTimeoutRef.current)
      setControlsHidden(false)
    } else {
      hideControlsAfterTimeoutRef.current()
    }

    if (isVideo && !isFakeFullscreen) {
      setHidden(true)
      setTimeout(() => setHidden(false), 50)
    }
  }, [isFullscreen, isFakeFullscreen])

  useEffect(() => {
    if (!isActive && playing) {
      togglePlayRef.current()
    }
  }, [isActive, playing])

  useEffect(() => {
    const parentEl = parentRef.current
    const handleContentClick = (ev) => handleContentClickRef.current(ev)
    parentEl?.addEventListener('click', handleContentClick)
    return () => {
      parentEl?.removeEventListener('click', handleContentClick)
    }
  }, [parentRef])

  useEffect(() => {
    const cancelSyncProgress = cancelSyncProgressRef.current
    firstRenderRef.current = false
    return () => {
      cancelSyncProgress?.()
      self.clearTimeout(controlsHideTimeoutRef.current)
    }
  }, [])

  useEffect(() => () => {
    if (!playerRef.current) return
    playerRef.current.pause?.()
    playerRef.current.src = ''
    playerRef.current.load?.()
  }, [])

  return (
    <Fragment>
      {isVideo ? (
        <video
          ref={playerRef}
          class={cn(
            outerStyles,
            styles.video,
            hidden && styles._hidden
          )}
          src={isActive ? (url || undefined) : undefined}
          preload="auto"
          poster={thumbUrl}
          controls={false}
          autoPlay={isSafari}
          playsInline
          onPlay={handlePlayStart}
          onPlaying={handlePlayStart}
          onWaiting={handleWaiting}
          onCanPlayThrough={handleCanPlay}
        />
      ) : isAudio ? (
        <audio
          ref={playerRef}
          class={cn(
            outerStyles,
            styles.audio,
            hidden && styles._hidden
          )}
          src={isActive ? (url || undefined) : undefined}
          preload="auto"
          controls={false}
          autoPlay={isSafari}
          playsInline
          onPlay={handlePlayStart}
          onPlaying={handlePlayStart}
          onWaiting={handleWaiting}
          onCanPlay={isSafari ? undefined : handleCanPlay}
          onCanPlayThrough={isSafari ? handleCanPlay : undefined}
        />
      ) : null}

      {isAudio && (
        <div
          class={cn(
            styles.description,
            (!url || streamLoading || (isFullscreen && !controlsHidden)) && styles._transparent
          )}
          onClick={handleContentClick}
        >
          {[description?.performer, description?.title].map(text => (
            <div class={styles.descriptionText} key={text}>
              {text}
            </div>
          ))}
        </div>
      )}

      {!!url && !streamLoading && isFullscreen && (
        <Button
          class={cn(
            styles.playButton,
            controlsHidden && styles._hidden,
            isAudio && styles._border
          )}
          icon={playing ? 'pause' : 'play'}
          square
          onClick={togglePlay}
        />
      )}

      {streamLoading && (
        <Loader
          class={styles.loader}
          white={isVideo || isFullscreen}
          big
        />
      )}

      <div
        class={cn(
          styles.controls,
          (!url || (isSafari && streamLoading)) && styles._disabled,
          controlsHidden && styles._hidden,
          isFullscreen && styles._fullscreen
        )}
        onClick={prevent}
        onMouseMove={prevent}
        onTouchMove={prevent}
      >
        
        <Fragment>
          <Button
            square
            onClick={seekBackward}
          >
            <svg width="800px" height="800px" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" style="stroke-width:3; stroke:#ffffff; fill:none;">
              <polyline points="9.57 15.41 12.17 24.05 20.81 21.44" style="stroke-linecap:round;"/>
              <path d="M26.93,41.41V23a.09.09,0,0,0-.16-.07s-2.58,3.69-4.17,4.78" style="stroke-linecap:round;"/>
              <rect x="32.19" y="22.52" width="11.41" height="18.89" rx="5.7"/>
              <path d="M12.14,23.94a21.91,21.91,0,1,1-.91,13.25" style="stroke-linecap:round;"/>
            </svg>

          </Button>
          <Button
            icon={playing ? 'pause' : 'play'}
            square
            onClick={togglePlay}
          />
          <Button
            square
            onClick={seekForward}
          >
            <svg width="800px" height="800px" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" style="stroke-width:3; stroke:#ffffff; fill:none;">
              <polyline points="54.43 15.41 51.83 24.05 43.19 21.44" style="stroke-linecap:round;"/>
              <path d="M24.00,41.41V23a.09.09,0,0,0-.16-.07s-2.58,3.69-4.17,4.78" style="stroke-linecap:round;"/>
              <rect x="30.00" y="22.52" width="11.41" height="18.89" rx="5.7"/>
              <path d="M51.86,23.94a21.91,21.91,0,1,0,.91,13.25" style="stroke-linecap:round;"/>
            </svg>
          </Button>
        </Fragment>

        <Range
          class={styles.progress}
          value={progress}
          min={0}
          max={duration || 0}
          step={0.001}
          onChange={changeProgress}
        />

        <div class={styles.time}>
          {progress ? formatDuration(progress) : '00:00'}
          {' / '}
          {duration ? formatDuration(duration) : '00:00'}
        </div>
      </div>
    </Fragment>
  )
})

const ignore = (_error) => {
  // nothing
}