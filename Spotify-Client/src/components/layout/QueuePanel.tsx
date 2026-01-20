import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { X, Play, Pause, MoreHorizontal, GripVertical, Trash2 } from 'lucide-react';
import { cn, formatDuration } from '@/lib/utils';
import { playerApi, isBackendConfigured } from '@/services/api';
import { usePlayerStore } from '@/stores/playerStore';
import { useSpotifyPlayer } from '@/contexts/SpotifyPlayerContext';
import { AnimatedContainer } from '@/components/ui/animated-container';
import { toast } from '@/hooks/use-toast';
import type { SpotifyTrack } from '@/types/spotify';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface QueuePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface QueueTrackRowProps {
  track: SpotifyTrack;
  index: number;
  isCurrentTrack?: boolean;
  queueTracks: SpotifyTrack[];
}

function QueueTrackRow({ track, index, isCurrentTrack, queueTracks }: QueueTrackRowProps) {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const { play } = useSpotifyPlayer();

  const handlePlayTrack = async () => {
    try {
      const trackUris = queueTracks.map(t => t.uri);
      await play({
        uris: trackUris,
        offset: { position: index }
      });
    } catch (error) {
      console.error('Failed to play track from queue:', error);
      toast({ title: 'Failed to play track', variant: 'destructive' });
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

  const handleGoToArtist = () => {
    if (track.artists?.[0]?.id) {
      navigate(`/artist/${track.artists[0].id}`);
    }
  };

  const handleGoToAlbum = () => {
    if (track.album?.id) {
      navigate(`/album/${track.album.id}`);
    }
  };

  return (
    <AnimatedContainer delay={index * 30} animation="fade-in">
      <div
        className={cn(
          "group flex items-center gap-3 p-2 rounded-lg transition-all duration-200 cursor-pointer",
          isCurrentTrack
            ? "bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-transparent"
            : "hover:bg-white/5"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDoubleClick={handlePlayTrack}
      >
        {/* Drag Handle */}
        <div className={cn(
          "transition-opacity cursor-grab",
          isHovered ? "opacity-100" : "opacity-0"
        )}>
          <GripVertical className="h-4 w-4 text-gray-500" />
        </div>

        {/* Play/Index */}
        <div className="w-6 flex items-center justify-center">
          {isHovered ? (
            <button
              onClick={handlePlayTrack}
              className="text-white hover:text-purple-400 transition-all hover:scale-110 duration-200"
            >
              <Play className="h-4 w-4 fill-current" />
            </button>
          ) : (
            <span className={cn(
              "text-sm font-medium tabular-nums",
              isCurrentTrack ? "text-purple-400" : "text-gray-500"
            )}>
              {index + 1}
            </span>
          )}
        </div>

        {/* Track Info */}
        <div className="relative flex-shrink-0">
          <img
            src={track.album?.images?.[0]?.url || '/placeholder.svg'}
            alt={track.album?.name}
            className="w-12 h-12 rounded-md object-cover shadow-lg"
          />
          {isCurrentTrack && (
            <div className="absolute inset-0 rounded-md bg-purple-500/20 border-2 border-purple-400/50"></div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className={cn(
            "font-semibold text-sm truncate transition-colors",
            isCurrentTrack ? "text-purple-400" : "text-white group-hover:text-purple-300"
          )}>
            {track.name}
          </p>
          <p className="text-xs text-gray-400 truncate">
            {track.artists?.map(a => a.name).join(', ')}
          </p>
        </div>

        {/* Duration & Actions */}
        <span className="text-xs text-gray-500 tabular-nums font-medium">
          {formatDuration(track.duration_ms)}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              "p-1.5 hover:bg-white/10 rounded-full transition-all duration-200",
              isHovered ? "opacity-100" : "opacity-0"
            )}>
              <MoreHorizontal className="h-4 w-4 text-gray-400 hover:text-white" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-gray-900 border-white/10">
            <DropdownMenuItem
              onClick={handleAddToQueue}
              className="hover:bg-white/5 cursor-pointer text-gray-300"
            >
              Add to queue
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-white/5 cursor-pointer text-gray-300">
              Add to playlist
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              onClick={handleGoToArtist}
              className="hover:bg-white/5 cursor-pointer text-gray-300"
            >
              Go to artist
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleGoToAlbum}
              className="hover:bg-white/5 cursor-pointer text-gray-300"
            >
              Go to album
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </AnimatedContainer>
  );
}

export function QueuePanel({ isOpen, onClose }: QueuePanelProps) {
  const { playbackState } = usePlayerStore();
  const backendConfigured = isBackendConfigured();

  const { data: queueData, isLoading } = useQuery({
    queryKey: ['queue'],
    queryFn: playerApi.getQueue,
    enabled: backendConfigured && isOpen,
    refetchInterval: 30000,
  });

  if (!isOpen) return null;

  const currentTrack = playbackState?.item;
  const queue = queueData?.queue ?? [];

  return (
    <div className={cn(
      "fixed inset-y-0 right-0 w-[420px] bg-gradient-to-b from-gray-900 via-black to-black border-l border-white/5 z-50 flex flex-col shadow-2xl",
      "animate-slide-in-right"
    )}>
      {/* Header with Gradient */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-transparent"></div>
        <div className="relative flex items-center justify-between p-6 backdrop-blur-sm">
          <h2 className="font-bold text-xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Queue
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-all duration-200 hover:scale-110"
          >
            <X className="h-5 w-5 text-gray-400 hover:text-white" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
        {!backendConfigured ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-gray-400 text-sm font-medium">
              Connect backend to view queue
            </p>
          </div>
        ) : isLoading ? (
          <div className="space-y-3 mt-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <div className="w-12 h-12 bg-white/5 rounded-md animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 w-32 bg-white/5 rounded animate-pulse mb-2" />
                  <div className="h-3 w-24 bg-white/5 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Now Playing */}
            {currentTrack && (
              <div className="mb-8 mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-4 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Now playing</h3>
                </div>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl blur"></div>
                  <div className="relative flex items-center gap-4 p-3 rounded-xl bg-gradient-to-r from-purple-500/5 to-pink-500/5 border border-purple-500/20">
                    <div className="relative">
                      <img
                        src={currentTrack.album?.images?.[0]?.url || '/placeholder.svg'}
                        alt={currentTrack.album?.name}
                        className="w-16 h-16 rounded-lg object-cover shadow-xl"
                      />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/50">
                        <Play className="w-3 h-3 fill-white text-white ml-0.5" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-base truncate text-purple-300">{currentTrack.name}</p>
                      <p className="text-sm text-gray-400 truncate">
                        {currentTrack.artists?.map(a => a.name).join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Next in Queue */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Next in queue</h3>
              </div>
              {queue.length > 0 ? (
                <div className="space-y-1">
                  {queue.map((track, index) => (
                    <QueueTrackRow
                      key={`${track.id}-${index}`}
                      track={track}
                      index={index}
                      queueTracks={queue}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                  <p className="text-gray-400 text-sm font-medium">Queue is empty</p>
                  <p className="text-gray-600 text-xs mt-1">Add songs to see them here</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Clear Queue Button */}
      {queue.length > 0 && (
        <div className="p-4 border-t border-white/5 bg-gradient-to-t from-black to-transparent">
          <button
            onClick={() => toast({ title: 'Clear queue is not supported by Spotify API' })}
            className="w-full py-3 px-4 text-sm font-semibold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 group"
          >
            <Trash2 className="w-4 h-4 group-hover:text-red-400 transition-colors" />
            Clear queue
          </button>
        </div>
      )}
    </div>
  );
}