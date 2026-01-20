import { useEffect, useRef, useState, useCallback } from 'react';
import { usePlayerStore } from '@/stores/playerStore';
import { playerApi, isBackendConfigured, authApi } from '@/services/api';
import type { SpotifyTrack, PlaybackState } from '@/types/spotify';

// Extend Window interface for Spotify SDK
declare global {
  interface Window {
    Spotify: {
      Player: new (options: SpotifyPlayerOptions) => SpotifyPlayer;
    };
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

// Spotify SDK types
interface SpotifyPlayerOptions {
  name: string;
  getOAuthToken: (cb: (token: string) => void) => void;
  volume?: number;
}

interface SpotifyPlayer {
  connect(): Promise<boolean>;
  disconnect(): void;
  addListener(event: 'ready', callback: (data: { device_id: string }) => void): void;
  addListener(event: 'not_ready', callback: (data: { device_id: string }) => void): void;
  addListener(event: 'player_state_changed', callback: (state: WebPlaybackState | null) => void): void;
  addListener(event: 'initialization_error', callback: (error: WebPlaybackError) => void): void;
  addListener(event: 'authentication_error', callback: (error: WebPlaybackError) => void): void;
  addListener(event: 'account_error', callback: (error: WebPlaybackError) => void): void;
  addListener(event: 'playback_error', callback: (error: WebPlaybackError) => void): void;
  removeListener(event: string): void;
  getCurrentState(): Promise<WebPlaybackState | null>;
  setName(name: string): Promise<void>;
  getVolume(): Promise<number>;
  setVolume(volume: number): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  togglePlay(): Promise<void>;
  seek(position_ms: number): Promise<void>;
  previousTrack(): Promise<void>;
  nextTrack(): Promise<void>;
  activateElement(): Promise<void>;
}

interface WebPlaybackState {
  context: {
    uri: string | null;
    metadata: Record<string, unknown>;
  };
  disallows: {
    pausing?: boolean;
    peeking_next?: boolean;
    peeking_prev?: boolean;
    resuming?: boolean;
    seeking?: boolean;
    skipping_next?: boolean;
    skipping_prev?: boolean;
  };
  paused: boolean;
  position: number;
  duration: number;
  repeat_mode: 0 | 1 | 2; // 0 = off, 1 = context, 2 = track
  shuffle: boolean;
  track_window: {
    current_track: WebPlaybackTrack;
    previous_tracks: WebPlaybackTrack[];
    next_tracks: WebPlaybackTrack[];
  };
  playback_id: string;
  playback_quality: string;
  playback_features: {
    hifi_status: string;
  };
  timestamp: number;
}

interface WebPlaybackTrack {
  uri: string;
  id: string | null;
  type: 'track' | 'episode' | 'ad';
  media_type: 'audio' | 'video';
  name: string;
  is_playable: boolean;
  album: {
    uri: string;
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
  artists: Array<{ uri: string; name: string }>;
  duration_ms: number;
}

interface WebPlaybackError {
  message: string;
}

export interface SpotifyWebPlaybackState {
  isReady: boolean;
  isActive: boolean;
  isInitializing: boolean;
  deviceId: string | null;
  isPremium: boolean;
  error: string | null;
  sdkState: WebPlaybackState | null;
}

// Convert SDK state to our PlaybackState format
function convertToPlaybackState(
  sdkState: WebPlaybackState,
  deviceId: string,
  volume: number
): PlaybackState {
  const track = sdkState.track_window.current_track;
  const repeatModeMap: Record<number, 'off' | 'context' | 'track'> = {
    0: 'off',
    1: 'context',
    2: 'track',
  };

  // Extract artist IDs from URIs
  const artists = track.artists.map((artist, index) => ({
    id: artist.uri.split(':')[2] || `artist-${index}`,
    name: artist.name,
    images: [],
    uri: artist.uri,
    external_urls: { spotify: `https://open.spotify.com/artist/${artist.uri.split(':')[2]}` },
  }));

  // Extract album ID from URI
  const albumId = track.album.uri.split(':')[2] || 'unknown';

  const spotifyTrack: SpotifyTrack = {
    id: track.id || track.uri.split(':')[2] || 'unknown',
    name: track.name,
    artists,
    album: {
      id: albumId,
      name: track.album.name,
      images: track.album.images,
      artists,
      release_date: '',
      release_date_precision: 'day',
      total_tracks: 0,
      album_type: 'album',
      uri: track.album.uri,
      external_urls: { spotify: `https://open.spotify.com/album/${albumId}` },
    },
    duration_ms: track.duration_ms,
    explicit: false,
    popularity: 0,
    preview_url: null,
    uri: track.uri,
    track_number: 1,
    disc_number: 1,
    is_local: false,
    is_playable: track.is_playable,
    external_urls: { spotify: `https://open.spotify.com/track/${track.id}` },
  };

  return {
    is_playing: !sdkState.paused,
    progress_ms: sdkState.position,
    timestamp: sdkState.timestamp,
    item: spotifyTrack,
    device: {
      id: deviceId,
      name: 'Spotify Web Player',
      type: 'Computer',
      volume_percent: Math.round(volume * 100),
      is_active: true,
      is_private_session: false,
      is_restricted: false,
      supports_volume: true,
    },
    shuffle_state: sdkState.shuffle,
    repeat_state: repeatModeMap[sdkState.repeat_mode],
    context: sdkState.context.uri
      ? {
        type: 'playlist' as const,
        uri: sdkState.context.uri,
        external_urls: { spotify: '' },
      }
      : null,
    actions: {
      disallows: {
        pausing: sdkState.disallows.pausing,
        resuming: sdkState.disallows.resuming,
        seeking: sdkState.disallows.seeking,
        skipping_next: sdkState.disallows.skipping_next,
        skipping_prev: sdkState.disallows.skipping_prev,
      },
    },
    currently_playing_type: track.type === 'track' ? 'track' : 'episode',
  };
}

export function useSpotifyWebPlayback() {
  const playerRef = useRef<SpotifyPlayer | null>(null);
  const [state, setState] = useState<SpotifyWebPlaybackState>({
    isReady: false,
    isActive: false,
    isInitializing: false,
    deviceId: null,
    isPremium: false,
    error: null,
    sdkState: null,
  });

  const { setPlaybackState, setVolume, volume } = usePlayerStore();
  const volumeRef = useRef(volume / 100);

  // Update volume ref when store changes
  useEffect(() => {
    volumeRef.current = volume / 100;
  }, [volume]);

  // Load the Spotify Web Playback SDK script
  const loadScript = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      if (window.Spotify) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;

      script.onerror = () => reject(new Error('Failed to load Spotify SDK'));

      window.onSpotifyWebPlaybackSDKReady = () => {
        resolve();
      };

      document.body.appendChild(script);
    });
  }, []);

  // Get access token from backend
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      // The backend should provide a fresh access token
      // This endpoint should be implemented in your ASP.NET backend
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/auth/token`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error('Failed to get access token');
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }, []);

  // Initialize the player
  const initializePlayer = useCallback(async () => {
    if (!isBackendConfigured()) {
      setState(prev => ({ ...prev, error: 'Backend not configured' }));
      return;
    }

    setState(prev => ({ ...prev, isInitializing: true, error: null }));

    try {
      // Check if user has Premium
      const authCheck = await authApi.checkAuth();
      console.log('Auth check result:', authCheck);

      if (!authCheck.isAuthenticated || !authCheck.user) {
        console.log('Not authenticated or no user info');
        setState(prev => ({ ...prev, isInitializing: false, error: 'Not authenticated' }));
        return;
      }

      const isPremium = authCheck.user.product === 'premium';
      console.log('User product:', authCheck.user.product, 'isPremium:', isPremium);
      setState(prev => ({ ...prev, isPremium }));

      if (!isPremium) {
        setState(prev => ({
          ...prev,
          isInitializing: false,
          error: 'Spotify Premium is required for web playback. You can still control other devices.',
        }));
        return;
      }

      // Load SDK
      await loadScript();

      // Create player
      const player = new window.Spotify.Player({
        name: 'Spotify Web Client',
        getOAuthToken: async (cb: (token: string) => void) => {
          const token = await getAccessToken();
          if (token) {
            cb(token);
          }
        },
        volume: volumeRef.current,
      });

      // Error listeners
      player.addListener('initialization_error', ({ message }) => {
        console.error('Initialization error:', message);
        setState(prev => ({ ...prev, error: `Initialization error: ${message}` }));
      });

      player.addListener('authentication_error', ({ message }) => {
        console.error('Authentication error:', message);
        setState(prev => ({ ...prev, error: `Authentication error: ${message}` }));
      });

      player.addListener('account_error', ({ message }) => {
        console.error('Account error:', message);
        setState(prev => ({
          ...prev,
          error: 'Premium required. Please upgrade your Spotify account.',
        }));
      });

      player.addListener('playback_error', ({ message }) => {
        console.error('Playback error:', message);
        setState(prev => ({ ...prev, error: `Playback error: ${message}` }));
      });

      // Ready listener
      player.addListener('ready', async ({ device_id }) => {
        console.log('Spotify Web Playback SDK Ready with Device ID:', device_id);
        setState(prev => ({
          ...prev,
          isReady: true,
          isInitializing: false,
          deviceId: device_id,
          error: null,
        }));

        // Auto-transfer playback to this device for faster response
        try {
          await playerApi.transferPlayback([device_id], false); // false = don't start playing
          console.log('Playback transferred to web player');
        } catch (error) {
          console.log('Could not auto-transfer playback (no active playback or other device)');
        }
      });

      // Not ready listener
      player.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline:', device_id);
        setState(prev => ({
          ...prev,
          isReady: false,
          isActive: false,
          deviceId: null,
        }));
      });

      // State change listener - this is the main event for updating playback
      player.addListener('player_state_changed', (sdkState) => {
        if (!sdkState) {
          setState(prev => ({ ...prev, isActive: false, sdkState: null }));
          return;
        }

        // Update local state first
        setState(prev => ({
          ...prev,
          isActive: true,
          sdkState,
        }));

        // Update playback state in store (outside of setState to avoid warning)
        const deviceId = state.deviceId || 'unknown';
        const playbackState = convertToPlaybackState(sdkState, deviceId, volumeRef.current);
        setPlaybackState(playbackState);
      });

      // Connect
      const connected = await player.connect();
      if (connected) {
        console.log('Successfully connected to Spotify!');
        playerRef.current = player;
      } else {
        throw new Error('Failed to connect to Spotify');
      }
    } catch (error) {
      console.error('Failed to initialize Spotify player:', error);
      setState(prev => ({
        ...prev,
        isInitializing: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, [loadScript, getAccessToken, setPlaybackState]);

  // Player control methods
  const play = useCallback(async (options?: {
    uri?: string;
    uris?: string[];
    context_uri?: string;
    offset?: { position?: number; uri?: string };
  }) => {
    try {
      // If we have a device ID from the Web Playback SDK, use it
      if (state.deviceId) {
        await playerApi.play({ ...options, device_id: state.deviceId });
      } else {
        // Fallback: play without device_id - Spotify will use the user's active device
        await playerApi.play(options);
      }
    } catch (error) {
      console.error('Play error:', error);
      throw error;
    }
  }, [state.deviceId]);

  const pause = useCallback(async () => {
    if (playerRef.current) {
      await playerRef.current.pause();
    } else if (state.deviceId) {
      await playerApi.pause(state.deviceId);
    }
  }, [state.deviceId]);

  const resume = useCallback(async () => {
    if (playerRef.current) {
      await playerRef.current.resume();
    } else if (state.deviceId) {
      await playerApi.play({ device_id: state.deviceId });
    }
  }, [state.deviceId]);

  const togglePlay = useCallback(async () => {
    if (playerRef.current) {
      await playerRef.current.togglePlay();
    }
  }, []);

  const seek = useCallback(async (positionMs: number) => {
    if (playerRef.current) {
      await playerRef.current.seek(positionMs);
    } else if (state.deviceId) {
      await playerApi.seek(positionMs, state.deviceId);
    }
  }, [state.deviceId]);

  const previousTrack = useCallback(async () => {
    if (playerRef.current) {
      await playerRef.current.previousTrack();
    } else if (state.deviceId) {
      await playerApi.skipPrevious(state.deviceId);
    }
  }, [state.deviceId]);

  const nextTrack = useCallback(async () => {
    if (playerRef.current) {
      await playerRef.current.nextTrack();
    } else if (state.deviceId) {
      await playerApi.skipNext(state.deviceId);
    }
  }, [state.deviceId]);

  const setPlayerVolume = useCallback(async (volumePercent: number) => {
    const volumeDecimal = volumePercent / 100;
    volumeRef.current = volumeDecimal;
    setVolume(volumePercent);

    if (playerRef.current) {
      await playerRef.current.setVolume(volumeDecimal);
    }
  }, [setVolume]);

  const transferPlayback = useCallback(async (play = true) => {
    if (state.deviceId) {
      try {
        await playerApi.transferPlayback([state.deviceId], play);
      } catch (error) {
        console.error('Transfer playback error:', error);
      }
    }
  }, [state.deviceId]);

  const activateElement = useCallback(async () => {
    if (playerRef.current) {
      await playerRef.current.activateElement();
    }
  }, []);

  // Disconnect on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.disconnect();
        playerRef.current = null;
      }
    };
  }, []);

  return {
    ...state,
    player: playerRef.current,
    initializePlayer,
    play,
    pause,
    resume,
    togglePlay,
    seek,
    previousTrack,
    nextTrack,
    setVolume: setPlayerVolume,
    transferPlayback,
    activateElement,
  };
}

export type SpotifyWebPlayback = ReturnType<typeof useSpotifyWebPlayback>;
