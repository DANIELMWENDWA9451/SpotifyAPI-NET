import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Play, Clock, AlertCircle, Heart, Sparkles, ChevronRight } from 'lucide-react';
import { cn, getGreeting, formatDuration } from '@/lib/utils';
import { userApi, playerApi, recommendationsApi, isBackendConfigured } from '@/services/api';
import { SkeletonCard, SkeletonQuickPlay, SkeletonTrackRow } from '@/components/ui/skeleton-cards';
import { AnimatedContainer } from '@/components/ui/animated-container';
import type { SpotifyPlaylist, SpotifyTrack, SpotifyAlbum } from '@/types/spotify';

type FilterTab = 'all' | 'music' | 'podcasts';

// ============ COMPACT QUICK PLAY CARD (Spotify Style) ============
function QuickPlayCard({ item, index, type = 'playlist' }: {
  item: SpotifyPlaylist | SpotifyAlbum | SpotifyTrack;
  index: number;
  type?: 'playlist' | 'album' | 'track';
}) {
  const [isHovered, setIsHovered] = useState(false);

  const getLink = () => {
    if (type === 'track') return `/album/${(item as SpotifyTrack).album?.id}`;
    return `/${type}/${item.id}`;
  };

  const getImage = () => {
    if (type === 'track') return (item as SpotifyTrack).album?.images?.[0]?.url;
    return (item as SpotifyPlaylist | SpotifyAlbum).images?.[0]?.url;
  };

  const handlePlay = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (type === 'track') {
        await playerApi.play({ uris: [(item as SpotifyTrack).uri] });
      } else {
        await playerApi.play({ context_uri: (item as SpotifyPlaylist).uri });
      }
    } catch (error) {
      console.error('Failed to play:', error);
    }
  };

  return (
    <AnimatedContainer delay={index * 30} animation="fade-in">
      <Link
        to={getLink()}
        className="group flex items-center bg-white/5 hover:bg-white/10 rounded overflow-hidden cursor-pointer transition-all duration-200 h-14"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <img
          src={getImage() || '/placeholder.svg'}
          alt={item.name}
          className="w-14 h-14 object-cover shadow-lg"
        />
        <span className="flex-1 px-3 font-bold text-sm truncate">{item.name}</span>
        <button
          onClick={handlePlay}
          className={cn(
            "w-10 h-10 rounded-full bg-primary flex items-center justify-center mr-2 shadow-xl transition-all duration-300",
            "hover:scale-105 active:scale-95",
            isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"
          )}
        >
          <Play className="h-4 w-4 text-black fill-current ml-0.5" />
        </button>
      </Link>
    </AnimatedContainer>
  );
}

// ============ MEET DJ CARD ============
function MeetDJCard() {
  const navigate = useNavigate();

  const handlePlay = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // DJ card navigates to recommendations since DJ mode isn't available via API
    navigate('/recommendations');
  };

  return (
    <AnimatedContainer delay={100} animation="scale-in">
      <div
        onClick={() => navigate('/recommendations')}
        className="relative bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a] rounded-lg p-6 cursor-pointer group overflow-hidden h-full min-h-[200px] flex flex-col justify-between"
      >
        {/* Animated Ring */}
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2">
          <div className="w-32 h-32 rounded-full border-4 border-primary/30 animate-pulse" />
          <div className="absolute inset-2 rounded-full border-4 border-primary animate-spin-slow"
            style={{ animationDuration: '8s' }} />
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-primary/20 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-4xl font-black text-white">DJ</h3>
            <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded">BETA</span>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-sm text-white/70">
            All kinds of music, picked by your own AI DJ.
          </p>
        </div>

        {/* Play button on hover */}
        <button
          onClick={handlePlay}
          className={cn(
            "absolute bottom-4 right-4 w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-xl transition-all duration-300",
            "hover:scale-110 opacity-0 group-hover:opacity-100"
          )}
        >
          <Play className="h-5 w-5 text-black fill-current ml-0.5" />
        </button>
      </div>
    </AnimatedContainer>
  );
}

// ============ DAILY MIX / RECOMMENDATION CARD ============
function MixCard({ playlist, index, title, subtitle }: {
  playlist?: SpotifyPlaylist;
  index: number;
  title?: string;
  subtitle?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  // If no playlist, show a generated mix card
  const displayTitle = title || playlist?.name || `Daily Mix ${index + 1}`;
  const displaySubtitle = subtitle || playlist?.description || 'Based on your listening';
  const imageUrl = playlist?.images?.[0]?.url;

  const handlePlay = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (playlist?.uri) {
        await playerApi.play({ context_uri: playlist.uri });
      } else {
        // No playlist, go to recommendations
        navigate('/recommendations');
      }
    } catch (error) {
      console.error('Failed to play:', error);
    }
  };

  return (
    <AnimatedContainer delay={index * 50} animation="scale-in">
      <Link
        to={playlist ? `/playlist/${playlist.id}` : '/recommendations'}
        className="group relative bg-surface-2/50 hover:bg-surface-2 rounded-lg p-4 transition-all duration-300 block"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Badge */}
        <div className="absolute top-2 left-2 z-10">
          <span className="bg-primary text-black text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
            {playlist ? '' : 'Daily Mix'}
          </span>
        </div>

        <div className="relative mb-3 overflow-hidden rounded-md shadow-lg aspect-square">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={displayTitle}
              className={cn(
                "w-full h-full object-cover transition-transform duration-500",
                isHovered && "scale-105"
              )}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 flex items-center justify-center">
              <span className="text-4xl font-black text-white/90">{index + 1}</span>
            </div>
          )}

          <button
            onClick={handlePlay}
            className={cn(
              "absolute bottom-2 right-2 w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-xl transition-all duration-300",
              "hover:scale-110 active:scale-95",
              isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            )}
          >
            <Play className="h-5 w-5 text-black fill-current ml-0.5" />
          </button>
        </div>

        <h3 className="font-bold text-sm truncate mb-1">{displayTitle}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2">{displaySubtitle}</p>
      </Link>
    </AnimatedContainer>
  );
}

// ============ HORIZONTAL SCROLL CARD ============
function HorizontalCard({ item, index, type = 'album' }: {
  item: SpotifyAlbum | SpotifyPlaylist | SpotifyTrack;
  index: number;
  type?: 'album' | 'playlist' | 'track';
}) {
  const [isHovered, setIsHovered] = useState(false);

  const getLink = () => {
    if (type === 'track') return `/album/${(item as SpotifyTrack).album?.id}`;
    return `/${type}/${item.id}`;
  };

  const getImage = () => {
    if (type === 'track') return (item as SpotifyTrack).album?.images?.[0]?.url;
    return (item as SpotifyPlaylist | SpotifyAlbum).images?.[0]?.url;
  };

  const handlePlay = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (type === 'track') {
        await playerApi.play({ uris: [(item as SpotifyTrack).uri] });
      } else {
        const uri = (item as SpotifyPlaylist | SpotifyAlbum).uri;
        if (uri) {
          await playerApi.play({ context_uri: uri });
        }
      }
    } catch (error) {
      console.error('Failed to play:', error);
    }
  };

  return (
    <AnimatedContainer delay={index * 40} animation="scale-in">
      <Link
        to={getLink()}
        className="group block w-40 flex-shrink-0"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative mb-2 overflow-hidden rounded-md shadow-lg aspect-square">
          <img
            src={getImage() || '/placeholder.svg'}
            alt={item.name}
            className={cn(
              "w-full h-full object-cover transition-transform duration-500",
              isHovered && "scale-105"
            )}
          />
          <button
            onClick={handlePlay}
            className={cn(
              "absolute bottom-2 right-2 w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-xl transition-all duration-300",
              "hover:scale-110 active:scale-95",
              isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            )}
          >
            <Play className="h-4 w-4 text-black fill-current ml-0.5" />
          </button>
        </div>
        <h3 className="font-medium text-sm truncate">{item.name}</h3>
        <p className="text-xs text-muted-foreground truncate">
          {type === 'track'
            ? (item as SpotifyTrack).artists?.map(a => a.name).join(', ')
            : type === 'playlist'
              ? `By ${(item as SpotifyPlaylist).owner?.display_name}`
              : (item as SpotifyAlbum).artists?.map(a => a.name).join(', ')
          }
        </p>
      </Link>
    </AnimatedContainer>
  );
}

// ============ FILTER TABS ============
function FilterTabs({ activeTab, onTabChange }: {
  activeTab: FilterTab;
  onTabChange: (tab: FilterTab) => void;
}) {
  return (
    <div className="flex gap-2 mb-4">
      {(['all', 'music', 'podcasts'] as FilterTab[]).map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
            activeTab === tab
              ? "bg-white text-black"
              : "bg-surface-2 text-foreground hover:bg-surface-3"
          )}
        >
          {tab.charAt(0).toUpperCase() + tab.slice(1)}
        </button>
      ))}
    </div>
  );
}

// ============ SECTION HEADER ============
function SectionHeader({ title, showAll, href }: { title: string; showAll?: boolean; href?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-2xl font-bold">{title}</h2>
      {showAll && href && (
        <Link
          to={href}
          className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          Show all
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

// ============ LOADING SKELETON ============
function LoadingSkeleton() {
  return (
    <div className="p-6 animate-fade-in">
      <div className="flex gap-2 mb-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-10 w-20 bg-surface-3 rounded-full animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[...Array(8)].map((_, i) => (
          <SkeletonQuickPlay key={i} />
        ))}
      </div>
      <div className="h-8 w-48 bg-surface-3 rounded mb-4 animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
        {[...Array(6)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

function WaitingForBackend() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center mb-6 animate-bounce-subtle">
        <AlertCircle className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Waiting for Backend</h2>
      <p className="text-muted-foreground max-w-md mb-6">
        Configure your backend URL to connect to your Spotify API.
      </p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
      <p className="text-muted-foreground max-w-md">{message}</p>
    </div>
  );
}

// ============ MAIN COMPONENT ============
export default function Index() {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const backendConfigured = isBackendConfigured();

  const { data: user, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ['userProfile'],
    queryFn: userApi.getProfile,
    enabled: backendConfigured,
  });

  const { data: playlists, isLoading: playlistsLoading } = useQuery({
    queryKey: ['userPlaylists'],
    queryFn: userApi.getPlaylists,
    enabled: backendConfigured,
  });

  const { data: recentlyPlayed, isLoading: recentLoading } = useQuery({
    queryKey: ['recentlyPlayed'],
    queryFn: () => userApi.getRecentlyPlayed(20),
    enabled: backendConfigured,
  });

  const { data: topTracks } = useQuery({
    queryKey: ['topTracks', 5],
    queryFn: () => userApi.getTopTracks(5),
    enabled: backendConfigured,
  });

  const { data: topArtists } = useQuery({
    queryKey: ['topArtists', 5],
    queryFn: () => userApi.getTopArtists(5),
    enabled: backendConfigured,
  });

  // Get personalized playlists (Daily Mix, Discover Weekly)
  const personalizedPlaylists = playlists?.filter(p =>
    p.owner?.id === 'spotify' &&
    (p.name.includes('Daily Mix') || p.name.includes('Discover Weekly') || p.name.includes('Release Radar'))
  ) ?? [];

  if (!backendConfigured) {
    return <WaitingForBackend />;
  }

  const isLoading = userLoading || playlistsLoading || recentLoading;

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (userError) {
    return <ErrorState message={(userError as Error).message} />;
  }

  // Get quick play items (mix of playlists and recent tracks)
  const quickPlayItems = playlists?.slice(0, 8) ?? [];

  // De-duplicate recently played tracks
  const recentTracks = recentlyPlayed?.items
    ?.map(item => item.track)
    .filter((track, index, self) => index === self.findIndex(t => t.id === track.id))
    .slice(0, 10) ?? [];

  return (
    
      <div className="p-6">
        {/* Filter Tabs */}
        <AnimatedContainer animation="fade-in">
          <FilterTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </AnimatedContainer>

        {/* Quick Play Grid - Spotify Style */}
        {quickPlayItems.length > 0 && (
          <section className="mb-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {quickPlayItems.map((playlist, index) => (
                <QuickPlayCard key={playlist.id} item={playlist} index={index} type="playlist" />
              ))}
            </div>
          </section>
        )}

        {/* Meet DJ + Made For You Row */}
        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
            {/* Meet DJ */}
            <div>
              <AnimatedContainer animation="fade-in">
                <h2 className="text-2xl font-bold mb-4">Meet DJ</h2>
              </AnimatedContainer>
              <MeetDJCard />
            </div>

            {/* Made For You */}
            <div>
              <AnimatedContainer delay={50} animation="fade-in">
                <SectionHeader
                  title={`Made For ${user?.display_name?.split(' ')[0] || 'You'}`}
                  showAll
                  href="/recommendations"
                />
              </AnimatedContainer>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {personalizedPlaylists.length > 0 ? (
                  personalizedPlaylists.slice(0, 4).map((playlist, index) => (
                    <MixCard key={playlist.id} playlist={playlist} index={index} />
                  ))
                ) : (
                  // Show generated mixes if no personalized playlists
                  [...Array(4)].map((_, index) => (
                    <MixCard
                      key={index}
                      index={index}
                      title={`Daily Mix ${index + 1}`}
                      subtitle={topArtists?.[index]?.name ? `${topArtists[index].name} and more` : 'Based on your listening'}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Recently Played - Horizontal Scroll */}
        {recentTracks.length > 0 && (
          <section className="mb-8">
            <AnimatedContainer delay={200} animation="fade-in">
              <SectionHeader title="Recently played" showAll href="/recently-played" />
            </AnimatedContainer>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {recentTracks.map((track, index) => (
                <HorizontalCard key={`${track.id}-${index}`} item={track} index={index} type="track" />
              ))}
            </div>
          </section>
        )}

        {/* Your Playlists */}
        {playlists && playlists.length > 0 && (
          <section className="mb-8">
            <AnimatedContainer delay={300} animation="fade-in">
              <SectionHeader title="Your Playlists" showAll href="/library" />
            </AnimatedContainer>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {playlists.slice(0, 6).map((playlist, index) => (
                <MixCard key={playlist.id} playlist={playlist} index={index} />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {!playlists?.length && !recentTracks.length && (
          <AnimatedContainer animation="fade-in">
            <div className="text-center py-20">
              <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Start listening to see your personalized content!</p>
            </div>
          </AnimatedContainer>
        )}
      </div>
    
  );
}
