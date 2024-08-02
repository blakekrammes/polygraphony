import styled from "@emotion/styled"
import { observer } from "mobx-react-lite"
import React, { FC, useCallback } from "react"
import { setTrackPan } from "../../actions"
import { useStores } from "../../hooks/useStores"
import { Localized } from "../../localize/useLocalization"
import { Slider } from "../ui/Slider"

const Container = styled.div`
  display: flex;
  flex-grow: 1;
  max-width: 8rem;
  min-width: 5rem;
  margin-left: 1rem;
  margin-right: 2rem;
`

const Label = styled.div`
  display: flex;
  align-items: center;
  margin-right: 0.5rem;
  color: ${({ theme }) => theme.secondaryTextColor};
`

export interface PanSliderProps {
  trackId: number
}

const PAN_CENTER = 64

const _PanSlider: FC<PanSliderProps> = observer(({ trackId }) => {
  const rootStore = useStores()
  const {
    pianoRollStore: { currentPan },
  } = rootStore
  const onChange = useCallback(
    (value: number) => setTrackPan(rootStore)(trackId, value),
    [rootStore, trackId],
  )
  const pan = currentPan ?? PAN_CENTER

  return (
    <Container>
      <Label>
        <Localized name="pan" />
      </Label>
      <Slider
        value={pan}
        onChange={(value) => onChange(value as number)}
        onDoubleClick={() => onChange(PAN_CENTER)}
        min={0}
        max={127}
        defaultValue={PAN_CENTER}
        minStepsBetweenThumbs={1}
        marks={[PAN_CENTER]}
      ></Slider>
    </Container>
  )
})

export const PanSlider = React.memo(_PanSlider)
