import { FC, ReactNode } from "react"

import EventList from "../EventEditor/EventList"
import PianoRoll from "./PianoRoll"
import { PianoRollKeyboardShortcut } from "../KeyboardShortcut/PianoRollKeyboardShortcut"
import { PianoRollToolbar } from "../PianoRollToolbar/PianoRollToolbar"
import { SplitPaneProps } from "@ryohey/react-split-pane"
import { StyledSplitPane } from "./StyledSplitPane"
import { TrackList } from "../TrackList/TrackList"
import { observer } from "mobx-react-lite"
import styled from "@emotion/styled"
import { useStores } from "../../hooks/useStores"

const ColumnContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
`

const PaneLayout: FC<SplitPaneProps & { isShow: boolean; pane: ReactNode }> = ({
  isShow,
  pane,
  children,
  ...props
}) => {
  if (isShow) {
    return (
      <StyledSplitPane {...props}>
        {pane}
        {children}
      </StyledSplitPane>
    )
  }
  return <>{children}</>
}

export const PianoRollEditor: FC = observer(() => {
  const { pianoRollStore } = useStores()
  const { showTrackList, showEventList } = pianoRollStore

  return (
    <ColumnContainer>
      <PianoRollKeyboardShortcut />
      <PianoRollToolbar />
      <div style={{ display: "flex", flexGrow: 1, position: "relative", height: 400, marginBottom: 200 }}>
        <PaneLayout
          split="vertical"
          minSize={280}
          pane1Style={{ display: "flex" }}
          pane2Style={{ display: "flex" }}
          isShow={showTrackList}
          pane={<TrackList />}
        >
          <PaneLayout
            split="vertical"
            minSize={240}
            pane1Style={{ display: "flex" }}
            pane2Style={{ display: "flex" }}
            isShow={showEventList}
            pane={<EventList />}
          >
            <PianoRoll />
          </PaneLayout>
        </PaneLayout>
      </div>
    </ColumnContainer>
  )
})
