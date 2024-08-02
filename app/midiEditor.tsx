'use client';

import { useEffect, useState } from 'react';

import { PianoRollEditor } from './midiPlayer/src/components/PianoRoll/PianoRollEditor';
import RootStore from './midiPlayer/src/stores/RootStore';
import { StoreContext } from './midiPlayer/src/hooks/useStores';
import { ThemeProvider } from '@emotion/react';
import { configure } from 'mobx';
import { defaultTheme } from './midiPlayer/src/theme/Theme';

configure({
  enforceActions: 'never',
});

export const MidiEditor = () => {
  const [rootStore, setRootStore] = useState<RootStore | null>(null);

  useEffect(() => {
    // Check if we are on the client side
    if (typeof window !== 'undefined') {
      // Dynamically import the module
      import('./midiPlayer/src/stores/RootStore').then((RootStore) => {
        // Module is now loaded and can be used
        const rootStore = new RootStore.default();
        setRootStore(rootStore);
      });
    }
  }, []);
  return {
    ...(rootStore ? (
      <>
        <StoreContext.Provider value={rootStore}>
          <ThemeProvider theme={defaultTheme}>
            <PianoRollEditor />
          </ThemeProvider>
        </StoreContext.Provider>
      </>
    ) : (
      <></>
    )),
  };
};
