import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Play, Pause, Heart, Clock, MoreHorizontal, AlertCircle, Share2 } from 'lucide-react';
import { cn, formatDuration } from '@/lib/utils';
import { AnimatedContainer } from '@/components/ui/animated-container';
import { SkeletonTrackRow } from '@/components/ui/skeleton-cards';
import { albumApi, playerApi, libraryApi, isBackendConfigured } from '@/services/api';
import { usePlayerStore } from '@/stores/playerStore';
import { toast } from '@/hooks/use-toast';
import type { SpotifyTrack } from '@/types/spotify';
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
  albumUri,
}: {
  track: SpotifyTrack;
  index: number;
  isPlaying: boolean;
  onPlay: () => void;
  albumUri?: string;
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
      toast({ title: 'Failed to update', variant: 'destructive' });
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
    <AnimatedContainer delay={index * 25} animation="fade-in">
      <MediaContextMenu type="track" data={track} onPlay={onPlay}>
        <div
          className={cn(
            "group grid grid-cols-[16px_1fr_minmax(100px,1fr)] gap-4 px-4 py-2 rounded-md items-center text-sm transition-all duration-150",
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
                {track.track_number}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 min-w-0">
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
                {track.artists?.[0] && (
                  <DropdownMenuItem asChild className="hover:bg-surface-4">
                    <Link to={`/artist/${track.artists[0].id}`}>Go to artist</Link>
                  </DropdownMenuItem>
                )}
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

function WaitingForBackend() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center mb-6 animate-bounce-subtle">
        <AlertCircle className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Waiting for Backend</h2>
      <p className="text-muted-foreground max-w-md">Configure your backend URL to view albums.</p>
    </div>
  );
}

export default function Album() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { playbackState } = usePlayerStore();
  const backendConfigured = isBackendConfigured();

  const currentTrackId = playbackState?.item?.id;
  const isGloballyPlaying = playbackState?.is_playing ?? false;

  const { data: album, isLoading, error } = useQuery({
    queryKey: ['album', id],
    queryFn: () => albumApi.getAlbum(id!),
    enabled: backendConfigured && !!id,
  });

  // Check if album is saved
  const { data: savedData } = useQuery({
    queryKey: ['savedAlbum', id],
    queryFn: () => libraryApi.checkSavedAlbums([id!]),
    enabled: backendConfigured && !!id,
  });

  const isSaved = savedData?.[0] ?? false;

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isSaved) {
        await libraryApi.removeSavedAlbum(id!);
      } else {
        await libraryApi.saveAlbum(id!);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedAlbum', id] });
      toast({ title: isSaved ? 'Removed from Library' : 'Added to Library' });
    },
    onError: () => {
      toast({ title: 'Failed to update', variant: 'destructive' });
    },
  });

  const handlePlayAlbum = async () => {
    if (!album) return;
    try {
      await playerApi.play({ context_uri: album.uri });
    } catch (error) {
      console.error('Failed to play album:', error);
      toast({ title: 'Failed to play album', variant: 'destructive' });
    }
  };

  const handlePlayTrack = async (track: SpotifyTrack) => {
    if (!album) return;
    try {
      await playerApi.play({
        context_uri: album.uri,
        offset: { uri: track.uri }
      });
    } catch (error) {
      console.error('Failed to play track:', error);
      toast({ title: 'Failed to play track', variant: 'destructive' });
    }
  };

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
          {[...Array(10)].map((_, i) => <SkeletonTrackRow key={i} />)}
        </div>
      </div>

    );
  }

  if (error || !album) {
    return (

      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
        <h2 className="text-2xl font-bold mb-2">Album not found</h2>
        <p className="text-muted-foreground">This album doesn't exist or you don't have access to it.</p>
      </div>

    );
  }

  const tracks = album.tracks?.items ?? [];
  const totalDuration = tracks.reduce((sum, t) => sum + t.duration_ms, 0);
  const minutes = Math.floor(totalDuration / 60000);
  const releaseYear = album.release_date?.split('-')[0];
  const isAlbumPlaying = playbackState?.context?.uri === album.uri && isGloballyPlaying;

  return (

    <div className="min-h-full">
      <AnimatedContainer animation="fade-in">
        <div className="flex items-end gap-6 p-6 pb-6 bg-gradient-to-b from-surface-3/60 to-transparent">
          <img
            src={album.images[0]?.url || '/placeholder.svg'}
            alt={album.name}
            className="w-56 h-56 rounded shadow-2xl object-cover transition-transform hover:scale-[1.02]"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider mb-2">
              {album.album_type === 'single' ? 'Single' : 'Album'}
            </p>
            <h1 className="text-5xl font-black mb-6 line-clamp-2">{album.name}</h1>
            <div className="flex items-center gap-1 text-sm">
              {album.artists.map((artist, i) => (
                <span key={artist.id}>
                  <Link to={`/artist/${artist.id}`} className="font-bold hover:underline">
                    {artist.name}
                  </Link>
                  {i < album.artists.length - 1 && ', '}
                </span>
              ))}
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{releaseYear}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{album.total_tracks} songs, {minutes} min</span>
            </div>
          </div>
        </div>
      </AnimatedContainer>

      <AnimatedContainer delay={100} animation="fade-in">
        <div className="flex items-center gap-6 px-6 py-4">
          <button
            onClick={handlePlayAlbum}
            className="w-14 h-14 rounded-full bg-primary flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-xl"
          >
            {isAlbumPlaying ? (
              <Pause className="h-6 w-6 text-primary-foreground fill-current" />
            ) : (
              <Play className="h-6 w-6 text-primary-foreground fill-current ml-1" />
            )}
          </button>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className={cn("p-2 transition-all hover:scale-110", isSaved ? "text-primary" : "text-muted-foreground hover:text-foreground")}
          >
            <Heart className={cn("h-8 w-8", isSaved && "fill-current animate-heart-beat")} />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 text-muted-foreground hover:text-foreground transition-all hover:scale-110">
                <MoreHorizontal className="h-6 w-6" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-surface-3 border-border">
              <DropdownMenuItem className="hover:bg-surface-4">Add to queue</DropdownMenuItem>
              <DropdownMenuItem onClick={() => saveMutation.mutate()} className="hover:bg-surface-4">
                {isSaved ? 'Remove from Library' : 'Add to Library'}
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-surface-4">Add to playlist</DropdownMenuItem>
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
        <AnimatedContainer delay={150} animation="fade-in">
          <div className="grid grid-cols-[16px_1fr_minmax(100px,1fr)] gap-4 px-4 py-2 border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
            <span>#</span>
            <span>Title</span>
            <span className="text-right"><Clock className="h-4 w-4 inline" /></span>
          </div>
        </AnimatedContainer>

        <div className="mt-2">
          {tracks.map((track, index) => (
            <TrackRow
              key={track.id}
              track={track}
              index={index}
              isPlaying={currentTrackId === track.id && isGloballyPlaying}
              onPlay={() => handlePlayTrack(track)}
              albumUri={album.uri}
            />
          ))}
        </div>

        {/* Album info footer */}
        <AnimatedContainer delay={300} animation="fade-in">
          <div className="mt-8 pt-8 border-t border-border">
            <p className="text-xs text-muted-foreground">{album.release_date}</p>
            {album.copyrights?.map((c, i) => (
              <p key={i} className="text-xs text-muted-foreground">{c.text}</p>
            ))}
          </div>
        </AnimatedContainer>
      </div>
    </div>

  );
}
