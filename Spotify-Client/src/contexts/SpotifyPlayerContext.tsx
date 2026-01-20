import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { useSpotifyWebPlayback, SpotifyWebPlayback } from '@/hooks/useSpotifyWebPlayback';
import { usePlayerStore } from '@/stores/playerStore';
import { playerApi, isBackendConfigured } from '@/services/api';

interface SpotifyPlayerContextType extends SpotifyWebPlayback {
  isSDKPlayer: boolean;
  hasInitialized: boolean;
}

const SpotifyPlayerContext = createContext<SpotifyPlayerContextType | null>(null);

export function useSpotifyPlayer() {
  const context = useContext(SpotifyPlayerContext);
  if (!context) {
    throw new Error('useSpotifyPlayer must be used within SpotifyPlayerProvider');
  }
  return context;
}

interface SpotifyPlayerProviderProps {
  children: ReactNode;
}

export function SpotifyPlayerProvider({ children }: SpotifyPlayerProviderProps) {
  const webPlayback = useSpotifyWebPlayback();
  const { setPlaybackState } = usePlayerStore();
  const [hasInitialized, setHasInitialized] = useState(false);
  const initRef = useRef(false);

  // Initialize SDK on mount (skip on login page)
  useEffect(() => {
    const isLoginPage = window.location.pathname.includes('/login');
    if (isBackendConfigured() && !isLoginPage && !initRef.current) {
      initRef.current = true;
      setHasInitialized(true);
      // Call initializePlayer after the state update
      setTimeout(() => {
        webPlayback.initializePlayer();
      }, 0);
    }
  }, [webPlayback.initializePlayer]);

  // Poll for playback state - handles both SDK and remote device playback
  useEffect(() => {
    const isLoginPage = window.location.pathname.includes('/login');
    if (!isBackendConfigured() || isLoginPage) return;

    // Always do an initial fetch immediately
    const fetchInitialState = async () => {
      try {
        const state = await playerApi.getCurrentPlayback();
        if (state) {
          setPlaybackState(state);
        }
      } catch (error) {
        // Silently fail - user might not be playing anything
      }
    };

    fetchInitialState();

    // Poll for state updates (works for both SDK and remote devices)
    // SDK events handle real-time updates, but polling ensures we catch
    // state from other devices and sync after page refresh
    const pollInterval = setInterval(async () => {
      try {
        const state = await playerApi.getCurrentPlayback();
        if (state) {
          setPlaybackState(state);
        }
      } catch (error) {
        // Silently fail - user might not be playing anything
      }
    }, webPlayback.isActive ? 5000 : 2000); // Poll less frequently when SDK is active

    return () => clearInterval(pollInterval);
  }, [webPlayback.isActive, setPlaybackState]);

  const value: SpotifyPlayerContextType = {
    ...webPlayback,
    isSDKPlayer: webPlayback.isReady && webPlayback.isActive,
    hasInitialized,
  };

  return (
    <SpotifyPlayerContext.Provider value={value}>
      {children}
    </SpotifyPlayerContext.Provider>
  );
}
