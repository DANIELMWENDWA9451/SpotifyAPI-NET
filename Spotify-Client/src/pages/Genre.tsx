import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Play, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatedContainer } from '@/components/ui/animated-container';
import { SkeletonCard } from '@/components/ui/skeleton-cards';
import { browseApi, isBackendConfigured } from '@/services/api';
import type { SpotifyPlaylist } from '@/types/spotify';

function PlaylistCard({ playlist, index }: { playlist: SpotifyPlaylist; index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <AnimatedContainer delay={index * 40} animation="scale-in">
      <Link 
        to={`/playlist/${playlist.id}`}
        className="group relative bg-surface-2/50 hover:bg-surface-2 rounded-md p-4 transition-all duration-300 block transform hover:-translate-y-1"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative mb-4 overflow-hidden rounded-md shadow-lg">
          <img
            src={playlist.images[0]?.url || '/placeholder.svg'}
            alt={playlist.name}
            className={cn(
              "w-full aspect-square object-cover transition-transform duration-500",
              isHovered && "scale-105"
            )}
          />
          <button 
            onClick={(e) => e.preventDefault()}
            className={cn(
              "absolute bottom-2 right-2 w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-xl transition-all duration-300",
              "hover:scale-110 active:scale-95",
              isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            )}
          >
            <Play className="h-5 w-5 text-primary-foreground fill-current ml-0.5" />
          </button>
        </div>
        <h3 className="font-bold text-sm truncate mb-1">{playlist.name}</h3>
        <p className="text-xs text-muted-foreground truncate line-clamp-2">
          {playlist.description || `By ${playlist.owner.display_name}`}
        </p>
      </Link>
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
      <p className="text-muted-foreground max-w-md">Configure your backend URL to browse genres.</p>
    </div>
  );
}

export default function Genre() {
  const { id } = useParams<{ id: string }>();
  const backendConfigured = isBackendConfigured();

  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: ['category', id],
    queryFn: () => browseApi.getCategory(id!),
    enabled: backendConfigured && !!id,
    staleTime: 1000 * 60 * 10, // Categories rarely change
  });

  const { data: playlists, isLoading: playlistsLoading } = useQuery({
    queryKey: ['categoryPlaylists', id],
    queryFn: () => browseApi.getCategoryPlaylists(id!),
    enabled: backendConfigured && !!id,
    staleTime: 1000 * 60 * 5,
  });

  if (!backendConfigured) {
    return <WaitingForBackend />;
  }

  const isLoading = categoryLoading || playlistsLoading;

  if (isLoading) {
    return (
      
        <div className="p-6 animate-fade-in">
          <div className="h-12 w-64 bg-surface-3 rounded mb-8 animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[...Array(18)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      
    );
  }

  return (
    
      <div className="p-6">
        <AnimatedContainer animation="slide-up">
          <h1 className="text-4xl font-black mb-8">{category?.name || 'Genre'}</h1>
        </AnimatedContainer>

        {playlists && playlists.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {playlists.map((playlist, index) => (
              <PlaylistCard key={playlist.id} playlist={playlist} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            No playlists found for this genre
          </div>
        )}
      </div>
    
  );
}
