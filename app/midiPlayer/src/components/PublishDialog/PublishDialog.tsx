import { useTheme } from "@emotion/react"
import styled from "@emotion/styled"
import { useToast } from "dialog-hooks"
import OpenInNewIcon from "mdi-react/OpenInNewIcon"
import { observer } from "mobx-react-lite"
import { FC, useCallback, useEffect, useState } from "react"
import { publishSong, unpublishSong } from "../../actions/cloudSong"
import { useStores } from "../../hooks/useStores"
import { Localized, useLocalization } from "../../localize/useLocalization"
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "../Dialog/Dialog"
import { Alert } from "../ui/Alert"
import { Button, PrimaryButton } from "../ui/Button"
import { LinkShare } from "../ui/LinkShare"

type PublishState = "publishable" | "published" | "notPublishable"

export const PublishDialog: FC = observer(() => {
  const rootStore = useStores()
  const { rootViewStore, cloudSongRepository } = rootStore
  const { openPublishDialog: open } = rootViewStore
  const [publishState, setPublishState] =
    useState<PublishState>("notPublishable")
  const [isLoading, setIsLoading] = useState(true)
  const toast = useToast()
  const theme = useTheme()
  const localized = useLocalization()

  useEffect(() => {
    ;(async () => {
      if (open) {
        setIsLoading(true)
        const cloudSongId = rootStore.song.cloudSongId
        if (cloudSongId === null) {
          setPublishState("notPublishable")
          setIsLoading(false)
          return
        }
        const cloudSong = await cloudSongRepository.get(cloudSongId)
        cloudSong?.isPublic
          ? setPublishState("published")
          : setPublishState("publishable")
        setIsLoading(false)
      }
    })()
  }, [open])

  const onClose = useCallback(
    () => (rootViewStore.openPublishDialog = false),
    [rootViewStore],
  )

  const onClickPublish = async () => {
    const { song, userRepository } = rootStore
    try {
      setIsLoading(true)
      const user = await userRepository.getCurrentUser()
      if (user === null) {
        throw new Error("Failed to get current user, please re-sign in")
      }
      await publishSong(rootStore)(song, user)
      setPublishState("published")
      toast.success(localized["song-published"])
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const onClickUnpublish = async () => {
    const { song } = rootStore
    try {
      setIsLoading(true)
      await unpublishSong(rootStore)(song)
      setPublishState("publishable")
      toast.success(localized["song-unpublished"])
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose} style={{ minWidth: "20rem" }}>
      <DialogTitle>
        <Localized name="publish-song" />
      </DialogTitle>
      <DialogContent>
        {publishState === "publishable" && (
          <>
            <div style={{ marginBottom: "1rem" }}>
              <Localized name="publish-notice" />
            </div>
            <Alert severity="warning">
              <Localized name="publish-rules" />
            </Alert>
          </>
        )}
        {publishState === "published" &&
          rootStore.song.cloudSongId !== null && (
            <>
              <SongLink
                href={getCloudSongUrl(rootStore.song.cloudSongId)}
                target="_blank"
              >
                <Localized name="published-notice" />
                <OpenInNewIcon color={theme.secondaryTextColor} size="1rem" />
              </SongLink>
              <LinkShare
                url={getCloudSongUrl(rootStore.song.cloudSongId)}
                text={localized["share-my-song-text"]}
              />
              <Divider />
            </>
          )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          <Localized name="close" />
        </Button>
        {publishState === "publishable" && (
          <PrimaryButton onClick={onClickPublish} disabled={isLoading}>
            <Localized name="publish" />
          </PrimaryButton>
        )}
        {publishState === "published" && (
          <PrimaryButton onClick={onClickUnpublish} disabled={isLoading}>
            <Localized name="unpublish" />
          </PrimaryButton>
        )}
      </DialogActions>
    </Dialog>
  )
})

const SongLink = styled.a`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.textColor};
  text-decoration: none;
  margin-bottom: 1rem;

  &:hover {
    opacity: 0.8;
  }
`

const Divider = styled.div`
  margin: 1rem 0 0 0;
  height: 1px;
  background: ${({ theme }) => theme.dividerColor};
`

const getCloudSongUrl = (cloudSongId: string) =>
  `${window.location.origin}/songs/${cloudSongId}`
