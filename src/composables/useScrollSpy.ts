import { onBeforeUnmount, onMounted, type Ref } from 'vue'
import { pickActive, readingLine, type HeadingPosition } from '@/view-models/contents'

/** A heading becomes current once its top passes this line. A jump parks headings at 24px (scroll-margin-top). */
const READING_LINE = 64
/** After a Contents jump the chosen link holds until the reader really scrolls away. */
const HOLD_DISTANCE = 48

/** Keeps `current` on the section the reader is looking at while they scroll. */
export function useScrollSpy(
  items: () => { id: string; parentId?: string }[],
  current: Ref<string | null>,
  /** Bottom edge of anything pinned over the top of the page (the narrow-screen Contents bar), or 0. */
  coveredTop: () => number = () => 0,
) {
  let frame = 0
  let holdPending = false
  let holdY: number | null = null
  const root = document.documentElement

  const update = () => {
    frame = 0
    if (holdPending) {
      holdPending = false
      holdY = window.scrollY
      return
    }
    if (holdY !== null) {
      if (Math.abs(window.scrollY - holdY) < HOLD_DISTANCE) return
      holdY = null
    }
    if (window.scrollY <= 0) {
      current.value = null // nothing is chosen until the reader scrolls or jumps
      return
    }
    const headings: HeadingPosition[] = []
    for (const { id, parentId } of items()) {
      const heading = document.getElementById(id)
      if (!heading) continue
      const top = heading.getBoundingClientRect().top
      // Nested sections also report where they end, so the parent takes over after them.
      const end = parentId ? heading.closest('section')?.getBoundingClientRect().bottom : undefined
      headings.push({ id, top, end, parentId })
    }
    const maxScroll = root.scrollHeight - window.innerHeight
    // A pinned bar covers the top on narrow screens; the reading line moves below it.
    const top = Math.max(READING_LINE, coveredTop() + 40)
    const line = readingLine({
      scrollY: window.scrollY,
      maxScroll,
      viewport: window.innerHeight,
      top,
    })
    current.value = pickActive(headings, line)
  }
  const onScroll = () => {
    if (!frame) frame = requestAnimationFrame(update)
  }

  onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
  onBeforeUnmount(() => {
    window.removeEventListener('scroll', onScroll)
    if (frame) cancelAnimationFrame(frame)
  })

  /** After a Contents click the chosen link wins until the reader scrolls 48px away from where the jump landed. */
  return {
    lockAfterJump: () => {
      holdPending = true
      holdY = null
    },
  }
}
