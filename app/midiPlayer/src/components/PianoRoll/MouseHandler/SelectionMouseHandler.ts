import {
  cloneSelection,
  fixSelection,
  moveSelection,
  resizeSelection,
  startSelection,
  updateSelectedNotes,
} from "../../../actions"
import { pushHistory } from "../../../actions/history"
import { Point } from "../../../entities/geometry/Point"
import { Rect } from "../../../entities/geometry/Rect"
import { Selection } from "../../../entities/selection/Selection"
import { observeDrag, observeDrag2 } from "../../../helpers/observeDrag"
import RootStore from "../../../stores/RootStore"
import { MouseGesture } from "./NoteMouseHandler"

const MIN_LENGTH = 10

export const getSelectionActionForMouseDown =
  (rootStore: RootStore) =>
  (e: MouseEvent): MouseGesture | null => {
    if (e.relatedTarget) {
      return null
    }

    const { selectionBounds } = rootStore.pianoRollStore
    const local = rootStore.pianoRollStore.getLocal(e)

    if (e.button === 0) {
      if (selectionBounds !== null) {
        const type = positionType(selectionBounds, local)
        switch (type) {
          case "center":
            return moveSelectionAction(selectionBounds)
          case "right":
            return dragSelectionRightEdgeAction
          case "left":
            return dragSelectionLeftEdgeAction
          case "outside":
            return createSelectionAction
        }
      } else {
        return createSelectionAction
      }
    }

    return null
  }

export const getSelectionCursorForMouseMoven =
  (rootStore: RootStore) => (e: MouseEvent) => {
    const { selectionBounds } = rootStore.pianoRollStore
    const local = rootStore.pianoRollStore.getLocal(e)
    const type =
      selectionBounds === null
        ? "outside"
        : positionType(selectionBounds, local)
    switch (type) {
      case "center":
        return "move"
      case "left":
        return "w-resize"
      case "right":
        return "e-resize"
      case "outside":
        return "crosshair"
    }
  }

function positionType(selectionBounds: Rect, pos: Point) {
  const rect = selectionBounds
  const contains =
    rect.x <= pos.x &&
    rect.x + rect.width >= pos.x &&
    rect.y <= pos.y &&
    rect.y + rect.height >= pos.y
  if (!contains) {
    return "outside"
  }
  const localX = pos.x - rect.x
  const edgeSize = Math.min(rect.width / 3, 8)
  if (localX <= edgeSize) {
    return "left"
  }
  if (rect.width - localX <= edgeSize) {
    return "right"
  }
  return "center"
}

// 選択範囲外でクリックした場合は選択範囲をリセット
const createSelectionAction: MouseGesture = (rootStore) => (e) => {
  const {
    pianoRollStore: { transform, quantizer },
  } = rootStore

  const local = rootStore.pianoRollStore.getLocal(e)
  const start = transform.getNotePointFractional(local)
  const startPos = local
  startSelection(rootStore)(start)

  observeDrag2(e, {
    onMouseMove: (_e, delta) => {
      const offsetPos = Point.add(startPos, delta)
      const end = transform.getNotePointFractional(offsetPos)
      resizeSelection(rootStore)(
        { ...start, tick: quantizer.round(start.tick) },
        { ...end, tick: quantizer.round(end.tick) },
      )
    },

    onMouseUp: () => {
      fixSelection(rootStore)()
    },
  })
}

const moveSelectionAction =
  (selectionBounds: Rect): MouseGesture =>
  (rootStore) =>
  (e) => {
    const { transform } = rootStore.pianoRollStore

    const isCopy = e.ctrlKey

    if (isCopy) {
      cloneSelection(rootStore)()
    }

    let isChanged = false

    observeDrag2(e, {
      onMouseMove: (_e, delta) => {
        const position = Point.add(selectionBounds, delta)
        const tick = transform.getTick(position.x)
        const noteNumber = transform.getNoteNumberFractional(position.y)

        if ((tick !== 0 || noteNumber !== 0) && !isChanged) {
          isChanged = true
          pushHistory(rootStore)()
        }

        moveSelection(rootStore)({
          tick,
          noteNumber,
        })
      },
    })
  }

const dragSelectionEdgeAction =
  (edge: "left" | "right"): MouseGesture =>
  (rootStore) =>
  (e) => {
    const {
      pianoRollStore,
      pianoRollStore: { isQuantizeEnabled, quantizer },
      pushHistory,
    } = rootStore

    const quantize = !e.shiftKey && isQuantizeEnabled
    const minLength = quantize ? quantizer.unit : MIN_LENGTH
    let isChanged = false

    observeDrag({
      onMouseMove: (e2) => {
        const { selection } = pianoRollStore

        if (selection === null) {
          return
        }

        const local = pianoRollStore.getLocal(e2)
        const tick = pianoRollStore.transform.getTick(local.x)
        const fromTick = quantizer.round(tick)
        const newSelection = (() => {
          switch (edge) {
            case "left":
              return Selection.resizeLeft(selection, fromTick, minLength)
            case "right":
              return Selection.resizeRight(selection, fromTick, minLength)
          }
        })()

        if (!Selection.equals(newSelection, selection)) {
          if (!isChanged) {
            isChanged = true
            pushHistory()
          }
          pianoRollStore.selection = newSelection

          switch (edge) {
            case "left": {
              const delta = newSelection.from.tick - selection.from.tick
              updateSelectedNotes(rootStore)((note) => ({
                duration: note.duration - delta,
                tick: note.tick + delta,
              }))
              break
            }
            case "right": {
              const delta = newSelection.to.tick - selection.to.tick
              updateSelectedNotes(rootStore)((note) => ({
                duration: note.duration + delta,
              }))
              break
            }
          }
        }
      },
    })
  }

const dragSelectionLeftEdgeAction = dragSelectionEdgeAction("left")
const dragSelectionRightEdgeAction = dragSelectionEdgeAction("right")
