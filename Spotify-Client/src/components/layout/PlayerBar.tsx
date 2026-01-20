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
  AlertTriangle
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
    // First click may need to activate element for autoplay policy
    if (sdkReady && !sdkActive && deviceId) {
      await activateElement();
      await transferPlayback(true);
      return;
    }

    if (sdkActive) {
      await togglePlay();
    } else if (backendConfigured) {
      try {
        if (isPlaying) {
          await playerApi.pause();
        } else {
          await playerApi.play();
        }
        setIsPlaying(!isPlaying);
      } catch (error) {
        console.error('Playback error:', error);
      }
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
    <footer className="h-player bg-surface-2 border-t border-border px-4 grid grid-cols-3 items-center animate-fade-in">
      {/* Now Playing Info */}
      <div className="flex items-center gap-4 min-w-0">
        <button 
          onClick={onNowPlayingClick}
          className="relative group"
        >
          <img
            src={track.album.images[0]?.url || '/placeholder.svg'}
            alt={track.album.name}
            className={cn(
              "w-14 h-14 rounded object-cover shadow-lg transition-all duration-300",
              "group-hover:brightness-75",
              activePanel === 'nowPlaying' && "ring-2 ring-primary"
            )}
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Maximize2 className="h-5 w-5 text-white" />
          </div>
        </button>
        <div className="min-w-0 flex-1">
          <Link 
            to={`/album/${track.album.id}`}
            className="text-sm font-medium truncate block hover:underline cursor-pointer transition-colors hover:text-primary"
          >
            {track.name}
          </Link>
          <p className="text-xs text-muted-foreground truncate">
            {track.artists.map((a, i) => (
              <span key={a.id}>
                <Link 
                  to={`/artist/${a.id}`}
                  className="hover:text-foreground hover:underline cursor-pointer transition-colors"
                >
                  {a.name}
                </Link>
                {i < track.artists.length - 1 && ', '}
              </span>
            ))}
          </p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              onClick={handleLikeToggle}
              className={cn(
                "p-2 transition-all duration-200",
                isLiked ? "text-primary" : "text-muted-foreground hover:text-foreground hover:scale-110"
              )}
            >
              <Heart className={cn(
                "h-4 w-4 transition-all",
                isLiked && "fill-current animate-heart-beat"
              )} />
            </button>
          </TooltipTrigger>
          <TooltipContent>{isLiked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="p-2 text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110">
              <PictureInPicture className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Mini Player</TooltipContent>
        </Tooltip>
      </div>

      {/* Player Controls */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={handleShuffleToggle}
                className={cn(
                  "p-2 transition-all duration-200 hover:scale-110 relative",
                  shuffleState ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Shuffle className="h-4 w-4" />
                {shuffleState && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>{shuffleState ? 'Disable shuffle' : 'Enable shuffle'}</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={handleSkipPrevious}
                className="p-2 text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110 active:scale-95"
              >
                <SkipBack className="h-5 w-5 fill-current" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Previous</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={handlePlayPause}
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-150 shadow-lg",
                  sdkActive ? "bg-primary" : "bg-foreground"
                )}
              >
                {isPlaying ? (
                  <Pause className={cn(
                    "h-5 w-5 fill-current",
                    sdkActive ? "text-primary-foreground" : "text-background"
                  )} />
                ) : (
                  <Play className={cn(
                    "h-5 w-5 fill-current ml-0.5",
                    sdkActive ? "text-primary-foreground" : "text-background"
                  )} />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {isPlaying ? 'Pause' : sdkReady && !sdkActive ? 'Start Web Playback' : 'Play'}
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={handleSkipNext}
                className="p-2 text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110 active:scale-95"
              >
                <SkipForward className="h-5 w-5 fill-current" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Next</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={handleRepeatCycle}
                className={cn(
                  "p-2 transition-all duration-200 relative hover:scale-110",
                  repeatState !== 'off' ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <RepeatIcon className="h-4 w-4" />
                {repeatState !== 'off' && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {repeatState === 'off' ? 'Enable repeat' : repeatState === 'context' ? 'Enable repeat one' : 'Disable repeat'}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-2 w-full max-w-[600px]">
          <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
            {formatDuration(localProgress)}
          </span>
          <Slider
            value={[localProgress]}
            max={duration}
            step={1000}
            onValueChange={handleProgressChange}
            onValueCommit={handleProgressCommit}
            onPointerDown={() => setIsDragging(true)}
            className="flex-1 group cursor-pointer"
          />
          <span className="text-xs text-muted-foreground tabular-nums w-10">
            {formatDuration(duration)}
          </span>
        </div>
      </div>

      {/* Volume & Extra Controls */}
      <div className="flex items-center justify-end gap-1">
        {/* SDK Status */}
        {sdkActive && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-full mr-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                <span className="text-xs text-primary font-medium">Web Player</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>Playing in this browser</TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              onClick={onNowPlayingClick}
              className={cn(
                "p-2 transition-all duration-200 hover:scale-110",
                activePanel === 'nowPlaying' ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <PictureInPicture className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Now Playing View</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              onClick={onLyricsClick}
              className={cn(
                "p-2 transition-all duration-200 hover:scale-110",
                activePanel === 'lyrics' ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Mic2 className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Lyrics</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              onClick={onQueueClick}
              className={cn(
                "p-2 transition-all duration-200 hover:scale-110",
                activePanel === 'queue' ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ListMusic className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Queue</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              onClick={onDevicesClick}
              className={cn(
                "p-2 transition-all duration-200 hover:scale-110 relative",
                activePanel === 'devices' ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Laptop2 className="h-4 w-4" />
              {(device || sdkActive) && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full animate-pulse" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            {sdkActive ? 'Playing on Web Player' : device ? `Playing on ${device.name}` : 'Connect to a device'}
          </TooltipContent>
        </Tooltip>
        
        <div 
          className="flex items-center gap-1 group"
          onMouseEnter={() => setShowVolumeSlider(true)}
          onMouseLeave={() => setShowVolumeSlider(false)}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={toggleMute}
                className="p-2 text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110"
              >
                <VolumeIcon className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{isMuted ? 'Unmute' : 'Mute'}</TooltipContent>
          </Tooltip>
          <div className={cn(
            "overflow-hidden transition-all duration-300",
            showVolumeSlider ? "w-24 opacity-100" : "w-0 opacity-0"
          )}>
            <Slider
              value={[volume]}
              max={100}
              step={1}
              onValueChange={handleVolumeChange}
              className="w-24"
            />
          </div>
        </div>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              onClick={handleFullscreen}
              className="p-2 text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>{isFullscreen ? 'Exit full screen' : 'Full screen'}</TooltipContent>
        </Tooltip>
      </div>
    </footer>
  );
}
