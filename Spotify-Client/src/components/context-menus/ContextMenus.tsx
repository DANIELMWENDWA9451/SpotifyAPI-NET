import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Play, Pause, MoreHorizontal, Heart, ListPlus, Radio, Share2, User, Disc, ExternalLink } from 'lucide-react';
import { cn, formatDuration } from '@/lib/utils';
import type { SpotifyTrack, SpotifyArtist, SpotifyAlbum, SpotifyPlaylist } from '@/types/spotify';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

interface TrackContextMenuProps {
  track: SpotifyTrack;
  children: React.ReactNode;
  onAddToQueue?: () => void;
  onAddToPlaylist?: (playlistId: string) => void;
  onToggleLike?: () => void;
  isLiked?: boolean;
}

export function TrackContextMenu({ 
  track, 
  children, 
  onAddToQueue,
  onAddToPlaylist,
  onToggleLike,
  isLiked = false
}: TrackContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64 bg-surface-3 border-border">
        <ContextMenuItem onClick={onAddToQueue} className="hover:bg-surface-4">
          <ListPlus className="h-4 w-4 mr-2" />
          Add to queue
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        <ContextMenuSub>
          <ContextMenuSubTrigger className="hover:bg-surface-4">
            <ListPlus className="h-4 w-4 mr-2" />
            Add to playlist
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48 bg-surface-3 border-border">
            <ContextMenuItem className="hover:bg-surface-4">
              Create playlist
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem className="text-muted-foreground text-xs hover:bg-surface-4">
              Your playlists will appear here
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuItem onClick={onToggleLike} className="hover:bg-surface-4">
          <Heart className={cn("h-4 w-4 mr-2", isLiked && "fill-primary text-primary")} />
          {isLiked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem className="hover:bg-surface-4" asChild>
          <Link to={`/artist/${track.artists[0]?.id}`}>
            <User className="h-4 w-4 mr-2" />
            Go to artist
          </Link>
        </ContextMenuItem>

        <ContextMenuItem className="hover:bg-surface-4" asChild>
          <Link to={`/album/${track.album.id}`}>
            <Disc className="h-4 w-4 mr-2" />
            Go to album
          </Link>
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem className="hover:bg-surface-4">
          <Radio className="h-4 w-4 mr-2" />
          Go to song radio
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuSub>
          <ContextMenuSubTrigger className="hover:bg-surface-4">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48 bg-surface-3 border-border">
            <ContextMenuItem className="hover:bg-surface-4">
              Copy song link
            </ContextMenuItem>
            <ContextMenuItem className="hover:bg-surface-4">
              Embed track
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuItem className="hover:bg-surface-4" asChild>
          <a href={track.external_urls?.spotify} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in Spotify
          </a>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

interface ArtistContextMenuProps {
  artist: SpotifyArtist;
  children: React.ReactNode;
  onFollow?: () => void;
  isFollowing?: boolean;
}

export function ArtistContextMenu({ 
  artist, 
  children, 
  onFollow,
  isFollowing = false 
}: ArtistContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56 bg-surface-3 border-border">
        <ContextMenuItem onClick={onFollow} className="hover:bg-surface-4">
          {isFollowing ? 'Unfollow' : 'Follow'}
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        <ContextMenuItem className="hover:bg-surface-4">
          <Radio className="h-4 w-4 mr-2" />
          Go to artist radio
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuSub>
          <ContextMenuSubTrigger className="hover:bg-surface-4">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48 bg-surface-3 border-border">
            <ContextMenuItem className="hover:bg-surface-4">
              Copy link to artist
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuItem className="hover:bg-surface-4" asChild>
          <a href={artist.external_urls?.spotify} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in Spotify
          </a>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

interface AlbumContextMenuProps {
  album: SpotifyAlbum;
  children: React.ReactNode;
  onAddToLibrary?: () => void;
  isInLibrary?: boolean;
}

export function AlbumContextMenu({ 
  album, 
  children, 
  onAddToLibrary,
  isInLibrary = false 
}: AlbumContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56 bg-surface-3 border-border">
        <ContextMenuItem onClick={onAddToLibrary} className="hover:bg-surface-4">
          <Heart className={cn("h-4 w-4 mr-2", isInLibrary && "fill-primary text-primary")} />
          {isInLibrary ? 'Remove from Library' : 'Add to Library'}
        </ContextMenuItem>

        <ContextMenuItem className="hover:bg-surface-4">
          <ListPlus className="h-4 w-4 mr-2" />
          Add to queue
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        <ContextMenuItem className="hover:bg-surface-4" asChild>
          <Link to={`/artist/${album.artists[0]?.id}`}>
            <User className="h-4 w-4 mr-2" />
            Go to artist
          </Link>
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuSub>
          <ContextMenuSubTrigger className="hover:bg-surface-4">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48 bg-surface-3 border-border">
            <ContextMenuItem className="hover:bg-surface-4">
              Copy album link
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuItem className="hover:bg-surface-4" asChild>
          <a href={album.external_urls?.spotify} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in Spotify
          </a>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

interface PlaylistContextMenuProps {
  playlist: SpotifyPlaylist;
  children: React.ReactNode;
  isOwner?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function PlaylistContextMenu({ 
  playlist, 
  children,
  isOwner = false,
  onEdit,
  onDelete
}: PlaylistContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56 bg-surface-3 border-border">
        <ContextMenuItem className="hover:bg-surface-4">
          <ListPlus className="h-4 w-4 mr-2" />
          Add to queue
        </ContextMenuItem>

        {isOwner && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={onEdit} className="hover:bg-surface-4">
              Edit details
            </ContextMenuItem>
            <ContextMenuItem onClick={onDelete} className="hover:bg-surface-4 text-destructive">
              Delete
            </ContextMenuItem>
          </>
        )}
        
        <ContextMenuSeparator />
        
        <ContextMenuSub>
          <ContextMenuSubTrigger className="hover:bg-surface-4">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48 bg-surface-3 border-border">
            <ContextMenuItem className="hover:bg-surface-4">
              Copy playlist link
            </ContextMenuItem>
            <ContextMenuItem className="hover:bg-surface-4">
              Embed playlist
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuItem className="hover:bg-surface-4" asChild>
          <a href={playlist.external_urls?.spotify} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in Spotify
          </a>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}