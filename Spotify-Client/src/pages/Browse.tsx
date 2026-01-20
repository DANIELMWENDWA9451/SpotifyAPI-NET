import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Play, AlertCircle, TrendingUp, Disc3, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatedContainer } from '@/components/ui/animated-container';
import { SkeletonCard, SkeletonCategoryCard } from '@/components/ui/skeleton-cards';
import { browseApi, isBackendConfigured } from '@/services/api';
import type { SpotifyPlaylist, SpotifyAlbum, Category } from '@/types/spotify';

function AlbumCard({ album, index }: { album: SpotifyAlbum; index: number }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <AnimatedContainer delay={index * 40} animation="scale-in">
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
          <button onClick={(e) => e.preventDefault()} className={cn(
            "absolute bottom-2 right-2 w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-xl transition-all duration-300",
            "hover:scale-110 active:scale-95",
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          )}>
            <Play className="h-5 w-5 text-primary-foreground fill-current ml-0.5" />
          </button>
          <div className="absolute top-2 left-2 px-2 py-1 bg-primary text-primary-foreground text-xs font-bold rounded">
            NEW
          </div>
        </div>
        <h3 className="font-bold text-sm truncate mb-1">{album.name}</h3>
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
          <button onClick={(e) => e.preventDefault()} className={cn(
            "absolute bottom-2 right-2 w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-xl transition-all duration-300",
            "hover:scale-110 active:scale-95",
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          )}>
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

function CategoryCard({ category, index }: { category: Category; index: number }) {
  const gradients = [
    'from-pink-500 to-rose-500',
    'from-violet-500 to-purple-500',
    'from-blue-500 to-cyan-500',
    'from-green-500 to-emerald-500',
    'from-yellow-500 to-orange-500',
    'from-red-500 to-pink-500',
    'from-indigo-500 to-blue-500',
    'from-teal-500 to-green-500',
  ];
  const gradient = gradients[Math.abs(category.id.charCodeAt(0)) % gradients.length];

  return (
    <AnimatedContainer delay={index * 30} animation="scale-in">
      <Link
        to={`/genre/${category.id}`}
        className={cn(
          "relative aspect-square rounded-lg overflow-hidden block transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-100",
          `bg-gradient-to-br ${gradient}`
        )}
      >
        <h3 className="absolute top-4 left-4 text-xl font-bold text-white drop-shadow-lg">{category.name}</h3>
        {category.icons[0]?.url && (
          <img
            src={category.icons[0].url}
            alt={category.name}
            className="absolute bottom-0 right-0 w-24 h-24 object-cover rotate-25 translate-x-4 translate-y-4 shadow-lg"
          />
        )}
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
      <p className="text-muted-foreground max-w-md">Configure your backend URL to browse music.</p>
    </div>
  );
}

export default function Browse() {
  const backendConfigured = isBackendConfigured();

  const { data: newReleases, isLoading: newReleasesLoading } = useQuery({
    queryKey: ['newReleases'],
    queryFn: () => browseApi.getNewReleases(),
    enabled: backendConfigured,
    staleTime: 1000 * 60 * 15,
  });

  const { data: featuredData, isLoading: featuredLoading } = useQuery({
    queryKey: ['featuredPlaylists'],
    queryFn: () => browseApi.getFeaturedPlaylists(),
    enabled: backendConfigured,
    staleTime: 1000 * 60 * 10,
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: browseApi.getCategories,
    enabled: backendConfigured,
    staleTime: 1000 * 60 * 30,
  });

  const featuredPlaylists = featuredData?.playlists ?? [];

  if (!backendConfigured) {
    return <WaitingForBackend />;
  }

  const isLoading = newReleasesLoading || featuredLoading || categoriesLoading;

  return (
    
      <div className="p-6">
        {/* Page Header */}
        <AnimatedContainer animation="slide-up">
          <h1 className="text-4xl font-black mb-8">Browse</h1>
        </AnimatedContainer>

        {/* Quick Links */}
        <AnimatedContainer delay={50} animation="fade-in">
          <div className="flex flex-wrap gap-4 mb-8">
            <Link
              to="/recommendations"
              className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-primary/20 to-primary/5 rounded-lg hover:from-primary/30 hover:to-primary/10 transition-all duration-300 group"
            >
              <Sparkles className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
              <div>
                <p className="font-bold">Made For You</p>
                <p className="text-xs text-muted-foreground">Personalized recommendations</p>
              </div>
            </Link>
            <Link
              to="/browse/charts"
              className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/10 rounded-lg hover:from-yellow-500/30 hover:to-orange-500/20 transition-all duration-300 group"
            >
              <TrendingUp className="h-6 w-6 text-yellow-500 group-hover:scale-110 transition-transform" />
              <div>
                <p className="font-bold">Top Charts</p>
                <p className="text-xs text-muted-foreground">What's trending now</p>
              </div>
            </Link>
            <Link
              to="/recently-played"
              className="flex items-center gap-3 px-6 py-4 bg-surface-2/50 rounded-lg hover:bg-surface-2 transition-all duration-300 group"
            >
              <Disc3 className="h-6 w-6 text-muted-foreground group-hover:text-foreground group-hover:scale-110 transition-all" />
              <div>
                <p className="font-bold">Recently Played</p>
                <p className="text-xs text-muted-foreground">Your listening history</p>
              </div>
            </Link>
          </div>
        </AnimatedContainer>

        {/* New Releases */}
        <section className="mb-10">
          <AnimatedContainer delay={100} animation="fade-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Disc3 className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">New Releases</h2>
              </div>
              <Link to="/browse/new-releases" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors hover:underline">
                Show all
              </Link>
            </div>
          </AnimatedContainer>
          {newReleasesLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : newReleases && newReleases.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {newReleases.slice(0, 6).map((album, index) => (
                <AlbumCard key={album.id} album={album} index={index} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No new releases available</p>
          )}
        </section>

        {/* Featured Playlists */}
        <section className="mb-10">
          <AnimatedContainer delay={200} animation="fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Featured Playlists</h2>
            </div>
          </AnimatedContainer>
          {featuredLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : featuredPlaylists && featuredPlaylists.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {featuredPlaylists.slice(0, 6).map((playlist, index) => (
                <PlaylistCard key={playlist.id} playlist={playlist} index={index} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No featured playlists available</p>
          )}
        </section>

        {/* Browse Categories */}
        <section className="mb-10">
          <AnimatedContainer delay={300} animation="fade-in">
            <h2 className="text-2xl font-bold mb-4">Browse All</h2>
          </AnimatedContainer>
          {categoriesLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => <SkeletonCategoryCard key={i} />)}
            </div>
          ) : categories && categories.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {categories.map((category, index) => (
                <CategoryCard key={category.id} category={category} index={index} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No categories available</p>
          )}
        </section>
      </div>
    
  );
}
