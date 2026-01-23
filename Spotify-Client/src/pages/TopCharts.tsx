import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Play, Pause, Heart, MoreHorizontal, AlertCircle, TrendingUp, Globe2, Music2, Crown, Disc3, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatedContainer } from '@/components/ui/animated-container';
import { SkeletonCard, SkeletonTrackRow } from '@/components/ui/skeleton-cards';
import { browseApi, userApi, isBackendConfigured, playerApi } from '@/services/api';
import { usePlayerStore } from '@/stores/playerStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SpotifyTrack, SpotifyAlbum, SpotifyArtist } from '@/types/spotify';

// Helper to generate flag emoji from country code
function getFlagEmoji(countryCode: string) {
  if (countryCode === 'global') return '🌍';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Helper to get country display name
function getCountryName(code: string) {
  if (code === 'global') return 'Global';
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || code;
  } catch {
    return code;
  }
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function TrackRow({ track, index, isPlaying, onPlay }: {
  track: SpotifyTrack;
  index: number;
  isPlaying: boolean;
  onPlay: () => void;
}) {
  const [isLiked, setIsLiked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-amber-600';
    return 'text-muted-foreground';
  };

  return (
    <AnimatedContainer delay={Math.min(index * 30, 300)} animation="fade-in">
      <div
        className={cn(
          "group grid grid-cols-[auto_1fr_1fr_auto] gap-4 px-4 py-2 rounded-md transition-all duration-200",
          isPlaying ? "bg-surface-2" : "hover:bg-surface-2/50"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center justify-center w-10">
          {isHovered || isPlaying ? (
            <button
              onClick={onPlay}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-3 transition-colors"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 fill-current" />
              ) : (
                <Play className="h-4 w-4 fill-current ml-0.5" />
              )}
            </button>
          ) : (
            <span className={cn("font-bold text-lg", getRankColor(index + 1))}>
              {index < 3 && <Crown className="h-4 w-4 inline mr-1" />}
              {index + 1}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 min-w-0">
          <img
            src={track.album?.images[2]?.url || track.album?.images[0]?.url || '/placeholder.svg'}
            alt={track.album?.name}
            className="w-10 h-10 rounded object-cover flex-shrink-0"
          />
          <div className="min-w-0">
            <p className={cn(
              "font-medium truncate transition-colors",
              isPlaying && "text-primary"
            )}>
              {track.name}
            </p>
            <p className="text-sm text-muted-foreground truncate">
              {track.artists.map((artist, i) => (
                <span key={artist.id}>
                  <Link
                    to={`/artist/${artist.id}`}
                    className="hover:text-foreground hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {artist.name}
                  </Link>
                  {i < track.artists.length - 1 && ', '}
                </span>
              ))}
            </p>
          </div>
        </div>

        <div className="flex items-center min-w-0">
          <Link
            to={`/album/${track.album?.id}`}
            className="text-sm text-muted-foreground truncate hover:text-foreground hover:underline"
          >
            {track.album?.name}
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsLiked(!isLiked)}
            className={cn(
              "opacity-0 group-hover:opacity-100 transition-all duration-200",
              isLiked && "opacity-100"
            )}
          >
            <Heart className={cn(
              "h-4 w-4 transition-all",
              isLiked ? "fill-primary text-primary scale-110" : "text-muted-foreground hover:text-foreground"
            )} />
          </button>
          <span className="text-sm text-muted-foreground w-12 text-right">
            {formatDuration(track.duration_ms)}
          </span>
          <button className="opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreHorizontal className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        </div>
      </div>
    </AnimatedContainer>
  );
}

function AlbumCard({ album, index }: { album: SpotifyAlbum; index: number }) {
  const [isHovered, setIsHovered] = useState(false);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { bg: 'bg-yellow-500', text: '🥇' };
    if (rank === 2) return { bg: 'bg-gray-400', text: '🥈' };
    if (rank === 3) return { bg: 'bg-amber-600', text: '🥉' };
    return { bg: 'bg-surface-3', text: `#${rank}` };
  };

  const badge = getRankBadge(index + 1);

  return (
    <AnimatedContainer delay={Math.min(index * 40, 300)} animation="scale-in">
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
          <div className={cn("absolute top-2 left-2 px-2 py-1 text-xs font-bold rounded", badge.bg)}>
            {badge.text}
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

function ArtistCard({ artist, index }: { artist: SpotifyArtist; index: number }) {
  const [isHovered, setIsHovered] = useState(false);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { bg: 'bg-yellow-500', text: '🥇' };
    if (rank === 2) return { bg: 'bg-gray-400', text: '🥈' };
    if (rank === 3) return { bg: 'bg-amber-600', text: '🥉' };
    return { bg: 'bg-surface-3', text: `#${rank}` };
  };

  const badge = getRankBadge(index + 1);

  return (
    <AnimatedContainer delay={Math.min(index * 40, 300)} animation="scale-in">
      <Link
        to={`/artist/${artist.id}`}
        className="group relative bg-surface-2/50 hover:bg-surface-2 rounded-md p-4 transition-all duration-300 block transform hover:-translate-y-1"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative mb-4 overflow-hidden rounded-full shadow-lg mx-auto w-32 h-32">
          <img
            src={artist.images[0]?.url || '/placeholder.svg'}
            alt={artist.name}
            className={cn(
              "w-full h-full object-cover transition-transform duration-500",
              isHovered && "scale-105"
            )}
          />
          <button
            onClick={(e) => e.preventDefault()}
            className={cn(
              "absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-xl transition-all duration-300",
              "hover:scale-110 active:scale-95",
              isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            )}
          >
            <Play className="h-4 w-4 text-primary-foreground fill-current ml-0.5" />
          </button>
        </div>
        <div className="text-center">
          <div className={cn("inline-block px-2 py-0.5 text-xs font-bold rounded mb-2", badge.bg)}>
            {badge.text}
          </div>
          <h3 className="font-bold text-sm truncate">{artist.name}</h3>
          <p className="text-xs text-muted-foreground capitalize">
            {artist.genres?.slice(0, 2).join(', ') || 'Artist'}
          </p>
        </div>
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
      <p className="text-muted-foreground max-w-md">Configure your backend URL to view top charts.</p>
    </div>
  );
}

export default function TopCharts() {
  const [country, setCountry] = useState('global');
  const [activeTab, setActiveTab] = useState('tracks');
  const { playbackState } = usePlayerStore();
  const currentTrack = playbackState?.item;
  const isPlaying = playbackState?.is_playing ?? false;

  const backendConfigured = isBackendConfigured();

  // Fetch Available Markets
  const { data: availableMarkets } = useQuery({
    queryKey: ['markets'],
    queryFn: browseApi.getMarkets,
    enabled: backendConfigured,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  // Get User Profile for Default Country
  useQuery({
    queryKey: ['userProfile', 'auto-country'],
    queryFn: async () => {
      const user = await userApi.getProfile();
      // Only auto-set if still on global default
      if (user?.country && country === 'global') {
        const userCountry = user.country;
        setCountry(userCountry);
      }
      return user;
    },
    enabled: backendConfigured && country === 'global',
    staleTime: Infinity,
  });

  // Construct Country List
  const countryList = [
    { code: 'global', name: 'Global', flag: '🌍' },
    ...(availableMarkets || []).map(code => ({
      code,
      name: getCountryName(code),
      flag: getFlagEmoji(code)
    })).sort((a, b) => a.name.localeCompare(b.name))
  ];

  const selectedCountry = countryList.find(c => c.code === country) || countryList[0];

  // Fetch top tracks (user's top tracks as proxy for charts)
  const { data: topTracks, isLoading: tracksLoading } = useQuery({
    queryKey: ['topTracks', 'charts', country],
    queryFn: () => userApi.getTopTracks(50, 'short_term'),
    enabled: backendConfigured,
    staleTime: 1000 * 60 * 10,
  });

  // Fetch top artists
  const { data: topArtists, isLoading: artistsLoading } = useQuery({
    queryKey: ['topArtists', 'charts', country],
    queryFn: () => userApi.getTopArtists(20, 'short_term'),
    enabled: backendConfigured,
    staleTime: 1000 * 60 * 10,
  });

  // Fetch new releases as album charts proxy
  const { data: topAlbums, isLoading: albumsLoading } = useQuery({
    queryKey: ['topAlbums', 'charts', country],
    queryFn: () => browseApi.getNewReleases(20, 0),
    enabled: backendConfigured,
    staleTime: 1000 * 60 * 10,
  });

  const handlePlay = async (track: SpotifyTrack) => {
    try {
      if (currentTrack?.id === track.id && isPlaying) {
        await playerApi.pause();
      } else {
        await playerApi.play({ uris: [track.uri] });
      }
    } catch (error) {
      console.error('Play error:', error);
    }
  };

  if (!backendConfigured) {
    return <WaitingForBackend />;
  }

  return (

    <div className="p-6">
      {/* Page Header */}
      <AnimatedContainer animation="slide-up">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
            <TrendingUp className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black">Top Charts</h1>
            <p className="text-muted-foreground">What's trending right now</p>
          </div>
        </div>
      </AnimatedContainer>

      {/* Country Selector */}
      <AnimatedContainer delay={50} animation="fade-in">
        <div className="flex items-center gap-4 mb-6">
          <Globe2 className="h-5 w-5 text-muted-foreground" />
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger className="w-[200px] bg-surface-2">
              <SelectValue>
                {selectedCountry && (
                  <span className="flex items-center gap-2">
                    <span>{selectedCountry.flag}</span>
                    <span>{selectedCountry.name}</span>
                  </span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {countryList.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{c.flag}</span>
                    <span>{c.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </AnimatedContainer>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <AnimatedContainer delay={100} animation="fade-in">
          <TabsList className="mb-6 bg-surface-2/50">
            <TabsTrigger value="tracks" className="gap-2">
              <Music2 className="h-4 w-4" />
              Top Tracks
            </TabsTrigger>
            <TabsTrigger value="albums" className="gap-2">
              <Disc3 className="h-4 w-4" />
              Top Albums
            </TabsTrigger>
            <TabsTrigger value="artists" className="gap-2">
              <Users className="h-4 w-4" />
              Top Artists
            </TabsTrigger>
          </TabsList>
        </AnimatedContainer>

        {/* Tracks Tab */}
        <TabsContent value="tracks">
          <AnimatedContainer delay={150} animation="fade-in">
            <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-4 px-4 py-2 text-sm text-muted-foreground border-b border-border/50 mb-2">
              <span className="w-10 text-center">#</span>
              <span>Title</span>
              <span>Album</span>
              <span className="text-right pr-12">Duration</span>
            </div>
          </AnimatedContainer>

          {tracksLoading ? (
            <div className="space-y-2">
              {[...Array(10)].map((_, i) => <SkeletonTrackRow key={i} />)}
            </div>
          ) : topTracks && topTracks.length > 0 ? (
            <div className="space-y-1">
              {topTracks.map((track, index) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={index}
                  isPlaying={currentTrack?.id === track.id && isPlaying}
                  onPlay={() => handlePlay(track)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Music2 className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-bold mb-2">No tracks found</h3>
              <p className="text-muted-foreground">Charts data is not available yet</p>
            </div>
          )}
        </TabsContent>

        {/* Albums Tab */}
        <TabsContent value="albums">
          {albumsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : topAlbums && topAlbums.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {topAlbums.map((album, index) => (
                <AlbumCard key={album.id} album={album} index={index} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Disc3 className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-bold mb-2">No albums found</h3>
              <p className="text-muted-foreground">Charts data is not available yet</p>
            </div>
          )}
        </TabsContent>

        {/* Artists Tab */}
        <TabsContent value="artists">
          {artistsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : topArtists && topArtists.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {topArtists.map((artist, index) => (
                <ArtistCard key={artist.id} artist={artist} index={index} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Users className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-bold mb-2">No artists found</h3>
              <p className="text-muted-foreground">Charts data is not available yet</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>

  );
}
