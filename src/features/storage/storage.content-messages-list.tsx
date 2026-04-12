import type { FunctionComponent as FC } from 'preact'
import { h, Fragment } from 'preact'
import { memo } from 'preact/compat'
import { useEffect, useState, useCallback, useRef } from 'preact/hooks'

import type { Folder, Message } from '~/core/store'
import { useUpdatableRef } from '~/tools/hooks'
import { ContentList } from '~/ui/elements/content-list'
import { useVirtualList } from '~/ui/hooks'

import { StorageContentMessageItem } from './storage.content-message-item'
import { StorageContentMessagesMediaViewer } from './storage.content-messages-media-viewer'

/** Minimum scroll width per column for the message grid (gaps included in layout). */
const GRID_MIN_CELL_PX = 268

const expandVisibleRangeToGridRows = (
  firstIndex: number,
  lastIndex: number,
  columnCount: number,
  total: number
) => {
  if (columnCount <= 1 || total <= 0) {
    return { firstIndex, lastIndex }
  }
  const firstRow = Math.floor(firstIndex / columnCount)
  const lastRow = Math.floor(lastIndex / columnCount)
  return {
    firstIndex: Math.max(0, firstRow * columnCount),
    lastIndex: Math.min(total - 1, (lastRow + 1) * columnCount - 1)
  }
}

type Props = {
  folder: Folder
  messages: Message[]
  messagesLoading: boolean
  lastMessageId: number
  fullHeight?: boolean
  loadMessages?: () => void
  onEditMessage?: (message: Message) => void
  onMoveMessage?: (message: Message) => void
}

const RENDER_TIMEOUT = 100

export const StorageContentMessagesList: FC<Props> = memo(({
  folder,
  messages,
  messagesLoading,
  lastMessageId,
  fullHeight,
  loadMessages,
  onEditMessage,
  onMoveMessage
}) => {
  const {
    offsets,
    resizeObserver,
    visibility,
    finished,
    intersectionObserver,
    countRef,
    intersectionRef,
    onDeleteMessage,
    setColumnCount,
    columnCount
  } = useVirtualList()
  const lastMessageIdRef = useUpdatableRef(lastMessageId)
  const messagesLoadingRef = useUpdatableRef(messagesLoading)
  const loadMessagesRef = useUpdatableRef(loadMessages)
  const listResizeObserverRef = useRef<ResizeObserver | null>(null)
  const [renderAvailable, setRenderAvailable] = useState(false)
  const [mediaViewerInitialId, setMediaViewerInitialId] = useState('')

  const handleContentListRef = useCallback((el: HTMLElement | null) => {
    intersectionRef(el)
    listResizeObserverRef.current?.disconnect()
    listResizeObserverRef.current = null
    if (!el) return
    const measure = () => {
      const w = el.clientWidth
      setColumnCount(Math.max(1, Math.floor((w - 24) / GRID_MIN_CELL_PX)))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    listResizeObserverRef.current = ro
  }, [intersectionRef, setColumnCount])

  const openMediaViewer = useCallback((id: string) => {
    setMediaViewerInitialId(id)
  }, [setMediaViewerInitialId])

  const closeMediaViewer = useCallback(() => {
    setMediaViewerInitialId('')
  }, [setMediaViewerInitialId])

  useEffect(() => {
    countRef.current = messages.length
  }, [messages.length])

  useEffect(() => {
    const loadMessages = () => loadMessagesRef.current?.()
    const { lastIndex: expandedLast } = expandVisibleRangeToGridRows(
      visibility.firstIndex,
      visibility.lastIndex,
      columnCount,
      messages.length
    )
    const checkIsLoadAvailable = () => (
      !messagesLoadingRef.current &&
      typeof lastMessageIdRef.current !== 'undefined' &&
      expandedLast >= messages.length - 1
    )
    if (checkIsLoadAvailable()) {
      loadMessages()
    }
  }, [messages.length, visibility.lastIndex, visibility.firstIndex, columnCount, finished])

  useEffect(() => {
    const timeoutId = self.setTimeout(() => {
      setRenderAvailable(true)
    }, RENDER_TIMEOUT)

    return () => self.clearTimeout(timeoutId)
  }, [])

  useEffect(() => () => {
    listResizeObserverRef.current?.disconnect()
  }, [])

  return renderAvailable && !!messages.length ? (
    <Fragment>
      <ContentList
        intersectionRef={handleContentListRef}
        fullHeight={fullHeight}
      >
        {messages.map((message, index) => {
          const last = index === messages.length - 1
          const offset = offsets.get(message.id)
          const { firstIndex: visFirst, lastIndex: visLast } = expandVisibleRangeToGridRows(
            visibility.firstIndex,
            visibility.lastIndex,
            columnCount,
            messages.length
          )
          const visible = (
            (index >= visFirst && index <= visLast) ||
            index === offsets.size - 1
          )

          return (
            <StorageContentMessageItem
              key={`${message.id}-${message.parentId}`}
              folder={folder}
              message={message}
              offset={offset}
              visible={visible}
              last={last}
              columnCount={columnCount}
              columnIndex={index % columnCount}
              resizeObserver={resizeObserver}
              intersectionObserver={intersectionObserver}
              onViewMedia={openMediaViewer}
              onEdit={onEditMessage}
              onDelete={onDeleteMessage}
              onMove={onMoveMessage}
            />
          )
        })}
      </ContentList>

      {mediaViewerInitialId && (
        <StorageContentMessagesMediaViewer
          initialId={mediaViewerInitialId}
          messages={messages}
          onClose={closeMediaViewer}
        />
      )}
    </Fragment>
  ) : null
})
