import { clamp, cloneDeep } from "lodash"
import { action, autorun, computed, makeObservable, observable } from "mobx"
import { Layout } from "../Constants"
import { BAR_WIDTH } from "../components/inputs/ScrollBar"
import { Range } from "../entities/geometry/Range"
import { Rect } from "../entities/geometry/Rect"
import { ArrangeSelection } from "../entities/selection/ArrangeSelection"
import { ArrangeCoordTransform } from "../entities/transform/ArrangeCoordTransform"
import { NoteCoordTransform } from "../entities/transform/NoteCoordTransform"
import { isEventOverlapRange } from "../helpers/filterEvents"
import Quantizer from "../quantizer"
import { isNoteEvent } from "../track"
import RootStore from "./RootStore"
import { RulerStore } from "./RulerStore"

export type SerializedArrangeViewStore = Pick<
  ArrangeViewStore,
  "selection" | "selectedEventIds"
>

export default class ArrangeViewStore {
  readonly rulerStore: RulerStore

  scaleX = 1
  scaleY = 1
  SCALE_X_MIN = 0.15
  SCALE_X_MAX = 15
  SCALE_Y_MIN = 0.5
  SCALE_Y_MAX = 4
  selection: ArrangeSelection | null = null
  selectedEventIds: { [key: number]: number[] } = {} // { trackId: [eventId] }
  autoScroll = true
  quantize = 1
  scrollLeftTicks = 0
  scrollTop = 0
  canvasWidth = 0
  canvasHeight = 0
  selectedTrackId = 0
  openTransposeDialog = false

  constructor(readonly rootStore: RootStore) {
    this.rootStore = rootStore
    this.rulerStore = new RulerStore(this)

    makeObservable(this, {
      scaleX: observable,
      scaleY: observable,
      selection: observable.shallow,
      selectedEventIds: observable,
      autoScroll: observable,
      quantize: observable,
      scrollLeftTicks: observable,
      scrollTop: observable,
      canvasWidth: observable,
      canvasHeight: observable,
      selectedTrackId: observable,
      openTransposeDialog: observable,
      scrollLeft: computed,
      transform: computed,
      trackTransform: computed,
      notes: computed,
      cursorX: computed,
      trackHeight: computed,
      selectionRect: computed,
      contentWidth: computed,
      contentHeight: computed,
      quantizer: computed,
      setScrollLeftInPixels: action,
      setScrollTop: action,
    })
  }

  // keep scroll position to cursor
  setUpAutorun() {
    autorun(() => {
      const { isPlaying, position } = this.rootStore.player
      const { scrollLeft, transform, canvasWidth } = this
      if (this.autoScroll && isPlaying) {
        const x = transform.getX(position)
        const screenX = x - scrollLeft
        if (screenX > canvasWidth * 0.7 || screenX < 0) {
          this.scrollLeftTicks = position
        }
      }
    })
  }

  serialize(): SerializedArrangeViewStore {
    return {
      selection: cloneDeep(this.selection),
      selectedEventIds: cloneDeep(this.selectedEventIds),
    }
  }

  restore(state: SerializedArrangeViewStore) {
    this.selection = state.selection
    this.selectedEventIds = state.selectedEventIds
  }

  get scrollLeft(): number {
    return this.trackTransform.getX(this.scrollLeftTicks)
  }

  setScrollLeftInPixels(x: number) {
    const { canvasWidth, contentWidth } = this
    const maxOffset = Math.max(0, contentWidth - canvasWidth)
    const scrollLeft = Math.floor(Math.min(maxOffset, Math.max(0, x)))
    this.scrollLeftTicks = this.transform.getTick(scrollLeft)
  }

  setScrollTop(value: number) {
    const maxOffset =
      this.contentHeight + Layout.rulerHeight + BAR_WIDTH - this.canvasHeight
    this.scrollTop = clamp(value, 0, maxOffset)
  }

  scrollBy(x: number, y: number) {
    this.setScrollLeftInPixels(this.scrollLeft - x)
    this.setScrollTop(this.scrollTop - y)
  }

  scaleAroundPointX(scaleXDelta: number, pixelX: number) {
    const pixelXInTicks0 = this.transform.getTick(this.scrollLeft + pixelX)
    this.scaleX = clamp(
      this.scaleX * (1 + scaleXDelta),
      this.SCALE_X_MIN,
      this.SCALE_X_MAX,
    )
    const pixelXInTicks1 = this.transform.getTick(this.scrollLeft + pixelX)
    const scrollInTicks = pixelXInTicks1 - pixelXInTicks0
    this.scrollLeftTicks = Math.max(this.scrollLeftTicks - scrollInTicks, 0)
  }

  setScaleY(scaleY: number) {
    this.scaleY = clamp(scaleY, this.SCALE_Y_MIN, this.SCALE_Y_MAX)
    this.setScrollTop(this.scrollTop)
  }

  get contentWidth(): number {
    const { scrollLeft, transform, canvasWidth } = this
    const startTick = transform.getTick(scrollLeft)
    const widthTick = transform.getTick(canvasWidth)
    const endTick = startTick + widthTick
    return transform.getX(Math.max(this.rootStore.song.endOfSong, endTick))
  }

  get contentHeight(): number {
    return this.trackTransform.getY(this.rootStore.song.tracks.length)
  }

  get transform(): NoteCoordTransform {
    return new NoteCoordTransform(
      Layout.pixelsPerTick * this.scaleX,
      0.5 * this.scaleY,
      127,
    )
  }

  get trackTransform(): ArrangeCoordTransform {
    const { transform, trackHeight } = this
    return new ArrangeCoordTransform(transform, trackHeight)
  }

  get trackHeight(): number {
    const { transform } = this
    const bottomBorderWidth = 1
    return (
      Math.ceil(transform.pixelsPerKey * transform.numberOfKeys) +
      bottomBorderWidth
    )
  }

  get notes(): Rect[] {
    const { transform, trackTransform, scrollLeft, canvasWidth, scaleY } = this

    return this.rootStore.song.tracks
      .map((t, i) =>
        t.events
          .filter(
            isEventOverlapRange(
              Range.fromLength(
                transform.getTick(scrollLeft),
                transform.getTick(canvasWidth),
              ),
            ),
          )
          .filter(isNoteEvent)
          .map((e) => {
            const rect = transform.getRect(e)
            return {
              ...rect,
              height: scaleY,
              y: trackTransform.getY(i) + rect.y,
            }
          }),
      )
      .flat()
  }

  get cursorX(): number {
    return this.transform.getX(this.rootStore.player.position)
  }

  get selectionRect(): Rect | null {
    const { selection, trackTransform } = this
    if (selection === null) {
      return null
    }
    const x = trackTransform.getX(selection.fromTick)
    const right = trackTransform.getX(selection.toTick)
    const y = trackTransform.getY(selection.fromTrackIndex)
    const bottom = trackTransform.getY(selection.toTrackIndex)
    return {
      x,
      width: right - x,
      y,
      height: bottom - y,
    }
  }

  get quantizer(): Quantizer {
    return new Quantizer(this.rootStore, this.quantize, true)
  }
}
