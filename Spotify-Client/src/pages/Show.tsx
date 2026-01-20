import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Play, Pause, Heart, MoreHorizontal, AlertCircle, Check, Bell, Clock } from 'lucide-react';
import { cn, formatDuration } from '@/lib/utils';
import { AnimatedContainer } from '@/components/ui/animated-container';
import { SkeletonTrackRow } from '@/components/ui/skeleton-cards';
import { showApi, isBackendConfigured } from '@/services/api';
import type { SpotifyShow, SpotifyEpisode } from '@/types/spotify';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ShowDetails extends SpotifyShow {
  episodes: {
    items: SpotifyEpisode[];
    total: number;
  };
}

function EpisodeRow({ episode, index, isPlaying, onPlay }: { 
  episode: SpotifyEpisode; 
  index: number; 
  isPlaying: boolean;
  onPlay: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const formattedDate = new Date(episode.release_date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <AnimatedContainer delay={index * 30} animation="fade-in">
      <div 
        className={cn(
          "group p-4 rounded-md transition-all duration-150 border-b border-border/50",
          isPlaying ? "bg-surface-2" : "hover:bg-surface-2/50"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex gap-4">
          <Link to={`/episode/${episode.id}`} className="shrink-0">
            <img
              src={episode.images[0]?.url || '/placeholder.svg'}
              alt={episode.name}
              className="w-28 h-28 rounded object-cover shadow-sm hover:shadow-md transition-shadow"
            />
          </Link>
          <div className="flex-1 min-w-0">
            <Link 
              to={`/episode/${episode.id}`}
              className={cn(
                "font-bold text-base hover:underline transition-colors block truncate",
                isPlaying ? "text-primary" : ""
              )}
            >
              {episode.name}
            </Link>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {episode.description}
            </p>
            <div className="flex items-center gap-4 mt-3">
              <button 
                onClick={onPlay}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                  isPlaying 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-surface-3 hover:bg-surface-4 hover:scale-105"
                )}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4 fill-current" />
                ) : (
                  <Play className="h-4 w-4 fill-current ml-0.5" />
                )}
              </button>
              <span className="text-xs text-muted-foreground">{formattedDate}</span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">{formatDuration(episode.duration_ms)}</span>
              <div className="ml-auto flex items-center gap-2">
                <button 
                  onClick={() => setIsSaved(!isSaved)}
                  className={cn(
                    "p-2 rounded-full transition-all",
                    isSaved ? "text-primary" : "text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100"
                  )}
                >
                  <Heart className={cn("h-4 w-4", isSaved && "fill-current")} />
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-2 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-surface-3 border-border">
                    <DropdownMenuItem className="hover:bg-surface-4">Add to queue</DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-surface-4">Save to Your Episodes</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="hover:bg-surface-4">Share</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
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
      <p className="text-muted-foreground max-w-md">Configure your backend URL to view podcasts.</p>
    </div>
  );
}

export default function Show() {
  const { id } = useParams<{ id: string }>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentEpisodeId, setCurrentEpisodeId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const backendConfigured = isBackendConfigured();

  const { data: show, isLoading, error } = useQuery({
    queryKey: ['show', id],
    queryFn: () => showApi.getShow(id!) as Promise<ShowDetails>,
    enabled: backendConfigured && !!id,
    staleTime: 1000 * 60 * 5,
  });

  if (!backendConfigured) {
    return <WaitingForBackend />;
  }

  if (isLoading) {
    return (
      
        <div className="animate-fade-in">
          <div className="flex gap-6 p-6 pb-4 bg-gradient-to-b from-surface-3/50 to-transparent">
            <div className="w-56 h-56 bg-surface-3 rounded shadow-2xl animate-pulse" />
            <div className="flex flex-col justify-end gap-2">
              <div className="h-4 w-16 bg-surface-3 rounded animate-pulse" />
              <div className="h-12 w-96 bg-surface-3 rounded animate-pulse" />
              <div className="h-4 w-64 bg-surface-3 rounded animate-pulse mt-4" />
            </div>
          </div>
          <div className="px-6 pt-4">
            {[...Array(5)].map((_, i) => <SkeletonTrackRow key={i} />)}
          </div>
        </div>
      
    );
  }

  if (error || !show) {
    return (
      
        <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
          <h2 className="text-2xl font-bold mb-2">Podcast not found</h2>
          <p className="text-muted-foreground">This podcast doesn't exist or is not available.</p>
        </div>
      
    );
  }

  const episodes = show.episodes?.items ?? [];

  return (
    
      <div className="min-h-full">
        {/* Header */}
        <AnimatedContainer animation="fade-in">
          <div className="flex items-end gap-6 p-6 pb-6 bg-gradient-to-b from-surface-3/60 to-transparent">
            <img
              src={show.images[0]?.url || '/placeholder.svg'}
              alt={show.name}
              className="w-56 h-56 rounded-lg shadow-2xl object-cover transition-transform hover:scale-[1.02]"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider mb-2">Podcast</p>
              <h1 className="text-5xl font-black mb-4 line-clamp-2">{show.name}</h1>
              <p className="font-bold text-lg mb-2">{show.publisher}</p>
            </div>
          </div>
        </AnimatedContainer>

        {/* Action Bar */}
        <AnimatedContainer delay={100} animation="fade-in">
          <div className="flex items-center gap-4 px-6 py-4">
            <button 
              onClick={() => setIsFollowing(!isFollowing)}
              className={cn(
                "px-6 py-3 rounded-full font-bold text-sm transition-all hover:scale-105",
                isFollowing 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-transparent border border-muted-foreground hover:border-foreground"
              )}
            >
              {isFollowing ? (
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Following
                </span>
              ) : (
                'Follow'
              )}
            </button>
            <button className="p-2 text-muted-foreground hover:text-foreground transition-all hover:scale-110">
              <Bell className="h-6 w-6" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 text-muted-foreground hover:text-foreground transition-all hover:scale-110">
                  <MoreHorizontal className="h-6 w-6" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 bg-surface-3 border-border">
                <DropdownMenuItem className="hover:bg-surface-4">Don't play this</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="hover:bg-surface-4">Share</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </AnimatedContainer>

        {/* About Section */}
        <AnimatedContainer delay={150} animation="fade-in">
          <div className="px-6 py-4">
            <h2 className="text-xl font-bold mb-2">About</h2>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-3xl line-clamp-3">
              {show.description}
            </p>
          </div>
        </AnimatedContainer>

        {/* Episodes */}
        <div className="px-6 pb-6">
          <AnimatedContainer delay={200} animation="fade-in">
            <h2 className="text-xl font-bold mb-4">All Episodes</h2>
          </AnimatedContainer>
          
          <div className="space-y-2">
            {episodes.map((episode, index) => (
              <EpisodeRow
                key={episode.id}
                episode={episode}
                index={index}
                isPlaying={currentEpisodeId === episode.id && isPlaying}
                onPlay={() => {
                  setCurrentEpisodeId(episode.id);
                  setIsPlaying(true);
                }}
              />
            ))}
          </div>

          {episodes.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              No episodes available
            </div>
          )}
        </div>
      </div>
    
  );
}
