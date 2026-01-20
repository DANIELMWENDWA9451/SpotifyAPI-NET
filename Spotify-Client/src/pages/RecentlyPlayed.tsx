import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Play, Pause, Heart, MoreHorizontal, AlertCircle, Clock, History } from 'lucide-react';
import { cn, formatDuration } from '@/lib/utils';
import { AnimatedContainer } from '@/components/ui/animated-container';
import { SkeletonTrackRow } from '@/components/ui/skeleton-cards';
import { userApi, isBackendConfigured } from '@/services/api';
import type { SpotifyTrack } from '@/types/spotify';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PlayHistoryItem {
  track: SpotifyTrack;
  played_at: string;
}

function TrackRow({ item, index, isPlaying, onPlay }: { 
  item: PlayHistoryItem; 
  index: number; 
  isPlaying: boolean;
  onPlay: () => void;
}) {
  const track = item.track;
  const [isLiked, setIsLiked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const playedDate = new Date(item.played_at);
  const now = new Date();
  const diffMs = now.getTime() - playedDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  let timeAgo = '';
  if (diffMins < 60) {
    timeAgo = `${diffMins}m ago`;
  } else if (diffHours < 24) {
    timeAgo = `${diffHours}h ago`;
  } else if (diffDays < 7) {
    timeAgo = `${diffDays}d ago`;
  } else {
    timeAgo = playedDate.toLocaleDateString();
  }

  return (
    <AnimatedContainer delay={index * 20} animation="fade-in">
      <div 
        className={cn(
          "group grid grid-cols-[16px_6fr_4fr_2fr_minmax(80px,1fr)] gap-4 px-4 py-2 rounded-md items-center text-sm transition-all duration-150",
          isPlaying ? "bg-surface-2" : "hover:bg-surface-2/50"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDoubleClick={onPlay}
      >
        <div className="flex items-center justify-center">
          {isHovered || isPlaying ? (
            <button onClick={onPlay} className="text-foreground hover:text-primary transition-colors">
              {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
            </button>
          ) : (
            <span className={cn("tabular-nums", isPlaying ? "text-primary" : "text-muted-foreground")}>
              {index + 1}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 min-w-0">
          <Link to={`/album/${track.album.id}`}>
            <img
              src={track.album.images[0]?.url || '/placeholder.svg'}
              alt={track.album.name}
              className="w-10 h-10 rounded object-cover shadow-sm"
            />
          </Link>
          <div className="min-w-0">
            <p className={cn(
              "font-medium truncate transition-colors",
              isPlaying ? "text-primary" : "group-hover:text-primary"
            )}>
              {track.name}
              {track.explicit && (
                <span className="ml-2 text-[10px] bg-muted-foreground/30 px-1 rounded uppercase">E</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {track.artists.map((a, i) => (
                <span key={a.id}>
                  <Link to={`/artist/${a.id}`} className="hover:underline hover:text-foreground">{a.name}</Link>
                  {i < track.artists.length - 1 && ', '}
                </span>
              ))}
            </p>
          </div>
        </div>

        <Link to={`/album/${track.album.id}`} className="text-muted-foreground truncate hover:underline hover:text-foreground">
          {track.album.name}
        </Link>

        <span className="text-xs text-muted-foreground">{timeAgo}</span>

        <div className="flex items-center justify-end gap-3">
          <button 
            onClick={() => setIsLiked(!isLiked)}
            className={cn("transition-all duration-200", isLiked ? "opacity-100" : "opacity-0 group-hover:opacity-100")}
          >
            <Heart className={cn("h-4 w-4 transition-all", isLiked ? "text-primary fill-primary" : "text-muted-foreground hover:text-foreground")} />
          </button>
          <span className="text-muted-foreground tabular-nums">{formatDuration(track.duration_ms)}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-surface-3 rounded transition-all">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-surface-3 border-border">
              <DropdownMenuItem className="hover:bg-surface-4">Add to queue</DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-surface-4">
                <Link to={`/artist/${track.artists[0]?.id}`} className="w-full">Go to artist</Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-surface-4">
                <Link to={`/album/${track.album.id}`} className="w-full">Go to album</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="hover:bg-surface-4">Add to playlist</DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-surface-4">Share</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </AnimatedContainer>
  );
}

function WaitingForBackend() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center mb-6 animate-bounce-subtle">
        <AlertCircle className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Waiting for Backend</h2>
      <p className="text-muted-foreground max-w-md">Configure your backend URL to view your listening history.</p>
    </div>
  );
}

export default function RecentlyPlayed() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const backendConfigured = isBackendConfigured();

  const { data: recentlyPlayed, isLoading, error } = useQuery({
    queryKey: ['recentlyPlayedFull'],
    queryFn: () => userApi.getRecentlyPlayed(50),
    enabled: backendConfigured,
    staleTime: 1000 * 60 * 2,
  });

  if (!backendConfigured) {
    return <WaitingForBackend />;
  }

  if (isLoading) {
    return (
      
        <div className="p-6 animate-fade-in">
          <div className="h-10 w-64 bg-surface-3 rounded mb-8 animate-pulse" />
          {[...Array(20)].map((_, i) => <SkeletonTrackRow key={i} />)}
        </div>
      
    );
  }

  const historyItems = recentlyPlayed?.items ?? [];

  return (
    
      <div className="p-6">
        {/* Header */}
        <AnimatedContainer animation="slide-up">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
              <History className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-black">Recently Played</h1>
              <p className="text-muted-foreground">Your listening history</p>
            </div>
          </div>
        </AnimatedContainer>

        {/* Track List */}
        {historyItems.length > 0 ? (
          <div className="bg-surface-1/30 rounded-lg overflow-hidden">
            <AnimatedContainer delay={100} animation="fade-in">
              <div className="grid grid-cols-[16px_6fr_4fr_2fr_minmax(80px,1fr)] gap-4 px-4 py-2 border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                <span>#</span>
                <span>Title</span>
                <span>Album</span>
                <span>Played</span>
                <span className="text-right"><Clock className="h-4 w-4 inline" /></span>
              </div>
            </AnimatedContainer>
            {historyItems.map((item, index) => (
              <TrackRow
                key={`${item.track.id}-${item.played_at}`}
                item={item}
                index={index}
                isPlaying={currentTrackId === item.track.id && isPlaying}
                onPlay={() => {
                  setCurrentTrackId(item.track.id);
                  setIsPlaying(true);
                }}
              />
            ))}
          </div>
        ) : (
          <AnimatedContainer animation="fade-in">
            <div className="text-center py-20">
              <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">No listening history</h2>
              <p className="text-muted-foreground">Start playing music to see your history here</p>
            </div>
          </AnimatedContainer>
        )}
      </div>
    
  );
}
