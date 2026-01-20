import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Play, Pause, Heart, MoreHorizontal, AlertCircle, ArrowLeft, Clock } from 'lucide-react';
import { cn, formatDuration } from '@/lib/utils';
import { AnimatedContainer } from '@/components/ui/animated-container';
import { episodeApi, isBackendConfigured } from '@/services/api';
import type { SpotifyEpisode } from '@/types/spotify';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function WaitingForBackend() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center mb-6 animate-bounce-subtle">
        <AlertCircle className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Waiting for Backend</h2>
      <p className="text-muted-foreground max-w-md">Configure your backend URL to view episodes.</p>
    </div>
  );
}

export default function Episode() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const backendConfigured = isBackendConfigured();

  const { data: episode, isLoading, error } = useQuery({
    queryKey: ['episode', id],
    queryFn: () => episodeApi.getEpisode(id!),
    enabled: backendConfigured && !!id,
    staleTime: 1000 * 60 * 10,
  });

  if (!backendConfigured) {
    return <WaitingForBackend />;
  }

  if (isLoading) {
    return (
      
        <div className="p-6 max-w-4xl mx-auto animate-fade-in">
          <div className="flex gap-6 mb-8">
            <div className="w-64 h-64 bg-surface-3 rounded-lg animate-pulse" />
            <div className="flex-1">
              <div className="h-4 w-24 bg-surface-3 rounded animate-pulse mb-2" />
              <div className="h-10 w-full bg-surface-3 rounded animate-pulse mb-4" />
              <div className="h-6 w-48 bg-surface-3 rounded animate-pulse" />
            </div>
          </div>
          <div className="h-32 bg-surface-3 rounded animate-pulse" />
        </div>
      
    );
  }

  if (error || !episode) {
    return (
      
        <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
          <h2 className="text-2xl font-bold mb-2">Episode not found</h2>
          <p className="text-muted-foreground">This episode doesn't exist.</p>
        </div>
      
    );
  }

  const formattedDate = new Date(episode.release_date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    
      <div className="min-h-full max-w-4xl mx-auto p-6">
        {/* Back button */}
        <AnimatedContainer animation="fade-in">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </button>
        </AnimatedContainer>

        {/* Episode Header */}
        <AnimatedContainer delay={50} animation="fade-in">
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <img
              src={episode.images[0]?.url || '/placeholder.svg'}
              alt={episode.name}
              className="w-64 h-64 rounded-lg shadow-2xl object-cover"
            />
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Podcast Episode
              </p>
              <h1 className="text-3xl font-black mb-4">{episode.name}</h1>
              <Link 
                to={`/show/${episode.show.id}`}
                className="font-bold text-lg hover:underline"
              >
                {episode.show.name}
              </Link>
            </div>
          </div>
        </AnimatedContainer>

        {/* Action Bar */}
        <AnimatedContainer delay={100} animation="fade-in">
          <div className="flex items-center gap-4 mb-8">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-14 h-14 rounded-full bg-primary flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-xl"
            >
              {isPlaying ? (
                <Pause className="h-6 w-6 text-primary-foreground fill-current" />
              ) : (
                <Play className="h-6 w-6 text-primary-foreground fill-current ml-1" />
              )}
            </button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{formattedDate}</span>
              <span>•</span>
              <Clock className="h-4 w-4" />
              <span>{formatDuration(episode.duration_ms)}</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button 
                onClick={() => setIsSaved(!isSaved)}
                className={cn(
                  "p-2 transition-all hover:scale-110",
                  isSaved ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Heart className={cn("h-6 w-6", isSaved && "fill-current")} />
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 text-muted-foreground hover:text-foreground transition-all hover:scale-110">
                    <MoreHorizontal className="h-6 w-6" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-surface-3 border-border">
                  <DropdownMenuItem className="hover:bg-surface-4">Add to queue</DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-surface-4">Save to Your Episodes</DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-surface-4">Go to show</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="hover:bg-surface-4">Share</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </AnimatedContainer>

        {/* Episode Description */}
        <AnimatedContainer delay={150} animation="fade-in">
          <div className="bg-surface-1 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Episode Description</h2>
            <div 
              className="text-muted-foreground leading-relaxed prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: episode.html_description || episode.description }}
            />
          </div>
        </AnimatedContainer>

        {/* Show Link */}
        <AnimatedContainer delay={200} animation="fade-in">
          <div className="mt-8 p-4 bg-surface-2/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">See all episodes</p>
            <Link 
              to={`/show/${episode.show.id}`}
              className="flex items-center gap-4 hover:bg-surface-2 rounded-md p-2 -m-2 transition-colors"
            >
              <img
                src={episode.show.images[0]?.url || '/placeholder.svg'}
                alt={episode.show.name}
                className="w-16 h-16 rounded object-cover"
              />
              <div>
                <p className="font-bold">{episode.show.name}</p>
                <p className="text-sm text-muted-foreground">{episode.show.publisher}</p>
              </div>
            </Link>
          </div>
        </AnimatedContainer>
      </div>
    
  );
}
