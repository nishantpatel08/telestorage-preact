import type { FunctionComponent as FC } from 'preact'
import { h, Fragment } from 'preact'
import { memo } from 'preact/compat'
import { useMemo, useRef, useCallback } from 'preact/hooks'
import cn from 'classnames'

import type { MessageMedia } from '~/core/store'
import { formatSize } from '~/tools/format-size'
import { Menu } from '~/ui/elements/menu'
import type { Props as MenuProps } from '~/ui/elements/menu'
import { Text } from '~/ui/elements/text'
import { BluredImage } from '~/ui/elements/blured-image'
import { FilePreviewImage } from '~/ui/elements/file-preview-image'
import { FilePreviewIcon } from '~/ui/elements/file-preview-icon'
import { Loader } from '~/ui/elements/loader'
import { Button } from '~/ui/elements/button'
import { Break } from '~/ui/elements/break'
import { Icon } from '~/ui/elements/icon'

import styles from './content-item-media-item.styl'

type Props = {
  media: MessageMedia
  blurPreviewUrl?: string
  hasPreviewFile?: boolean
  previewFileKey?: string
  single?: boolean
  menu?: MenuProps | null
  loading?: boolean
  downloading?: boolean
  downloadingProgress?: number | undefined
  onCancelDownload: () => void
  onViewMedia?: (id: string) => void
}

export const ContentItemMediaItem: FC<Props> = memo(({
  media,
  blurPreviewUrl,
  hasPreviewFile,
  previewFileKey,
  single,
  menu,
  loading,
  downloading,
  downloadingProgress,
  onCancelDownload,
  onViewMedia
}) => {
  const elRef = useRef<HTMLDivElement>(null)

  const isImage = useMemo(() => {
    return media.type.startsWith('image')
  }, [media.type])

  const isVideo = useMemo(() => {
    return media.type.startsWith('video')
  }, [media.type])

  const isAudio = useMemo(() => {
    return media.type.startsWith('audio')
  }, [media.type])

  const handlePreviewClick = useCallback(() => {
    onViewMedia?.(media.id)
  }, [media.id, onViewMedia])

  const previewOpen = (isImage || isVideo || isAudio) ? handlePreviewClick : undefined

  const rowPreview = (
    <Fragment>
      {blurPreviewUrl && (
        <BluredImage
          url={blurPreviewUrl}
          width={64}
          height={64}
          radius={8}
        />
      )}
      {hasPreviewFile && (
        <FilePreviewImage
          fileKey={previewFileKey}
          timeout={50}
          isPlay={isVideo}
        />
      )}
      {!hasPreviewFile && (
        <FilePreviewIcon
          name={media.name}
          isVideo={isVideo}
          isAudio={isAudio}
          isImage={isImage}
        />
      )}
    </Fragment>
  )

  const cardPreview = (
    <Fragment>
      {blurPreviewUrl && (
        <BluredImage
          url={blurPreviewUrl}
          width={280}
          height={280}
          radius={12}
        />
      )}
      {hasPreviewFile && (
        <FilePreviewImage
          fileKey={previewFileKey}
          timeout={50}
          isPlay={isVideo}
        />
      )}
      {!hasPreviewFile && (
        <FilePreviewIcon
          name={media.name}
          isVideo={isVideo}
          isAudio={isAudio}
          isImage={isImage}
        />
      )}
    </Fragment>
  )

  return (
    <Fragment>
      <div
        class={cn(
          styles.root,
          single && styles._single,
          isImage && styles._image,
          isVideo && styles._video,
          isAudio && styles._audio,
        )}
        ref={elRef}
      >
        {single ? (
          <Fragment>
            <div class={styles.cardHeader}>
              <div class={styles.cardHeaderIcon}>
                <FilePreviewIcon
                  name={media.name}
                  isVideo={isVideo}
                  isAudio={isAudio}
                  isImage={isImage}
                />
              </div>
              <Text class={styles.cardTitle} ellipsis>
                {media.name}
              </Text>
              {(loading || (downloading && typeof downloadingProgress !== 'number')) && (
                <Loader class={styles.cardHeaderLoader} grey/>
              )}
              {typeof downloadingProgress === 'number' && (
                <Button
                  class={styles.cardCancelButton}
                  inline
                  onClick={onCancelDownload}
                >
                  <Icon icon="cross"/>
                </Button>
              )}
              {(!loading && !downloading && menu) && (
                <Menu
                  {...menu}
                  class={styles.cardMenu}
                  parentRef={elRef}
                />
              )}
            </div>

            <div
              class={styles.cardPreview}
              onClick={previewOpen}
            >
              <div class={styles.cardPreviewInner}>
                {cardPreview}
              </div>
            </div>

            {(typeof downloadingProgress === 'number' || (!downloading && !loading)) && (
              <div class={styles.cardFooter}>
                <Text class={styles.cardFooterText} grey ellipsis small>
                  {formatSize(media.originalSize)}
                </Text>
                {typeof downloadingProgress === 'number' && (
                  <Text class={styles.cardFooterText} grey ellipsis small>
                    {`${downloadingProgress}%`}
                  </Text>
                )}
              </div>
            )}
          </Fragment>
        ) : (
          <Fragment>
            <div
              class={styles.preview}
              onClick={previewOpen}
            >
              {rowPreview}
            </div>

            <div class={styles.description}>
              <Text class={styles.title} grey small ellipsis>
                {media.name}
              </Text>
              <div class={styles.footer}>
                <Text grey ellipsis>
                  {formatSize(media.originalSize)}
                </Text>
                {typeof downloadingProgress === 'number' && (
                  <Text grey ellipsis>
                    {`${downloadingProgress}%`}
                  </Text>
                )}
              </div>
            </div>

            {(loading || (downloading && typeof downloadingProgress !== 'number')) && (
              <Loader class={styles.loader} grey/>
            )}

            {typeof downloadingProgress === 'number' && (
              <Button
                class={styles.cancelButton}
                inline
                onClick={onCancelDownload}
              >
                <Icon icon="cross"/>
              </Button>
            )}

            {(!loading && !downloading && menu) && (
              <Menu
                {...menu}
                class={styles.menu}
                parentRef={elRef}
              />
            )}
          </Fragment>
        )}
      </div>

      {!single && (
        <Break size={16} px/>
      )}
    </Fragment>
  )
})
