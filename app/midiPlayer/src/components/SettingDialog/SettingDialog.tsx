import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "../Dialog/Dialog"
import { FC, useCallback, useState } from "react"
import { SettingNavigation, SettingRoute } from "./SettingNavigation"

import { Button } from "../ui/Button"
import { GeneralSettingsView } from "./GeneralSettingsView"
import { Localized } from "../../localize/useLocalization"
// import { MIDIDeviceView } from "./MIDIDeviceView/MIDIDeviceView"
import { SoundFontSettingsView } from "./SoundFontSettingView"
import { observer } from "mobx-react-lite"
import styled from "@emotion/styled"
import { useStores } from "../../hooks/useStores"

const RouteContent: FC<{ route: SettingRoute }> = ({ route }) => {
  switch (route) {
    case "general":
      return <GeneralSettingsView />
    // case "midi":
      // return <MIDIDeviceView />
      return <></>
    case "soundfont":
      return <SoundFontSettingsView />
  }
}
const Content = styled.div`
  min-width: 20rem;
  min-height: 20rem;
`

export const SettingDialog: FC = observer(() => {
  const rootStore = useStores()
  const { rootViewStore } = rootStore
  const { openSettingDialog: open } = rootViewStore
  const [route, setRoute] = useState<SettingRoute>("general")

  const onClose = useCallback(
    () => (rootViewStore.openSettingDialog = false),
    [rootViewStore],
  )

  return (
    <Dialog open={open} onOpenChange={onClose} style={{ minWidth: "20rem" }}>
      <DialogTitle>
        <Localized name="settings" />
      </DialogTitle>
      <DialogContent style={{ display: "flex", flexDirection: "row" }}>
        <SettingNavigation route={route} onChange={setRoute} />
        <Content>
          <RouteContent route={route} />
        </Content>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          <Localized name="close" />
        </Button>
      </DialogActions>
    </Dialog>
  )
})
