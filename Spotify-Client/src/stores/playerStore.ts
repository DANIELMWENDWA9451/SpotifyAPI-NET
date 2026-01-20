import { create } from 'zustand';
import type { PlaybackState, SpotifyTrack } from '@/types/spotify';

interface PlayerStore {
  // State
  playbackState: PlaybackState | null;
  isLoading: boolean;
  error: string | null;
  volume: number;
  isMuted: boolean;
  previousVolume: number;

  // Actions
  setPlaybackState: (state: PlaybackState | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setProgress: (progressMs: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setCurrentTrack: (track: SpotifyTrack) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  // Initial state - no data until backend provides it
  playbackState: null,
  isLoading: false,
  error: null,
  volume: 75,
  isMuted: false,
  previousVolume: 75,

  setPlaybackState: (state) => set({ playbackState: state, error: null }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error }),

  setIsPlaying: (isPlaying) => set((state) => ({
    playbackState: state.playbackState 
      ? { ...state.playbackState, is_playing: isPlaying }
      : null
  })),

  setProgress: (progressMs) => set((state) => ({
    playbackState: state.playbackState
      ? { ...state.playbackState, progress_ms: progressMs }
      : null
  })),

  setVolume: (volume) => set({ volume, isMuted: volume === 0 }),

  toggleMute: () => {
    const { volume, isMuted, previousVolume } = get();
    if (isMuted) {
      set({ volume: previousVolume, isMuted: false });
    } else {
      set({ previousVolume: volume, volume: 0, isMuted: true });
    }
  },

  setCurrentTrack: (track) => set((state) => ({
    playbackState: state.playbackState
      ? { ...state.playbackState, item: track, progress_ms: 0, is_playing: true }
      : null
  })),

  toggleShuffle: () => set((state) => ({
    playbackState: state.playbackState
      ? { ...state.playbackState, shuffle_state: !state.playbackState.shuffle_state }
      : null
  })),

  cycleRepeat: () => set((state) => {
    if (!state.playbackState) return state;
    const current = state.playbackState.repeat_state;
    const next = current === 'off' ? 'context' : current === 'context' ? 'track' : 'off';
    return {
      playbackState: { ...state.playbackState, repeat_state: next }
    };
  }),
}));
