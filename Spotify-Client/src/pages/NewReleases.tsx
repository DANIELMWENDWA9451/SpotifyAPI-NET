import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Play, AlertCircle, Disc3, Filter, Calendar, Music2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatedContainer } from '@/components/ui/animated-container';
import { SkeletonCard } from '@/components/ui/skeleton-cards';
import { browseApi, isBackendConfigured } from '@/services/api';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SpotifyAlbum } from '@/types/spotify';

type AlbumType = 'all' | 'album' | 'single' | 'compilation';
type SortOption = 'newest' | 'oldest' | 'name';

function AlbumCard({ album, index }: { album: SpotifyAlbum; index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  
  const releaseDate = new Date(album.release_date);
  const formattedDate = releaseDate.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: releaseDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  });

  return (
    <AnimatedContainer delay={Math.min(index * 30, 300)} animation="scale-in">
      <Link 
        to={`/album/${album.id}`}
        className="group relative bg-surface-2/50 hover:bg-surface-2 rounded-md p-4 transition-all duration-300 block transform hover:-translate-y-1"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative mb-4 overflow-hidden rounded-md shadow-lg">
          <img
            src={album.images[0]?.url || '/placeholder.svg'}
            alt={album.name}
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
          <div className="absolute top-2 left-2 px-2 py-1 bg-primary text-primary-foreground text-xs font-bold rounded">
            NEW
          </div>
          {album.album_type && album.album_type !== 'album' && (
            <div className="absolute top-2 right-2 px-2 py-1 bg-surface-2/90 backdrop-blur-sm text-xs font-medium rounded capitalize">
              {album.album_type}
            </div>
          )}
        </div>
        <h3 className="font-bold text-sm truncate mb-1">{album.name}</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <Calendar className="h-3 w-3" />
          <span>{formattedDate}</span>
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {album.artists.map((a, i) => (
            <span key={a.id}>
              {a.name}{i < album.artists.length - 1 && ', '}
            </span>
          ))}
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
      <p className="text-muted-foreground max-w-md">Configure your backend URL to browse new releases.</p>
    </div>
  );
}

export default function NewReleases() {
  const [albumType, setAlbumType] = useState<AlbumType>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [limit, setLimit] = useState(50);
  
  const backendConfigured = isBackendConfigured();

  const { data: albums, isLoading, isFetching } = useQuery({
    queryKey: ['newReleases', 'full', limit],
    queryFn: () => browseApi.getNewReleases(limit, 0),
    enabled: backendConfigured,
    staleTime: 1000 * 60 * 10,
  });

  // Filter and sort albums
  const filteredAlbums = albums
    ?.filter(album => albumType === 'all' || album.album_type === albumType)
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.release_date).getTime() - new Date(a.release_date).getTime();
      } else if (sortBy === 'oldest') {
        return new Date(a.release_date).getTime() - new Date(b.release_date).getTime();
      } else {
        return a.name.localeCompare(b.name);
      }
    }) ?? [];

  if (!backendConfigured) {
    return <WaitingForBackend />;
  }

  return (
    
      <div className="p-6">
        {/* Page Header */}
        <AnimatedContainer animation="slide-up">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
              <Disc3 className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-4xl font-black">New Releases</h1>
              <p className="text-muted-foreground">The latest albums, singles, and EPs</p>
            </div>
          </div>
        </AnimatedContainer>

        {/* Filters */}
        <AnimatedContainer delay={100} animation="fade-in">
          <div className="flex flex-wrap items-center gap-4 my-6 p-4 bg-surface-2/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <Select value={albumType} onValueChange={(v: AlbumType) => setAlbumType(v)}>
              <SelectTrigger className="w-[140px] bg-surface-2">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="album">Albums</SelectItem>
                <SelectItem value="single">Singles</SelectItem>
                <SelectItem value="compilation">Compilations</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v: SortOption) => setSortBy(v)}>
              <SelectTrigger className="w-[140px] bg-surface-2">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
              </SelectContent>
            </Select>

            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {filteredAlbums.length} {filteredAlbums.length === 1 ? 'release' : 'releases'}
              </span>
              {limit < 50 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setLimit(prev => Math.min(prev + 20, 50))}
                  disabled={isFetching}
                >
                  Load More
                </Button>
              )}
            </div>
          </div>
        </AnimatedContainer>

        {/* Albums Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filteredAlbums.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {filteredAlbums.map((album, index) => (
              <AlbumCard key={album.id} album={album} index={index} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Music2 className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-bold mb-2">No releases found</h3>
            <p className="text-muted-foreground">Try adjusting your filters</p>
          </div>
        )}
      </div>
    
  );
}
