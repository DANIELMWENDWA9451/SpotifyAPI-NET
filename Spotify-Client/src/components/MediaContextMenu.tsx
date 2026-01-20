import { Link, useNavigate } from 'react-router-dom';
import {
  Play,
  ListMusic,
  User,
  Disc,
  Heart,
  Share2,
  Plus,
  MinusCircle,
  Link as LinkIcon
} from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from '@/components/ui/context-menu';
import { playerApi, libraryApi } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import type { SpotifyTrack, SpotifyAlbum, SpotifyArtist, SpotifyPlaylist } from '@/types/spotify';

type MediaType = 'track' | 'album' | 'artist' | 'playlist';

interface MediaContextMenuProps {
  children: React.ReactNode;
  type: MediaType;
  data: SpotifyTrack | SpotifyAlbum | SpotifyArtist | SpotifyPlaylist;
  onPlay?: () => void;
}

export function MediaContextMenu({ children, type, data, onPlay }: MediaContextMenuProps) {
  const navigate = useNavigate();

  const handleAddToQueue = async () => {
    if (!('uri' in data)) return;
    try {
      await playerApi.addToQueue(data.uri);
      toast({ title: 'Added to queue' });
    } catch (error) {
      toast({ title: 'Failed to add to queue', variant: 'destructive' });
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/${type}/${data.id}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Link copied to clipboard' });
  };

  const handleSaveTrack = async () => {
    try {
      await libraryApi.saveTrack(data.id);
      toast({ title: 'Saved to Liked Songs' });
    } catch (error) {
      toast({ title: 'Failed to save track', variant: 'destructive' });
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64 bg-surface-3 border-border">
        {onPlay && (
          <ContextMenuItem onClick={onPlay} className="hover:bg-surface-4">
            <Play className="h-4 w-4 mr-2" />
            Play
          </ContextMenuItem>
        )}

        {type === 'track' && (
          <>
            <ContextMenuItem onClick={handleAddToQueue} className="hover:bg-surface-4">
              <ListMusic className="h-4 w-4 mr-2" />
              Add to queue
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={handleSaveTrack} className="hover:bg-surface-4">
              <Heart className="h-4 w-4 mr-2" />
              Save to Liked Songs
            </ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger className="hover:bg-surface-4">
                <Plus className="h-4 w-4 mr-2" />
                Add to playlist
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-48 bg-surface-3 border-border">
                <ContextMenuItem disabled className="text-muted-foreground">
                  Create Playlist (Soon)
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={() => navigate(`/artist/${(data as SpotifyTrack).artists[0].id}`)}
              className="hover:bg-surface-4"
            >
              <User className="h-4 w-4 mr-2" />
              Go to artist
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => navigate(`/album/${(data as SpotifyTrack).album.id}`)}
              className="hover:bg-surface-4"
            >
              <Disc className="h-4 w-4 mr-2" />
              Go to album
            </ContextMenuItem>
          </>
        )}

        {type === 'album' && (
          <ContextMenuItem
            onClick={() => navigate(`/artist/${(data as SpotifyAlbum).artists[0].id}`)}
            className="hover:bg-surface-4"
          >
            <User className="h-4 w-4 mr-2" />
            Go to artist
          </ContextMenuItem>
        )}

        <ContextMenuSeparator />
        <ContextMenuItem onClick={handleCopyLink} className="hover:bg-surface-4">
          <LinkIcon className="h-4 w-4 mr-2" />
          Copy link
        </ContextMenuItem>
        <ContextMenuItem className="hover:bg-surface-4">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
