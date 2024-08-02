import {
  createEvent as createTrackEvent,
  updateValueEvents,
} from "../../../../actions"
import { pushHistory } from "../../../../actions/history"
import { ValueEventType } from "../../../../entities/event/ValueEventType"
import { Point } from "../../../../entities/geometry/Point"
import { ControlCoordTransform } from "../../../../entities/transform/ControlCoordTransform"
import { getClientPos } from "../../../../helpers/mouseEvent"
import { observeDrag } from "../../../../helpers/observeDrag"
import RootStore from "../../../../stores/RootStore"

export const handlePencilMouseDown =
  (rootStore: RootStore) =>
  (
    e: MouseEvent,
    startPoint: Point,
    transform: ControlCoordTransform,
    type: ValueEventType,
  ) => {
    pushHistory(rootStore)()

    rootStore.controlStore.selectedEventIds = []
    rootStore.controlStore.selection = null
    rootStore.pianoRollStore.selection = null
    rootStore.pianoRollStore.selectedNoteIds = []

    const startClientPos = getClientPos(e)
    const pos = transform.fromPosition(startPoint)

    const event = ValueEventType.getEventFactory(type)(pos.value)
    createTrackEvent(rootStore)(event, pos.tick)

    let lastTick = pos.tick
    let lastValue = pos.value

    observeDrag({
      onMouseMove: (e) => {
        const posPx = getClientPos(e)
        const deltaPx = Point.sub(posPx, startClientPos)
        const local = Point.add(startPoint, deltaPx)
        const value = Math.max(
          0,
          Math.min(transform.maxValue, transform.fromPosition(local).value),
        )
        const tick = transform.getTick(local.x)

        updateValueEvents(type)(rootStore)(lastValue, value, lastTick, tick)

        lastTick = tick
        lastValue = value
      },
    })
  }
