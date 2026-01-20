import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Play, Pause, Heart, Clock, MoreHorizontal, Search, Download, Shuffle, AlertCircle, Trash2, Share2, Plus } from 'lucide-react';
import { cn, formatDuration } from '@/lib/utils';
import { AnimatedContainer } from '@/components/ui/animated-container';
import { SkeletonTrackRow } from '@/components/ui/skeleton-cards';
import { playlistApi, playerApi, libraryApi, followApi, isBackendConfigured } from '@/services/api';
import { usePlayerStore } from '@/stores/playerStore';
import { useSpotifyPlayer } from '@/contexts/SpotifyPlayerContext';
import { toast } from '@/hooks/use-toast';
import type { SpotifyTrack, SpotifyPlaylist } from '@/types/spotify';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MediaContextMenu } from '@/components/MediaContextMenu';

function TrackRow({
  track,
  index,
  isPlaying,
  onPlay,
  onRemove,
  playlistId,
  dateAdded,
}: {
  track: SpotifyTrack;
  index: number;
  isPlaying: boolean;
  onPlay: () => void;
  onRemove?: () => void;
  playlistId?: string;
  dateAdded?: string;
}) {
  const [isLiked, setIsLiked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleLike = async () => {
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

  const formattedDate = dateAdded
    ? new Date(dateAdded).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <AnimatedContainer delay={Math.min(index * 25, 300)} animation="fade-in">
      <MediaContextMenu type="track" data={track} onPlay={onPlay}>
        <div
          className={cn(
            "group grid grid-cols-[16px_6fr_4fr_3fr_minmax(100px,1fr)] gap-4 px-4 py-2 rounded-md items-center text-sm transition-all duration-150",
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
              src={track.album?.images[0]?.url || '/placeholder.svg'}
              alt={track.album?.name}
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
              <p className="text-xs text-muted-foreground truncate">
                {track.artists?.map((a, i) => (
                  <span key={a.id}>
                    <Link to={`/artist/${a.id}`} className="hover:underline hover:text-foreground">
                      {a.name}
                    </Link>
                    {i < track.artists.length - 1 && ', '}
                  </span>
                ))}
              </p>
            </div>
          </div>

          <Link to={`/album/${track.album?.id}`} className="text-muted-foreground truncate hover:underline hover:text-foreground">
            {track.album?.name}
          </Link>

          <p className="text-muted-foreground text-xs">{formattedDate}</p>

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
            <span className="text-muted-foreground tabular-nums w-12 text-right">
              {formatDuration(track.duration_ms)}
            </span>
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
                {track.artists?.[0] && (
                  <DropdownMenuItem asChild className="hover:bg-surface-4">
                    <Link to={`/artist/${track.artists[0].id}`}>Go to artist</Link>
                  </DropdownMenuItem>
                )}
                {track.album && (
                  <DropdownMenuItem asChild className="hover:bg-surface-4">
                    <Link to={`/album/${track.album.id}`}>Go to album</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="hover:bg-surface-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Add to playlist
                </DropdownMenuItem>
                {onRemove && (
                  <DropdownMenuItem onClick={onRemove} className="hover:bg-surface-4 text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove from playlist
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
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

function PlaylistSkeleton() {
  return (
    <div className="animate-fade-in">
      <div className="flex gap-6 p-6 pb-4 bg-gradient-to-b from-surface-3/50 to-transparent">
        <div className="w-56 h-56 bg-surface-3 rounded shadow-2xl animate-pulse" />
        <div className="flex flex-col justify-end gap-2">
          <div className="h-4 w-16 bg-surface-3 rounded animate-pulse" />
          <div className="h-12 w-96 bg-surface-3 rounded animate-pulse" />
          <div className="h-4 w-64 bg-surface-3 rounded animate-pulse mt-4" />
          <div className="h-4 w-48 bg-surface-3 rounded animate-pulse" />
        </div>
      </div>
      <div className="px-6 pt-4">
        {[...Array(10)].map((_, i) => <SkeletonTrackRow key={i} />)}
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
      <p className="text-muted-foreground max-w-md">Configure your backend URL to view playlists.</p>
    </div>
  );
}

export default function Playlist() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { playbackState } = usePlayerStore();
  const [searchQuery, setSearchQuery] = useState('');
  const backendConfigured = isBackendConfigured();

  const currentTrackId = playbackState?.item?.id;
  const isGloballyPlaying = playbackState?.is_playing ?? false;
  const { play } = useSpotifyPlayer();

  const { data: playlist, isLoading, error } = useQuery({
    queryKey: ['playlist', id],
    queryFn: () => playlistApi.getPlaylist(id!),
    enabled: backendConfigured && !!id,
  });

  // Remove track mutation
  const removeTrackMutation = useMutation({
    mutationFn: async (trackUri: string) => {
      await playlistApi.removeTracksFromPlaylist(id!, [trackUri]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlist', id] });
      toast({ title: 'Removed from playlist' });
    },
    onError: () => {
      toast({ title: 'Failed to remove track', variant: 'destructive' });
    },
  });

  const handlePlayPlaylist = async () => {
    if (!playlist) return;
    try {
      await play({ context_uri: playlist.uri });
    } catch (error) {
      console.error('Failed to play playlist:', error);
    }
  };

  const handlePlayTrack = async (track: SpotifyTrack) => {
    if (!playlist) return;
    try {
      await play({
        context_uri: playlist.uri,
        offset: { uri: track.uri }
      });
    } catch (error) {
      console.error('Failed to play track:', error);
    }
  };

  const handleShufflePlay = async () => {
    if (!playlist) return;
    try {
      await playerApi.setShuffle(true);
      await play({ context_uri: playlist.uri });
    } catch (error) {
      console.error('Failed to shuffle play:', error);
    }
  };

  if (!backendConfigured) {
    return <WaitingForBackend />;
  }

  if (isLoading) {
    return <PlaylistSkeleton />;
  }

  if (error || !playlist) {
    return (

      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
        <h2 className="text-2xl font-bold mb-2">Playlist not found</h2>
        <p className="text-muted-foreground">This playlist doesn't exist or you don't have access to it.</p>
      </div>

    );
  }

  const trackItems = playlist.tracks.items ?? [];
  const tracks = trackItems.map(item => ({ ...item.track, added_at: item.added_at }));

  const filteredTracks = searchQuery
    ? tracks.filter(t =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.artists?.some(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    : tracks;

  const totalDuration = tracks.reduce((sum, t) => sum + (t.duration_ms || 0), 0);
  const hours = Math.floor(totalDuration / 3600000);
  const minutes = Math.floor((totalDuration % 3600000) / 60000);
  const isPlaylistPlaying = playbackState?.context?.uri === playlist.uri && isGloballyPlaying;

  return (

    <div className="min-h-full">
      {/* Header */}
      <AnimatedContainer animation="fade-in">
        <div className="flex items-end gap-6 p-6 pb-6 bg-gradient-to-b from-surface-3/60 to-transparent">
          <img
            src={playlist.images[0]?.url || '/placeholder.svg'}
            alt={playlist.name}
            className="w-56 h-56 rounded shadow-2xl object-cover transition-transform hover:scale-[1.02]"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider mb-2">Playlist</p>
            <h1 className="text-5xl font-black mb-6 line-clamp-2">{playlist.name}</h1>
            {playlist.description && (
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2"
                dangerouslySetInnerHTML={{ __html: playlist.description }}
              />
            )}
            <div className="flex items-center gap-1 text-sm">
              <Link to={`/user/${playlist.owner.id}`} className="font-bold hover:underline">
                {playlist.owner.display_name}
              </Link>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{playlist.tracks.total} songs,</span>
              <span className="text-muted-foreground">
                {hours > 0 ? `${hours} hr ${minutes} min` : `${minutes} min`}
              </span>
            </div>
          </div>
        </div>
      </AnimatedContainer>

      {/* Action Bar */}
      <AnimatedContainer delay={100} animation="fade-in">
        <div className="flex items-center gap-6 px-6 py-4">
          <button
            onClick={handlePlayPlaylist}
            className="w-14 h-14 rounded-full bg-primary flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-xl"
          >
            {isPlaylistPlaying ? (
              <Pause className="h-6 w-6 text-primary-foreground fill-current" />
            ) : (
              <Play className="h-6 w-6 text-primary-foreground fill-current ml-1" />
            )}
          </button>
          <button
            onClick={handleShufflePlay}
            className="p-2 text-muted-foreground hover:text-primary transition-all hover:scale-110"
          >
            <Shuffle className="h-6 w-6" />
          </button>
          <button className="p-2 text-muted-foreground hover:text-foreground transition-all hover:scale-110">
            <Download className="h-6 w-6" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 text-muted-foreground hover:text-foreground transition-all hover:scale-110">
                <MoreHorizontal className="h-6 w-6" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-surface-3 border-border">
              <DropdownMenuItem className="hover:bg-surface-4">Add to queue</DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-surface-4">Edit details</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="hover:bg-surface-4">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Search in playlist */}
          <div className="ml-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search in playlist"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-surface-2 border-0 rounded-sm text-sm w-48 focus:w-64 transition-all focus:outline-none focus:ring-1 focus:ring-foreground/50"
            />
          </div>
        </div>
      </AnimatedContainer>

      {/* Track List */}
      <div className="px-6 pb-6">
        <AnimatedContainer delay={150} animation="fade-in">
          <div className="grid grid-cols-[16px_6fr_4fr_3fr_minmax(100px,1fr)] gap-4 px-4 py-2 border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
            <span>#</span>
            <span>Title</span>
            <span>Album</span>
            <span>Date added</span>
            <span className="text-right"><Clock className="h-4 w-4 inline" /></span>
          </div>
        </AnimatedContainer>

        <div className="mt-2">
          {filteredTracks.length > 0 ? (
            filteredTracks.map((track, index) => (
              <TrackRow
                key={`${track.id}-${index}`}
                track={track}
                index={index}
                isPlaying={currentTrackId === track.id && isGloballyPlaying}
                onPlay={() => handlePlayTrack(track)}
                onRemove={() => removeTrackMutation.mutate(track.uri)}
                playlistId={id}
                dateAdded={(track as any).added_at}
              />
            ))
          ) : (
            <div className="py-20 text-center text-muted-foreground animate-fade-in">
              {searchQuery ? 'No matching tracks found' : 'This playlist is empty'}
            </div>
          )}
        </div>
      </div>
    </div>

  );
}
