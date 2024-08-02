import {
  DialogProvider,
  ProgressProvider,
  PromptProvider,
  ToastProvider,
} from "dialog-hooks"

import { ActionDialog } from "../Dialog/ActionDialog"
import { ElectronCallbackHandler } from "./ElectronCallbackHandler"
import { GlobalCSS } from "../Theme/GlobalCSS"
import { GlobalKeyboardShortcut } from "../KeyboardShortcut/GlobalKeyboardShortcut"
import { HelmetProvider } from "react-helmet-async"
import { LocalizationProvider } from "./LocalizationProvider"
import { ProgressDialog } from "../Dialog/ProgressDialog"
import { PromptDialog } from "../Dialog/PromptDialog"
import React from "react"
import RootStore from "../../stores/RootStore"
import { RootView } from "../RootView/RootView"
import { StoreContext } from "../../hooks/useStores"
import { ThemeProvider } from "@emotion/react"
import { Toast } from "../ui/Toast"
import { defaultTheme } from "../../theme/Theme"
import { isRunningInElectron } from "../../helpers/platform"

const rootStore = new RootStore()

export function App() {
  return (
    <React.StrictMode>
      <StoreContext.Provider value={rootStore}>
        <ThemeProvider theme={defaultTheme}>
          <HelmetProvider>
            <ToastProvider component={Toast}>
              <PromptProvider component={PromptDialog}>
                <DialogProvider component={ActionDialog}>
                  <ProgressProvider component={ProgressDialog}>
                    <LocalizationProvider>
                      <GlobalKeyboardShortcut />
                      <GlobalCSS />
                      {isRunningInElectron() && <ElectronCallbackHandler />}
                      <RootView />
                    </LocalizationProvider>
                  </ProgressProvider>
                </DialogProvider>
              </PromptProvider>
            </ToastProvider>
          </HelmetProvider>
        </ThemeProvider>
      </StoreContext.Provider>
    </React.StrictMode>
  )
}
