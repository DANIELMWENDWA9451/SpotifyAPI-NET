import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { X, Heart, MoreHorizontal, ListMusic, Mic2, PictureInPicture, ChevronUp, ChevronDown, ExternalLink, Music, Pin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlayerStore } from '@/stores/playerStore';
import { useSpotifyPlayer } from '@/contexts/SpotifyPlayerContext';
import { AnimatedContainer } from '@/components/ui/animated-container';
import { trackApi, playerApi, libraryApi } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import type { SpotifyTrack } from '@/types/spotify';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AudioVisualizer } from '@/components/visualizer/AudioVisualizer';

interface NowPlayingViewProps {
  isOpen: boolean;
  onClose: () => void;
  onQueueClick?: () => void;
  initialTab?: 'now-playing' | 'lyrics';
  isPinned?: boolean;
  onPinToggle?: () => void;
}

interface LyricLine {
  startTimeMs: string;
  words: string;
  syllables?: unknown[];
  endTimeMs?: string;
}

interface LyricsData {
  lyrics: {
    syncType: string;
    lines: LyricLine[];
    provider: string;
    providerDisplayName: string;
  };
  colors: {
    background: number;
    text: number;
    highlightText: number;
  };
}

function LyricsDisplay({ trackId, track }: { trackId: string; track: SpotifyTrack }) {
  const { playbackState } = usePlayerStore();
  const currentProgress = playbackState?.progress_ms ?? 0;
  const activeLineRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /* 
     REAL-TIME SYNC LOGIC
     The Spotify API only updates progress every few seconds (polling). 
     To make lyrics scroll smoothly in real-time, we maintain a local timer.
  */
  const { data, isLoading, error } = useQuery({
    queryKey: ['lyrics', trackId],
    queryFn: () => trackApi.getLyrics(trackId),
    enabled: !!trackId,
    retry: 1,
  });

  const [localProgress, setLocalProgress] = useState(currentProgress);
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const requestRef = useRef<number>();
  const progressRef = useRef<number>(currentProgress); // Ref to hold latest progress

  // Sync local progress with global store whenever it fetches a new update
  useEffect(() => {
    setLocalProgress(currentProgress);
    progressRef.current = currentProgress; // Update ref too
    lastUpdateTimeRef.current = Date.now();
  }, [currentProgress]);

  // Run a high-frequency timer to interpolate progress between API polls
  // IMPORTANT: This effect only depends on is_playing, NOT currentProgress.
  // This prevents the loop from being cancelled/restarted on every poll.
  useEffect(() => {
    const animate = () => {
      const now = Date.now();
      const delta = now - lastUpdateTimeRef.current;

      // Cap delta to prevent huge jumps if browser tab was inactive
      const safeDelta = Math.min(delta, 200); // Max 200ms jump per frame

      // Calculate new progress from the ref (which holds latest store value)
      const newProgress = progressRef.current + (now - lastUpdateTimeRef.current);
      setLocalProgress(newProgress);

      requestRef.current = requestAnimationFrame(animate);
    };

    if (playbackState?.is_playing) {
      lastUpdateTimeRef.current = Date.now();
      requestRef.current = requestAnimationFrame(animate);
    } else {
      // If paused, sync to the exact store value
      setLocalProgress(progressRef.current);
    }

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [playbackState?.is_playing]); // ONLY depend on playing state

  const lyricsData = data as LyricsData | null;
  const lines = lyricsData?.lyrics?.lines || [];

  const activeLineIndex = lines.findIndex((line, index) => {
    const nextLine = lines[index + 1];
    const currentTime = localProgress; // Use the smooth local time
    const startTime = parseInt(line.startTimeMs);
    const endTime = nextLine ? parseInt(nextLine.startTimeMs) : Infinity;
    return currentTime >= startTime && currentTime < endTime;
  });

  // Initial scroll: Jump to active line immediately when panel opens
  // Use trackId to detect actual track changes vs component remounts
  const lastScrolledTrackRef = useRef<string | null>(null);
  useEffect(() => {
    // Only do initial scroll if track changed (not just route change)
    if (lines.length > 0 && activeLineRef.current && lastScrolledTrackRef.current !== trackId) {
      // Instant scroll on initial load or track change
      activeLineRef.current.scrollIntoView({
        behavior: 'instant',
        block: 'center',
      });
      lastScrolledTrackRef.current = trackId;
    }
  }, [lines.length, trackId]); // Only depend on trackId, not activeLineIndex

  // Continuous scroll: Smooth tracking as song plays (only after initial scroll)
  useEffect(() => {
    if (lastScrolledTrackRef.current === trackId && activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeLineIndex, trackId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 animate-pulse">
        <div className="h-4 w-3/4 bg-surface-3 rounded"></div>
        <div className="h-4 w-1/2 bg-surface-3 rounded"></div>
        <div className="h-4 w-2/3 bg-surface-3 rounded"></div>
      </div>
    );
  }

  if (error || !lines.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-20">
        <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h4 className="font-semibold mb-2">Lyrics couldn't be loaded</h4>
        <p className="text-sm text-muted-foreground mb-6">
          We couldn't fetch lyrics for this track. It might be instrumental or lyrics are restricted.
        </p>
        <a
          href={`https://open.spotify.com/track/${track.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-surface-2 text-foreground rounded-full text-sm font-medium hover:bg-surface-3 transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          Open in Spotify
        </a>
      </div>
    );
  }

  const isSynced = lyricsData?.lyrics?.syncType === 'LINE_SYNCED';

  // UNSYNCED LYRICS - Static Display
  if (!isSynced && lines.length > 0) {
    return (
      <div ref={containerRef} className="flex-1 overflow-y-auto space-y-4 py-4">
        {/* Track Info Header */}
        <div className="text-center mb-6 pb-4 border-b border-border/50">
          <h3 className="font-bold text-xl">{track.name}</h3>
          <p className="text-muted-foreground">{track.artists[0].name}</p>
        </div>

        {/* Notice */}
        <div className="bg-amber-500/10 text-amber-400 text-sm px-4 py-2 rounded-lg text-center mb-4">
          ⚠️ Synced lyrics not available. Showing plain lyrics.
        </div>

        {/* Static Lyrics List */}
        {lines.map((line, index) => (
          line.words.trim() ? (
            <div
              key={index}
              className="text-lg font-medium leading-relaxed py-2 px-6 text-foreground/80"
            >
              {line.words}
            </div>
          ) : null
        ))}

        <div className="text-center pt-8 pb-4">
          <p className="text-xs text-muted-foreground">
            Source: {lyricsData?.lyrics?.providerDisplayName || 'LrcLib'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto space-y-4 py-8 scroll-smooth relative"
      style={{
        maskImage: "linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)",
      }}
    >
      {/* Track Info Header - Floating */}
      <div className="text-center mb-8 sticky top-0 pt-4 pb-6 bg-gradient-to-b from-surface-1 via-surface-1/95 to-transparent z-10">
        <h3 className="font-bold text-2xl bg-gradient-to-r from-primary to-green-400 bg-clip-text text-transparent">{track.name}</h3>
        <p className="text-muted-foreground text-sm mt-1">{track.artists[0].name}</p>
      </div>

      {/* Synced Lyrics - Premium Animation */}
      {lines.map((line, index) => {
        const isActive = index === activeLineIndex;
        const isPast = index < activeLineIndex;
        const distance = Math.abs(index - activeLineIndex);

        return (
          <div
            key={index}
            ref={isActive ? activeLineRef : null}
            onClick={() => playerApi.seek(parseInt(line.startTimeMs))}
            className={cn(
              "leading-relaxed py-4 rounded-xl px-6 cursor-pointer",
              "transition-all ease-[cubic-bezier(0.4,0,0.2,1)]",
              isActive
                ? "text-2xl font-bold text-white scale-[1.08] my-2"
                : isPast
                  ? "text-lg font-medium text-muted-foreground/40 blur-[0.5px] hover:blur-0 hover:text-muted-foreground/70"
                  : "text-lg font-medium text-foreground/60 hover:text-foreground hover:scale-[1.03]"
            )}
            style={{
              willChange: "transform, opacity, filter",
              transitionDuration: isActive ? "400ms" : "300ms",
              ...(isActive && {
                background: "linear-gradient(135deg, rgba(29, 185, 84, 0.25) 0%, rgba(29, 185, 84, 0.1) 100%)",
                boxShadow: "0 0 30px rgba(29, 185, 84, 0.3), 0 4px 15px rgba(0,0,0,0.2)",
                borderLeft: "4px solid #1DB954",
                paddingLeft: "1.25rem",
              }),
              // Fade out lines that are far from active
              opacity: isActive ? 1 : Math.max(0.3, 1 - distance * 0.08),
            }}
          >
            {line.words}
          </div>
        );
      })}

      <div className="text-center pt-8 pb-4">
        <p className="text-xs text-muted-foreground">
          Source: {lyricsData?.lyrics?.providerDisplayName || 'Spotify'}
        </p>
      </div>
    </div>
  );
}

export function NowPlayingView({ isOpen, onClose, onQueueClick, initialTab = 'now-playing', isPinned = false, onPinToggle }: NowPlayingViewProps) {
  const { playbackState } = usePlayerStore();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);
  const [activeTab, setActiveTab] = useState<'now-playing' | 'lyrics'>(initialTab);
  const [lyricsExpanded, setLyricsExpanded] = useState(false);

  const track = playbackState?.item;

  if (!isOpen) return null;

  const handleLikeToggle = async () => {
    if (!track) return;
    const newState = !isLiked;
    setIsLiked(newState);

    try {
      if (newState) {
        await libraryApi.saveTrack(track.id);
        toast({ title: 'Added to Liked Songs' });
      } else {
        await libraryApi.removeSavedTrack(track.id);
        toast({ title: 'Removed from Liked Songs' });
      }
    } catch (error) {
      setIsLiked(!newState);
      toast({ title: 'Failed to update', variant: 'destructive' });
    }
  };

  const handleAddToQueue = async () => {
    if (!track) return;
    try {
      await playerApi.addToQueue(track.uri);
      toast({ title: `Added "${track.name}" to queue` });
    } catch (error) {
      toast({ title: 'Failed to add to queue', variant: 'destructive' });
    }
  };

  const handleGoToArtist = () => {
    if (track?.artists?.[0]?.id) {
      navigate(`/artist/${track.artists[0].id}`);
      onClose();
    }
  };

  const handleGoToAlbum = () => {
    if (track?.album?.id) {
      navigate(`/album/${track.album.id}`);
      onClose();
    }
  };

  const handleOpenInSpotify = () => {
    if (track) {
      window.open(`https://open.spotify.com/track/${track.id}`, '_blank');
    }
  };

  const handleShare = async () => {
    if (track) {
      const url = `https://open.spotify.com/track/${track.id}`;
      try {
        await navigator.clipboard.writeText(url);
        toast({ title: 'Link copied to clipboard' });
      } catch (error) {
        toast({ title: 'Failed to copy link', variant: 'destructive' });
      }
    }
  };

  return (
    <div className={cn(
      "fixed inset-y-0 right-0 w-[380px] bg-surface-1 border-l border-border z-50 flex flex-col",
      "animate-slide-in-right"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('now-playing')}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200",
              activeTab === 'now-playing'
                ? "bg-surface-3 text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-surface-2"
            )}
          >
            Now Playing
          </button>
          <button
            onClick={() => setActiveTab('lyrics')}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200",
              activeTab === 'lyrics'
                ? "bg-surface-3 text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-surface-2"
            )}
          >
            Lyrics
          </button>
        </div>
        <div className="flex items-center gap-1">
          {/* Pin Button */}
          {onPinToggle && (
            <button
              onClick={onPinToggle}
              className={cn(
                "p-2 rounded-full transition-all duration-200 hover:scale-105",
                isPinned
                  ? "bg-primary text-black hover:bg-primary/80"
                  : "hover:bg-surface-2 text-muted-foreground"
              )}
              title={isPinned ? "Unpin panel" : "Pin panel"}
            >
              <Pin className={cn("h-4 w-4", isPinned && "fill-current")} />
            </button>
          )}
          {/* Close Button */}
          <button
            onClick={onClose}
            className={cn(
              "p-2 hover:bg-surface-2 rounded-full transition-all duration-200 hover:scale-105",
              isPinned && "opacity-50 cursor-not-allowed"
            )}
            title={isPinned ? "Unpin to close" : "Close"}
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'now-playing' && track && (
          <AnimatedContainer animation="fade-in" className="flex flex-col items-center p-6">
            {/* Album Art */}
            <div
              className="w-full aspect-square max-w-[320px] mb-8 rounded-lg overflow-hidden shadow-2xl group relative cursor-pointer"
              onClick={handleGoToAlbum}
            >
              <img
                src={track.album?.images?.[0]?.url || '/placeholder.svg'}
                alt={track.album?.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Track Info */}
            <div className="w-full flex items-start justify-between mb-6">
              <div className="min-w-0 flex-1">
                <h2
                  className="text-2xl font-bold truncate mb-1 hover:underline cursor-pointer"
                  onClick={handleGoToAlbum}
                >
                  {track.name}
                </h2>
                <p
                  className="text-muted-foreground truncate hover:text-foreground cursor-pointer transition-colors"
                  onClick={handleGoToArtist}
                >
                  {track.artists?.map(a => a.name).join(', ')}
                </p>
              </div>
              <div className="flex items-center gap-1 ml-4">
                <button
                  onClick={handleLikeToggle}
                  className={cn(
                    "p-2 transition-all duration-200 hover:scale-110",
                    isLiked ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Heart className={cn("h-6 w-6", isLiked && "fill-current animate-heart-beat")} />
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-2 text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110">
                      <MoreHorizontal className="h-6 w-6" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-surface-3 border-border">
                    <DropdownMenuItem onClick={handleAddToQueue} className="hover:bg-surface-4 cursor-pointer">
                      Add to queue
                    </DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-surface-4 cursor-pointer">
                      Add to playlist
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleGoToArtist} className="hover:bg-surface-4 cursor-pointer">
                      Go to artist
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleGoToAlbum} className="hover:bg-surface-4 cursor-pointer">
                      Go to album
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleShare} className="hover:bg-surface-4 cursor-pointer">
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleOpenInSpotify} className="hover:bg-surface-4 cursor-pointer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open in Spotify
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Audio Visualizer */}
            <div className="w-full mb-6">
              <h3 className="text-sm font-semibold mb-3 px-1">Visualizer</h3>
              {track ? (
                <AudioVisualizer isPlaying={playbackState?.is_playing ?? false} />
              ) : (
                <div className="w-full h-32 bg-surface-2 rounded-xl flex items-center justify-center text-muted-foreground text-sm">
                  Play music to start visualizer
                </div>
              )}
            </div>

            {/* Additional Controls */}
            <div className="w-full flex items-center justify-center gap-4">
              <button
                onClick={() => setActiveTab('lyrics')}
                className="flex flex-col items-center gap-1 p-3 text-muted-foreground hover:text-foreground hover:bg-surface-2 rounded-lg transition-all duration-200"
              >
                <Mic2 className="h-5 w-5" />
                <span className="text-xs">Lyrics</span>
              </button>
              <button
                onClick={onQueueClick}
                className="flex flex-col items-center gap-1 p-3 text-muted-foreground hover:text-foreground hover:bg-surface-2 rounded-lg transition-all duration-200"
              >
                <ListMusic className="h-5 w-5" />
                <span className="text-xs">Queue</span>
              </button>
              <button
                onClick={handleOpenInSpotify}
                className="flex flex-col items-center gap-1 p-3 text-muted-foreground hover:text-foreground hover:bg-surface-2 rounded-lg transition-all duration-200"
              >
                <ExternalLink className="h-5 w-5" />
                <span className="text-xs">Spotify</span>
              </button>
            </div>
          </AnimatedContainer>
        )}

        {activeTab === 'lyrics' && (
          <div className="p-6 h-full flex flex-col">
            {track ? (
              <LyricsDisplay trackId={track.id} track={track} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-20">
                <Mic2 className="h-12 w-12 text-muted-foreground mb-4 animate-pulse-subtle" />
                <h3 className="text-lg font-semibold mb-2">No lyrics available</h3>
                <p className="text-muted-foreground text-sm">
                  Play a song to see lyrics
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'now-playing' && !track && (
          <AnimatedContainer animation="fade-in" className="flex flex-col items-center justify-center h-full text-center p-6">
            <ListMusic className="h-16 w-16 text-muted-foreground mb-6 animate-pulse-subtle" />
            <h3 className="text-xl font-semibold mb-2">No track playing</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              Play a song to see now playing information
            </p>
          </AnimatedContainer>
        )}
      </div>

      {/* Footer with credits */}
      <div className="p-4 border-t border-border text-center">
        <p className="text-xs text-muted-foreground">
          Powered by Spotify API
        </p>
      </div>
    </div>
  );
}