import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Volume1,
  Mic2,
  ListMusic,
  Laptop2,
  Maximize2,
  Minimize2,
  Heart,
  Music,
  PictureInPicture,
  Wifi,
  WifiOff,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlayerStore } from '@/stores/playerStore';
import { formatDuration } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { isBackendConfigured, playerApi, libraryApi } from '@/services/api';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PlayerPanelContext, usePlayerPanel } from './PlayerBarContext';
import { useSpotifyPlayer } from '@/contexts/SpotifyPlayerContext';

export { PlayerPanelContext, usePlayerPanel };

interface PlayerBarProps {
  onQueueClick?: () => void;
  onDevicesClick?: () => void;
  onNowPlayingClick?: () => void;
  onLyricsClick?: () => void;
  onFullscreenClick?: () => void;
  activePanel?: 'none' | 'queue' | 'devices' | 'nowPlaying' | 'lyrics';
}

export function PlayerBar({
  onQueueClick,
  onDevicesClick,
  onNowPlayingClick,
  onLyricsClick,
  onFullscreenClick,
  activePanel = 'none'
}: PlayerBarProps) {
  const {
    playbackState,
    volume,
    isMuted,
    setIsPlaying,
    setProgress,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat
  } = usePlayerStore();

  // Get SDK context
  const {
    isReady: sdkReady,
    isActive: sdkActive,
    isPremium,
    error: sdkError,
    deviceId,
    togglePlay,
    seek: sdkSeek,
    previousTrack: sdkPrevious,
    nextTrack: sdkNext,
    setVolume: setSdkVolume,
    transferPlayback,
    activateElement,
  } = useSpotifyPlayer();

  const [localProgress, setLocalProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPremiumBanner, setShowPremiumBanner] = useState(false);
  const progressInterval = useRef<ReturnType<typeof setInterval>>();
  const backendConfigured = isBackendConfigured();

  const track = playbackState?.item;
  const isPlaying = playbackState?.is_playing ?? false;
  const shuffleState = playbackState?.shuffle_state ?? false;
  const repeatState = playbackState?.repeat_state ?? 'off';
  const duration = track?.duration_ms ?? 0;
  const device = playbackState?.device;

  // Show premium banner if SDK error related to premium
  useEffect(() => {
    if (sdkError && sdkError.includes('Premium')) {
      setShowPremiumBanner(true);
    }
  }, [sdkError]);

  // Update local progress from store
  useEffect(() => {
    if (!isDragging && playbackState) {
      setLocalProgress(playbackState.progress_ms);
    }
  }, [playbackState?.progress_ms, isDragging]);

  // Progress simulation - SDK provides real-time updates, this is smoother visualization
  useEffect(() => {
    if (isPlaying && !isDragging) {
      const interval = sdkActive ? 100 : 1000; // Smoother for SDK
      progressInterval.current = setInterval(() => {
        setLocalProgress(prev => {
          const next = prev + interval;
          if (next >= duration) return 0;
          return next;
        });
      }, interval);
    } else {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    }
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [isPlaying, isDragging, duration, sdkActive]);

  const handlePlayPause = async () => {
    if (isActionLoading) return;
    setIsActionLoading(true);

    try {
      // First click may need to activate element for autoplay policy
      if (sdkReady && !sdkActive && deviceId) {
        await activateElement();
        await transferPlayback(true);
        return;
      }

      if (sdkActive) {
        await togglePlay();
      } else if (backendConfigured) {
        if (isPlaying) {
          await playerApi.pause();
        } else {
          await playerApi.play();
        }
        setIsPlaying(!isPlaying);
      }
    } catch (error) {
      console.error('Playback error:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSkipNext = async () => {
    if (sdkActive) {
      await sdkNext();
    } else if (backendConfigured) {
      try {
        await playerApi.skipNext();
      } catch (error) {
        console.error('Skip next error:', error);
      }
    }
  };

  const handleSkipPrevious = async () => {
    // If more than 3 seconds in, restart the track
    if (localProgress > 3000) {
      await handleSeek(0);
      return;
    }

    if (sdkActive) {
      await sdkPrevious();
    } else if (backendConfigured) {
      try {
        await playerApi.skipPrevious();
      } catch (error) {
        console.error('Skip previous error:', error);
      }
    }
  };

  const handleSeek = async (positionMs: number) => {
    setLocalProgress(positionMs);
    setProgress(positionMs);

    if (sdkActive) {
      await sdkSeek(positionMs);
    } else if (backendConfigured) {
      try {
        await playerApi.seek(positionMs);
      } catch (error) {
        console.error('Seek error:', error);
      }
    }
  };

  const handleProgressChange = (value: number[]) => {
    setLocalProgress(value[0]);
  };

  const handleProgressCommit = async (value: number[]) => {
    setIsDragging(false);
    await handleSeek(value[0]);
  };

  const handleVolumeChange = async (value: number[]) => {
    setVolume(value[0]);
    if (sdkActive) {
      await setSdkVolume(value[0]);
    } else if (backendConfigured) {
      try {
        await playerApi.setVolume(value[0]);
      } catch (error) {
        console.error('Volume error:', error);
      }
    }
  };

  const handleShuffleToggle = async () => {
    toggleShuffle();
    if (backendConfigured) {
      try {
        await playerApi.setShuffle(!shuffleState);
      } catch (error) {
        console.error('Shuffle error:', error);
      }
    }
  };

  const handleRepeatCycle = async () => {
    const nextState = repeatState === 'off' ? 'context' : repeatState === 'context' ? 'track' : 'off';
    cycleRepeat();
    if (backendConfigured) {
      try {
        await playerApi.setRepeat(nextState);
      } catch (error) {
        console.error('Repeat error:', error);
      }
    }
  };

  const handleLikeToggle = async () => {
    if (!track) return;
    const newState = !isLiked;
    setIsLiked(newState);

    if (backendConfigured) {
      try {
        if (newState) {
          await libraryApi.saveTrack(track.id);
        } else {
          await libraryApi.removeSavedTrack(track.id);
        }
      } catch (error) {
        console.error('Like error:', error);
        setIsLiked(!newState); // Revert on error
      }
    }
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    onFullscreenClick?.();
  };

  const VolumeIcon = isMuted || volume === 0
    ? VolumeX
    : volume < 50
      ? Volume1
      : Volume2;

  const RepeatIcon = repeatState === 'track' ? Repeat1 : Repeat;

  // Premium required banner
  if (showPremiumBanner && !isPremium) {
    return (
      <footer className="h-player bg-gradient-to-r from-amber-900/20 to-orange-900/20 border-t border-amber-500/20 px-4 flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-amber-500/20 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p className="font-medium text-sm">Spotify Premium Required</p>
            <p className="text-xs text-muted-foreground">
              Web playback requires Premium. You can still control other devices.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://www.spotify.com/premium/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Upgrade to Premium
          </a>
          <button
            onClick={() => setShowPremiumBanner(false)}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </div>
      </footer>
    );
  }

  // Empty state - waiting for backend or no track
  if (!track) {
    return (
      <footer className="h-player bg-surface-2 border-t border-border px-4 flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-3 flex-1">
          {!backendConfigured ? (
            <div className="flex items-center gap-3 text-muted-foreground">
              <WifiOff className="h-5 w-5 animate-pulse-subtle" />
              <p className="text-sm">Waiting for backend connection...</p>
            </div>
          ) : sdkReady ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-primary/20 flex items-center justify-center">
                <Wifi className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Web Player Ready</p>
                <p className="text-xs text-muted-foreground">Select a track to start playing</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-muted-foreground">
              <Music className="h-5 w-5" />
              <p className="text-sm">Select a track to play</p>
            </div>
          )}
        </div>

        {sdkReady && (
          <div className="flex items-center gap-2 mr-4">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-xs text-muted-foreground">Web Player Active</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onDevicesClick}
                className={cn(
                  "p-2 transition-all duration-200 hover:scale-110",
                  activePanel === 'devices' ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Laptop2 className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Connect to a device</TooltipContent>
          </Tooltip>
        </div>
      </footer>
    );
  }

  return (
    <footer className="fixed bottom-0 left-0 right-0 h-player z-[var(--z-player)] bg-black/80 backdrop-blur-xl border-t border-white/10 px-4 md:px-6 grid grid-cols-[1fr_2fr_1fr] items-center gap-4 transition-all duration-300 shadow-2xl safe-area-bottom">

      {/* 1. LEFT: Now Playing Info (Super Premium) */}
      <div className="flex items-center gap-4 min-w-0 group/track">
        <div className="relative shrink-0">
          <button
            onClick={onNowPlayingClick}
            className="relative block"
          >
            <img
              src={track.album.images[0]?.url || '/placeholder.svg'}
              alt={track.album.name}
              className={cn(
                "w-16 h-16 md:w-20 md:h-20 rounded-md object-cover shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover/track:scale-105",
                activePanel === 'nowPlaying' && "ring-2 ring-primary ring-offset-2 ring-offset-black"
              )}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/track:opacity-100 transition-opacity rounded-md">
              <Maximize2 className="h-6 w-6 text-white drop-shadow-md" />
            </div>
          </button>
        </div>

        <div className="min-w-0 flex-1 flex flex-col justify-center">
          <Link
            to={`/album/${track.album.id}`}
            className="text-base md:text-lg font-bold truncate hover:underline cursor-pointer transition-colors hover:text-primary leading-tight text-white mb-1"
          >
            {track.name}
          </Link>
          <div className="text-xs md:text-sm text-muted-foreground truncate font-medium">
            {track.artists.map((a, i) => (
              <span key={a.id}>
                <Link
                  to={`/artist/${a.id}`}
                  className="hover:text-white hover:underline transition-colors"
                >
                  {a.name}
                </Link>
                {i < track.artists.length - 1 && ', '}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={handleLikeToggle}
              className={cn(
                "transition-all duration-200 hover:scale-110 focus:outline-none",
                isLiked ? "text-primary" : "text-neutral-400 hover:text-white"
              )}
            >
              <Heart className={cn(
                "h-5 w-5",
                isLiked && "fill-current animate-heart-beat"
              )} />
            </button>

          </div>
        </div>
      </div>

      {/* 2. CENTER: Player Controls (Big & Bold) */}
      <div className="flex flex-col items-center justify-center h-full max-w-[720px] w-full mx-auto gap-2">

        {/* Buttons */}
        <div className="flex items-center gap-6">
          <button
            onClick={handleShuffleToggle}
            className={cn(
              "p-2 transition-all duration-200 hover:scale-110 relative hidden md:block",
              shuffleState ? "text-primary" : "text-neutral-400 hover:text-white"
            )}
          >
            <Shuffle className="h-5 w-5" />
            {shuffleState && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />}
          </button>

          <button
            onClick={handleSkipPrevious}
            className="text-neutral-300 hover:text-white transition-all duration-200 hover:scale-110 active:scale-95"
            aria-label="Skip to previous track"
            type="button"
          >
            <SkipBack className="h-8 w-8 fill-current" />
          </button>

          <button
            onClick={handlePlayPause}
            disabled={isActionLoading}
            className={cn(
              "w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-[0_4px_12px_rgba(0,0,0,0.3)]",
              "bg-white text-black hover:bg-white/90",
              isActionLoading && "opacity-80 scale-100 cursor-wait"
            )}
            aria-label={isPlaying ? "Pause" : "Play"}
            type="button"
          >
            {isActionLoading ? (
              <Loader2 className="h-7 w-7 md:h-8 md:w-8 animate-spin text-black" />
            ) : isPlaying ? (
              <Pause className="h-7 w-7 md:h-8 md:w-8 fill-current" />
            ) : (
              <Play className="h-7 w-7 md:h-8 md:w-8 fill-current ml-1" />
            )}
          </button>

          <button
            onClick={handleSkipNext}
            className="text-neutral-300 hover:text-white transition-all duration-200 hover:scale-110 active:scale-95"
            aria-label="Skip to next track"
            type="button"
          >
            <SkipForward className="h-8 w-8 fill-current" />
          </button>

          <button
            onClick={handleRepeatCycle}
            className={cn(
              "p-2 transition-all duration-200 relative hover:scale-110 hidden md:block",
              repeatState !== 'off' ? "text-primary" : "text-neutral-400 hover:text-white"
            )}
          >
            <RepeatIcon className="h-5 w-5" />
            {repeatState !== 'off' && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />}
          </button>
        </div>

        {/* Accessiblity / Progress */}
        <div className="flex items-center gap-3 w-full px-2 md:px-0">
          <span className="text-xs text-neutral-400 tabular-nums w-10 text-right font-medium">
            {formatDuration(localProgress)}
          </span>
          <Slider
            value={[localProgress]}
            max={duration}
            step={1000}
            onValueChange={handleProgressChange}
            onValueCommit={handleProgressCommit}
            onPointerDown={() => setIsDragging(true)}
            className="flex-1 h-1.5 md:h-2"
          />
          <span className="text-xs text-neutral-400 tabular-nums w-10 font-medium">
            {formatDuration(duration)}
          </span>
        </div>
      </div>

      {/* 3. RIGHT: Extra Tools (Volume, Queue, Lyrics, Devices) */}
      <div className="flex items-center justify-end gap-3 md:gap-4 min-w-0">

        {/* Current Device Indicator */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onDevicesClick}
              className={cn(
                "flex items-center gap-2 p-2 rounded-md transition-all sm:hidden lg:flex",
                device?.is_active ? "text-primary bg-primary/10" : "text-neutral-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Laptop2 className="h-5 w-5" />
              <span className="text-xs font-semibold max-w-[100px] truncate hidden xl:block">
                {device?.name || 'Device'}
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent className="bg-neutral-800 border-neutral-700 text-white">
            Change Device
          </TooltipContent>
        </Tooltip>

        <div className="w-px h-8 bg-white/10 hidden md:block mx-1"></div>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onNowPlayingClick}
              className={cn(
                "p-2.5 rounded-full transition-all duration-200 hover:bg-white/10",
                activePanel === 'nowPlaying' ? "text-primary" : "text-neutral-400 hover:text-white"
              )}
            >
              <PictureInPicture className="h-5 w-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Now Playing View</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onLyricsClick}
              className={cn(
                "p-2.5 rounded-full transition-all duration-200 hover:bg-white/10",
                activePanel === 'lyrics' ? "text-primary" : "text-neutral-400 hover:text-white"
              )}
            >
              <Mic2 className="h-5 w-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Lyrics</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onQueueClick}
              className={cn(
                "p-2.5 rounded-full transition-all duration-200 hover:bg-white/10",
                activePanel === 'queue' ? "text-primary" : "text-neutral-400 hover:text-white"
              )}
            >
              <ListMusic className="h-5 w-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Queue</TooltipContent>
        </Tooltip>

        {/* Volume - Simplified for Cleaner Look */}
        <div className="flex items-center gap-2 ml-2 hidden md:flex">
          <button
            onClick={toggleMute}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <VolumeIcon className="h-5 w-5" />
          </button>
          <Slider
            value={[volume]}
            max={100}
            step={1}
            onValueChange={handleVolumeChange}
            className="w-24 lg:w-32"
          />
        </div>

        <button
          onClick={handleFullscreen}
          className="p-2.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-all hidden md:block"
        >
          {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
        </button>
      </div>
    </footer>
  );
}
