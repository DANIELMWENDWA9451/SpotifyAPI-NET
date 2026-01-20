import { createContext, useContext } from 'react';

// Create a context for panel state management
interface PlayerPanelContextType {
  activePanel: 'none' | 'queue' | 'devices' | 'nowPlaying' | 'lyrics';
  setActivePanel: (panel: 'none' | 'queue' | 'devices' | 'nowPlaying' | 'lyrics') => void;
}

export const PlayerPanelContext = createContext<PlayerPanelContextType>({
  activePanel: 'none',
  setActivePanel: () => {},
});

export function usePlayerPanel() {
  return useContext(PlayerPanelContext);
}
