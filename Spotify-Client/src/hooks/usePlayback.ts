import { useCallback } from 'react';
import { usePlayerStore } from '@/stores/playerStore';
import { playerApi, libraryApi, followApi, isBackendConfigured } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import type { SpotifyTrack } from '@/types/spotify';

// Check if we're in a context where SpotifyPlayerContext exists
let spotifyPlayerContext: any = null;

export function setSpotifyPlayerContext(context: any) {
  spotifyPlayerContext = context;
}

export function usePlayback() {
  const { playbackState, setPlaybackState, setIsPlaying } = usePlayerStore();

  const getSpotifyPlayer = useCallback(() => {
    return spotifyPlayerContext;
  }, []);

  // Play a specific track
  const playTrack = useCallback(async (track: SpotifyTrack, contextUri?: string) => {
    if (!isBackendConfigured()) {
      toast({ title: 'Backend not configured', variant: 'destructive' });
      return;
    }

    const player = getSpotifyPlayer();
    
    try {
      const options: any = { uris: [track.uri] };
      if (contextUri) {
        options.context_uri = contextUri;
        options.offset = { uri: track.uri };
        delete options.uris;
      }
      
      if (player?.deviceId) {
        options.device_id = player.deviceId;
      }
      
      await playerApi.play(options);
      
      // Optimistically update the UI
      setPlaybackState({
        is_playing: true,
        progress_ms: 0,
        timestamp: Date.now(),
        item: track,
        device: playbackState?.device || null,
        shuffle_state: playbackState?.shuffle_state ?? false,
        repeat_state: playbackState?.repeat_state ?? 'off',
        context: contextUri ? { type: 'playlist', uri: contextUri, external_urls: { spotify: '' } } : null,
        actions: { disallows: {} },
        currently_playing_type: 'track',
      });
    } catch (error) {
      console.error('Failed to play track:', error);
      toast({ title: 'Failed to play track', variant: 'destructive' });
    }
  }, [getSpotifyPlayer, playbackState, setPlaybackState]);

  // Play a context (album, playlist, artist)
  const playContext = useCallback(async (contextUri: string, offset?: number) => {
    if (!isBackendConfigured()) {
      toast({ title: 'Backend not configured', variant: 'destructive' });
      return;
    }

    const player = getSpotifyPlayer();

    try {
      const options: any = { context_uri: contextUri };
      if (offset !== undefined) {
        options.offset = { position: offset };
      }
      if (player?.deviceId) {
        options.device_id = player.deviceId;
      }
      
      await playerApi.play(options);
      setIsPlaying(true);
    } catch (error) {
      console.error('Failed to play context:', error);
      toast({ title: 'Failed to play', variant: 'destructive' });
    }
  }, [getSpotifyPlayer, setIsPlaying]);

  // Play multiple tracks
  const playTracks = useCallback(async (tracks: SpotifyTrack[], startIndex = 0) => {
    if (!isBackendConfigured() || tracks.length === 0) return;

    const player = getSpotifyPlayer();

    try {
      const uris = tracks.map(t => t.uri);
      const options: any = { uris, offset: { position: startIndex } };
      
      if (player?.deviceId) {
        options.device_id = player.deviceId;
      }
      
      await playerApi.play(options);
      
      setPlaybackState({
        is_playing: true,
        progress_ms: 0,
        timestamp: Date.now(),
        item: tracks[startIndex],
        device: playbackState?.device || null,
        shuffle_state: playbackState?.shuffle_state ?? false,
        repeat_state: playbackState?.repeat_state ?? 'off',
        context: null,
        actions: { disallows: {} },
        currently_playing_type: 'track',
      });
    } catch (error) {
      console.error('Failed to play tracks:', error);
      toast({ title: 'Failed to play tracks', variant: 'destructive' });
    }
  }, [getSpotifyPlayer, playbackState, setPlaybackState]);

  // Add to queue
  const addToQueue = useCallback(async (track: SpotifyTrack) => {
    if (!isBackendConfigured()) return;

    try {
      await playerApi.addToQueue(track.uri);
      toast({ title: `Added "${track.name}" to queue` });
    } catch (error) {
      console.error('Failed to add to queue:', error);
      toast({ title: 'Failed to add to queue', variant: 'destructive' });
    }
  }, []);

  // Like/unlike track
  const toggleLikeTrack = useCallback(async (trackId: string, isLiked: boolean) => {
    if (!isBackendConfigured()) return;

    try {
      if (isLiked) {
        await libraryApi.removeSavedTrack(trackId);
        toast({ title: 'Removed from Liked Songs' });
      } else {
        await libraryApi.saveTrack(trackId);
        toast({ title: 'Added to Liked Songs' });
      }
      return !isLiked;
    } catch (error) {
      console.error('Failed to toggle like:', error);
      toast({ title: 'Failed to update', variant: 'destructive' });
      return isLiked;
    }
  }, []);

  // Save/unsave album
  const toggleSaveAlbum = useCallback(async (albumId: string, isSaved: boolean) => {
    if (!isBackendConfigured()) return;

    try {
      if (isSaved) {
        await libraryApi.removeSavedAlbum(albumId);
        toast({ title: 'Removed from Library' });
      } else {
        await libraryApi.saveAlbum(albumId);
        toast({ title: 'Added to Library' });
      }
      return !isSaved;
    } catch (error) {
      console.error('Failed to toggle album save:', error);
      toast({ title: 'Failed to update', variant: 'destructive' });
      return isSaved;
    }
  }, []);

  // Follow/unfollow artist
  const toggleFollowArtist = useCallback(async (artistId: string, isFollowing: boolean) => {
    if (!isBackendConfigured()) return;

    try {
      if (isFollowing) {
        await followApi.unfollowArtist(artistId);
        toast({ title: 'Unfollowed artist' });
      } else {
        await followApi.followArtist(artistId);
        toast({ title: 'Following artist' });
      }
      return !isFollowing;
    } catch (error) {
      console.error('Failed to toggle follow:', error);
      toast({ title: 'Failed to update', variant: 'destructive' });
      return isFollowing;
    }
  }, []);

  // Follow/unfollow playlist
  const toggleFollowPlaylist = useCallback(async (playlistId: string, isFollowing: boolean) => {
    if (!isBackendConfigured()) return;

    try {
      if (isFollowing) {
        await followApi.unfollowPlaylist(playlistId);
        toast({ title: 'Removed from Library' });
      } else {
        await followApi.followPlaylist(playlistId);
        toast({ title: 'Added to Library' });
      }
      return !isFollowing;
    } catch (error) {
      console.error('Failed to toggle playlist follow:', error);
      toast({ title: 'Failed to update', variant: 'destructive' });
      return isFollowing;
    }
  }, []);

  return {
    currentTrack: playbackState?.item,
    isPlaying: playbackState?.is_playing ?? false,
    playTrack,
    playContext,
    playTracks,
    addToQueue,
    toggleLikeTrack,
    toggleSaveAlbum,
    toggleFollowArtist,
    toggleFollowPlaylist,
  };
}
