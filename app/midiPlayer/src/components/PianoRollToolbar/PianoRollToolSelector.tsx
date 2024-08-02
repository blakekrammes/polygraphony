'use client'

import { ToolSelector } from "../Toolbar/ToolSelector"
import { observer } from "mobx-react-lite"
import { useCallback } from "react"
import { useStores } from "../../hooks/useStores"

export const PianoRollToolSelector = observer(() => {
  const { pianoRollStore } = useStores()
  return (
    <ToolSelector
      mouseMode={pianoRollStore.mouseMode}
      onSelect={useCallback(
        (mouseMode: any) => (pianoRollStore.mouseMode = mouseMode),
        [],
      )}
    />
  )
})
