import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Play, Pause, Heart, MoreHorizontal, AlertCircle, Check, UserPlus, Share2, Ban } from 'lucide-react';
import { cn, formatDuration } from '@/lib/utils';
import { AnimatedContainer } from '@/components/ui/animated-container';
import { SkeletonCard, SkeletonTrackRow } from '@/components/ui/skeleton-cards';
import { artistApi, playerApi, followApi, libraryApi, isBackendConfigured } from '@/services/api';
import { usePlayerStore } from '@/stores/playerStore';
import { useSpotifyPlayer } from '@/contexts/SpotifyPlayerContext';
import { toast } from '@/hooks/use-toast';
import type { SpotifyTrack, SpotifyAlbum, SpotifyArtist } from '@/types/spotify';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MediaContextMenu } from '@/components/MediaContextMenu';

function PopularTrackRow({
  track,
  index,
  isPlaying,
  onPlay,
  artistUri,
}: {
  track: SpotifyTrack;
  index: number;
  isPlaying: boolean;
  onPlay: () => void;
  artistUri?: string;
}) {
  const [isLiked, setIsLiked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleLike = async () => {
    const newState = !isLiked;
    setIsLiked(newState);
    try {
      if (newState) {
        await libraryApi.saveTrack(track.id);
      } else {
        await libraryApi.removeSavedTrack(track.id);
      }
    } catch (error) {
      setIsLiked(!newState);
    }
  };

  const handleAddToQueue = async () => {
    try {
      await playerApi.addToQueue(track.uri);
      toast({ title: `Added "${track.name}" to queue` });
    } catch (error) {
      toast({ title: 'Failed to add to queue', variant: 'destructive' });
    }
  };

  return (
    <AnimatedContainer delay={index * 30} animation="fade-in">
      <MediaContextMenu type="track" data={track} onPlay={onPlay}>
        <div
          className={cn(
            "group grid grid-cols-[16px_4fr_2fr_minmax(80px,1fr)] gap-4 px-4 py-2 rounded-md items-center text-sm transition-all duration-150",
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
            <img
              src={track.album.images[0]?.url || '/placeholder.svg'}
              alt={track.album.name}
              className="w-10 h-10 rounded object-cover shadow-sm"
            />
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
            </div>
          </div>

          <p className="text-muted-foreground text-xs">
            {track.popularity?.toLocaleString() || '—'} popularity
          </p>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={handleLike}
              className={cn("transition-all duration-200", isLiked ? "opacity-100" : "opacity-0 group-hover:opacity-100")}
            >
              <Heart className={cn(
                "h-4 w-4 transition-all",
                isLiked ? "text-primary fill-primary animate-heart-beat" : "text-muted-foreground hover:text-foreground"
              )} />
            </button>
            <span className="text-muted-foreground tabular-nums">{formatDuration(track.duration_ms)}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-surface-3 rounded transition-all">
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-surface-3 border-border">
                <DropdownMenuItem onClick={handleAddToQueue} className="hover:bg-surface-4">
                  Add to queue
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="hover:bg-surface-4">
                  <Link to={`/album/${track.album.id}`}>Go to album</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="hover:bg-surface-4">Add to playlist</DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-surface-4">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </MediaContextMenu>
    </AnimatedContainer>
  );
}

function AlbumCard({ album, index }: { album: SpotifyAlbum; index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const { setPlaybackState } = usePlayerStore();

  const handlePlay = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await playerApi.play({ context_uri: album.uri });
    } catch (error) {
      console.error('Failed to play album:', error);
    }
  };

  return (
    <AnimatedContainer delay={index * 40} animation="scale-in">
      <MediaContextMenu type="album" data={album}>
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
              className={cn("w-full aspect-square object-cover transition-transform duration-500", isHovered && "scale-105")}
            />
            <button
              onClick={handlePlay}
              className={cn(
                "absolute bottom-2 right-2 w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-xl transition-all duration-300",
                "hover:scale-110 active:scale-95",
                isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
              )}
            >
              <Play className="h-5 w-5 text-primary-foreground fill-current ml-0.5" />
            </button>
          </div>
          <h3 className="font-bold text-sm truncate mb-1">{album.name}</h3>
          <p className="text-xs text-muted-foreground truncate">
            {album.release_date?.split('-')[0]} • {album.album_type}
          </p>
        </Link>
      </MediaContextMenu>
    </AnimatedContainer>
  );
}

function RelatedArtistCard({ artist, index }: { artist: SpotifyArtist; index: number }) {
  const [isHovered, setIsHovered] = useState(false);

  const handlePlay = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await playerApi.play({ context_uri: artist.uri });
    } catch (error) {
      console.error('Failed to play artist:', error);
    }
  };

  return (
    <AnimatedContainer delay={index * 40} animation="scale-in">
      <Link
        to={`/artist/${artist.id}`}
        className="group relative bg-surface-2/50 hover:bg-surface-2 rounded-md p-4 transition-all duration-300 block transform hover:-translate-y-1"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative mb-4 overflow-hidden rounded-full shadow-lg">
          <img
            src={artist.images[0]?.url || '/placeholder.svg'}
            alt={artist.name}
            className={cn("w-full aspect-square object-cover transition-transform duration-500", isHovered && "scale-105")}
          />
          <button
            onClick={handlePlay}
            className={cn(
              "absolute bottom-2 right-2 w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-xl transition-all duration-300",
              "hover:scale-110 active:scale-95",
              isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            )}
          >
            <Play className="h-5 w-5 text-primary-foreground fill-current ml-0.5" />
          </button>
        </div>
        <h3 className="font-bold text-sm truncate mb-1">{artist.name}</h3>
        <p className="text-xs text-muted-foreground">Artist</p>
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
      <p className="text-muted-foreground max-w-md">Configure your backend URL to view artists.</p>
    </div>
  );
}

export default function Artist() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { playbackState } = usePlayerStore();
  const [showAllTracks, setShowAllTracks] = useState(false);
  const [showAllAlbums, setShowAllAlbums] = useState(false);
  const [showAllRelated, setShowAllRelated] = useState(false);
  const backendConfigured = isBackendConfigured();

  const currentTrackId = playbackState?.item?.id;
  const isPlaying = playbackState?.is_playing ?? false;
  const { play } = useSpotifyPlayer();

  // Fetch artist data
  const { data: artist, isLoading } = useQuery({
    queryKey: ['artist', id],
    queryFn: () => artistApi.getArtist(id!),
    enabled: backendConfigured && !!id,
  });

  // Fetch top tracks
  const { data: topTracks } = useQuery({
    queryKey: ['artistTopTracks', id],
    queryFn: () => artistApi.getArtistTopTracks(id!),
    enabled: backendConfigured && !!id,
  });

  // Fetch albums
  const { data: albums } = useQuery({
    queryKey: ['artistAlbums', id],
    queryFn: () => artistApi.getArtistAlbums(id!),
    enabled: backendConfigured && !!id,
  });

  // Fetch related artists
  const { data: relatedArtists } = useQuery({
    queryKey: ['relatedArtists', id],
    queryFn: () => artistApi.getRelatedArtists(id!),
    enabled: backendConfigured && !!id,
  });

  // Check if following
  const { data: followingData } = useQuery({
    queryKey: ['followingArtist', id],
    queryFn: () => followApi.checkFollowingArtists([id!]),
    enabled: backendConfigured && !!id,
  });

  const isFollowing = followingData?.[0] ?? false;

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      if (isFollowing) {
        await followApi.unfollowArtist(id!);
      } else {
        await followApi.followArtist(id!);
      }
    },
    onSuccess: () => {
      // Invalidate specific artist status
      queryClient.invalidateQueries({ queryKey: ['followingArtist', id] });
      // Invalidate sidebar list
      queryClient.invalidateQueries({ queryKey: ['followedArtists'] });
      // Invalidate library lists
      queryClient.invalidateQueries({ queryKey: ['topArtists'] });
      // Invalidate user profile (for following count if displayed anywhere)
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });

      toast({ title: isFollowing ? 'Unfollowed artist' : 'Following artist' });
    },
    onError: () => {
      toast({ title: 'Failed to update', variant: 'destructive' });
    },
  });

  const handlePlayArtist = async () => {
    if (!artist || !topTracks?.length) return;
    try {
      await play({
        uris: topTracks.map(t => t.uri),
        offset: { position: 0 }
      });
    } catch (error) {
      console.error('Failed to play:', error);
    }
  };

  const handlePlayTrack = async (track: SpotifyTrack, index: number) => {
    if (!topTracks) return;
    try {
      await play({
        uris: topTracks.map(t => t.uri),
        offset: { position: index }
      });
    } catch (error) {
      console.error('Failed to play track:', error);
    }
  };

  if (!backendConfigured) {
    return <WaitingForBackend />;
  }

  if (isLoading) {
    return (

      <div className="animate-fade-in">
        <div className="h-80 bg-gradient-to-b from-surface-3/50 to-transparent flex items-end p-6">
          <div className="flex flex-col gap-4">
            <div className="h-4 w-24 bg-surface-3 rounded animate-pulse" />
            <div className="h-16 w-96 bg-surface-3 rounded animate-pulse" />
            <div className="h-4 w-48 bg-surface-3 rounded animate-pulse" />
          </div>
        </div>
        <div className="p-6">
          <div className="mb-8">
            {[...Array(5)].map((_, i) => <SkeletonTrackRow key={i} />)}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </div>

    );
  }

  if (!artist) {
    return (

      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
        <h2 className="text-2xl font-bold mb-2">Artist not found</h2>
        <p className="text-muted-foreground">This artist doesn't exist.</p>
      </div>

    );
  }

  const displayedTracks = showAllTracks ? (topTracks ?? []) : (topTracks ?? []).slice(0, 5);
  const displayedAlbums = showAllAlbums ? (albums ?? []) : (albums ?? []).slice(0, 6);
  const displayedRelated = showAllRelated ? (relatedArtists ?? []) : (relatedArtists ?? []).slice(0, 6);

  return (

    <div className="min-h-full">
      {/* Hero Header */}
      <AnimatedContainer animation="fade-in">
        <div
          className="h-80 bg-gradient-to-b from-surface-3/80 to-transparent flex items-end p-6 relative overflow-hidden"
          style={{
            backgroundImage: artist.images[0] ? `url(${artist.images[0].url})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="relative z-10">
            {artist.popularity && artist.popularity > 70 && (
              <div className="flex items-center gap-2 mb-2">
                <Check className="h-5 w-5 text-primary" />
                <span className="text-xs font-bold">Verified Artist</span>
              </div>
            )}
            <h1 className="text-6xl md:text-8xl font-black mb-4">{artist.name}</h1>
            <p className="text-sm text-muted-foreground">
              {artist.followers?.total?.toLocaleString()} monthly listeners
            </p>
          </div>
        </div>
      </AnimatedContainer>

      {/* Action Bar */}
      <AnimatedContainer delay={100} animation="fade-in">
        <div className="flex items-center gap-6 px-6 py-4">
          <button
            onClick={handlePlayArtist}
            className="w-14 h-14 rounded-full bg-primary flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-xl"
          >
            {isPlaying && playbackState?.context?.uri === artist.uri ? (
              <Pause className="h-6 w-6 text-primary-foreground fill-current" />
            ) : (
              <Play className="h-6 w-6 text-primary-foreground fill-current ml-1" />
            )}
          </button>
          <button
            onClick={() => followMutation.mutate()}
            disabled={followMutation.isPending}
            className={cn(
              "px-4 py-2 rounded-full font-bold text-sm border transition-all hover:scale-105",
              isFollowing
                ? "border-foreground text-foreground bg-transparent"
                : "border-muted-foreground text-foreground hover:border-foreground"
            )}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 text-muted-foreground hover:text-foreground transition-all hover:scale-110">
                <MoreHorizontal className="h-6 w-6" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-surface-3 border-border">
              <DropdownMenuItem onClick={() => followMutation.mutate()} className="hover:bg-surface-4">
                <UserPlus className="h-4 w-4 mr-2" />
                {isFollowing ? 'Unfollow' : 'Follow'}
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-surface-4">
                <Ban className="h-4 w-4 mr-2" />
                Don't play this artist
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="hover:bg-surface-4">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </AnimatedContainer>

      <div className="px-6 pb-6">
        {/* Popular Tracks */}
        {topTracks && topTracks.length > 0 && (
          <section className="mb-8">
            <AnimatedContainer delay={150} animation="fade-in">
              <h2 className="text-2xl font-bold mb-4">Popular</h2>
            </AnimatedContainer>
            <div>
              {displayedTracks.map((track, index) => (
                <PopularTrackRow
                  key={track.id}
                  track={track}
                  index={index}
                  isPlaying={currentTrackId === track.id && isPlaying}
                  onPlay={() => handlePlayTrack(track, index)}
                  artistUri={artist.uri}
                />
              ))}
            </div>
            {topTracks.length > 5 && (
              <button
                onClick={() => setShowAllTracks(!showAllTracks)}
                className="mt-4 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                {showAllTracks ? 'Show less' : 'See more'}
              </button>
            )}
          </section>
        )}

        {/* Discography */}
        {albums && albums.length > 0 && (
          <section className="mb-8">
            <AnimatedContainer delay={200} animation="fade-in">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Discography</h2>
                {albums.length > 6 && (
                  <button
                    onClick={() => setShowAllAlbums(!showAllAlbums)}
                    className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors hover:underline"
                  >
                    {showAllAlbums ? 'Show less' : 'Show all'}
                  </button>
                )}
              </div>
            </AnimatedContainer>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {displayedAlbums.map((album, index) => (
                <AlbumCard key={album.id} album={album} index={index} />
              ))}
            </div>
          </section>
        )}

        {/* Related Artists */}
        {relatedArtists && relatedArtists.length > 0 && (
          <section className="mb-8">
            <AnimatedContainer delay={300} animation="fade-in">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Fans also like</h2>
                {relatedArtists.length > 6 && (
                  <button
                    onClick={() => setShowAllRelated(!showAllRelated)}
                    className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors hover:underline"
                  >
                    {showAllRelated ? 'Show less' : 'Show all'}
                  </button>
                )}
              </div>
            </AnimatedContainer>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {displayedRelated.map((relatedArtist, index) => (
                <RelatedArtistCard key={relatedArtist.id} artist={relatedArtist} index={index} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>

  );
}
