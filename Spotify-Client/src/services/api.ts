import type {
  SpotifyUser,
  SpotifyTrack,
  SpotifyPlaylist,
  SpotifyArtist,
  SpotifyAlbum,
  PlaybackState,
  SearchResults,
  RecentlyPlayed,
  Category,
  SpotifyDevice,
  AudioFeatures,
  Recommendations,
  SpotifyShow,
  SpotifyEpisode
} from '@/types/spotify';

// Configuration - Set your deployed backend URL in environment variables
// In development, default to localhost:5000.
// In production, use VITE_API_BASE_URL env var if set, otherwise default to relative path (if using proxy).
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');
// Sanitize: Remove trailing slash and '/api' suffix if present to avoid double /api/api
const API_BASE_URL = rawBaseUrl.replace(/\/$/, '').replace(/\/api$/, '');

// Token Management
const TOKEN_KEY = 'spotify_auth_token';

export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const removeToken = () => localStorage.removeItem(TOKEN_KEY);

// Check if backend is configured (always true now as we support relative paths)
export const isBackendConfigured = (): boolean => true;

// API wrapper with error handling
async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  // Relative path logic relies on API_BASE_URL being empty string

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    // credentials: 'include', // Cookies NO LONGER NEEDED for Auth (but maybe for verifier? No, verifier is backend-only)
    // Actually, let's keep it 'include' just in case, it doesn't hurt.
  });

  if (response.status === 401) {
    // Only redirect to login if not already on the login page
    if (!window.location.pathname.includes('/login')) {
      removeToken(); // Clear invalid token
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.error) errorMessage = errorJson.error;
    } catch {
      // If parsing fails, use text or default message
      if (errorText) errorMessage = errorText;
    }
    throw new Error(errorMessage);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

// Auth API
export const authApi = {
  login: () => {
    window.location.href = `${API_BASE_URL}/api/auth/login`;
  },
  logout: () => {
    removeToken();
    return apiRequest<void>('/api/auth/logout', { method: 'POST' });
  },
  checkAuth: async () => {
    // If we don't have a token, we are definitely not authenticated
    if (!getToken()) return { isAuthenticated: false };
    return apiRequest<{ isAuthenticated: boolean; user?: SpotifyUser }>('/api/auth/check');
  },
  callback: (code: string) => apiRequest<{ success: boolean }>(`/api/auth/callback?code=${code}`),
  getToken: async () => {
    const response = await apiRequest<{ access_token: string; new_token?: string }>('/api/auth/token');
    // If backend returned a refreshed token, update our stored token
    if (response.new_token) {
      setToken(response.new_token);
    }
    return response;
  },
};

// User API
export const userApi = {
  getProfile: () => apiRequest<SpotifyUser>('/api/user/profile'),
  getPlaylists: () => apiRequest<SpotifyPlaylist[]>('/api/user/playlists?limit=50'),
  getPlaylistsPaginated: (limit = 50, offset = 0) =>
    apiRequest<SpotifyPlaylist[]>(`/api/user/playlists?limit=${limit}&offset=${offset}`),
  getTopTracks: (limit = 20, timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term') =>
    apiRequest<SpotifyTrack[]>(`/api/user/top-tracks?limit=${limit}&time_range=${timeRange}`),
  getTopArtists: (limit = 20, timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term') =>
    apiRequest<SpotifyArtist[]>(`/api/user/top-artists?limit=${limit}&time_range=${timeRange}`),
  getRecentlyPlayed: (limit = 50) =>
    apiRequest<RecentlyPlayed>(`/api/user/recently-played?limit=${limit}`),
  getSavedAlbums: () => apiRequest<SpotifyAlbum[]>('/api/user/saved-albums?limit=50'),
  getSavedAlbumsPaginated: (limit = 50, offset = 0) =>
    apiRequest<SpotifyAlbum[]>(`/api/user/saved-albums?limit=${limit}&offset=${offset}`),
  getSavedTracks: () => apiRequest<SpotifyTrack[]>('/api/user/saved-tracks?limit=50'),
  getSavedTracksPaginated: (limit = 50, offset = 0) =>
    apiRequest<SpotifyTrack[]>(`/api/user/saved-tracks?limit=${limit}&offset=${offset}`),
  getFollowedArtists: (limit = 50) =>
    apiRequest<SpotifyArtist[]>(`/api/user/following/artists?limit=${limit}`),
  getSavedShows: () => apiRequest<SpotifyShow[]>('/api/user/shows?limit=50'),
  getSavedEpisodes: () => apiRequest<SpotifyEpisode[]>('/api/user/episodes?limit=50'),
};

// Library API
export const libraryApi = {
  saveTrack: (trackId: string) =>
    apiRequest<void>('/api/library/tracks', { method: 'PUT', body: JSON.stringify({ ids: [trackId] }) }),
  removeSavedTrack: (trackId: string) =>
    apiRequest<void>('/api/library/tracks', { method: 'DELETE', body: JSON.stringify({ ids: [trackId] }) }),
  checkSavedTracks: (trackIds: string[]) =>
    apiRequest<boolean[]>(`/api/library/tracks/contains?ids=${trackIds.join(',')}`),
  saveAlbum: (albumId: string) =>
    apiRequest<void>('/api/library/albums', { method: 'PUT', body: JSON.stringify({ ids: [albumId] }) }),
  removeSavedAlbum: (albumId: string) =>
    apiRequest<void>('/api/library/albums', { method: 'DELETE', body: JSON.stringify({ ids: [albumId] }) }),
  checkSavedAlbums: (albumIds: string[]) =>
    apiRequest<boolean[]>(`/api/library/albums/contains?ids=${albumIds.join(',')}`),
  saveShow: (showId: string) =>
    apiRequest<void>('/api/library/shows', { method: 'PUT', body: JSON.stringify({ ids: [showId] }) }),
  removeSavedShow: (showId: string) =>
    apiRequest<void>('/api/library/shows', { method: 'DELETE', body: JSON.stringify({ ids: [showId] }) }),
  checkSavedShows: (showIds: string[]) =>
    apiRequest<boolean[]>(`/api/library/shows/contains?ids=${showIds.join(',')}`),
  saveEpisode: (episodeId: string) =>
    apiRequest<void>('/api/library/episodes', { method: 'PUT', body: JSON.stringify({ ids: [episodeId] }) }),
  removeSavedEpisode: (episodeId: string) =>
    apiRequest<void>('/api/library/episodes', { method: 'DELETE', body: JSON.stringify({ ids: [episodeId] }) }),
  checkSavedEpisodes: (episodeIds: string[]) =>
    apiRequest<boolean[]>(`/api/library/episodes/contains?ids=${episodeIds.join(',')}`),
};

// Follow API
export const followApi = {
  followArtist: (artistId: string) =>
    apiRequest<void>('/api/follow/artists', { method: 'PUT', body: JSON.stringify({ ids: [artistId] }) }),
  unfollowArtist: (artistId: string) =>
    apiRequest<void>('/api/follow/artists', { method: 'DELETE', body: JSON.stringify({ ids: [artistId] }) }),
  checkFollowingArtists: (artistIds: string[]) =>
    apiRequest<boolean[]>(`/api/follow/artists/contains?ids=${artistIds.join(',')}`),
  followPlaylist: (playlistId: string) =>
    apiRequest<void>(`/api/playlists/${playlistId}/followers`, { method: 'PUT' }),
  unfollowPlaylist: (playlistId: string) =>
    apiRequest<void>(`/api/playlists/${playlistId}/followers`, { method: 'DELETE' }),
  checkFollowingPlaylist: (playlistId: string, userIds: string[]) =>
    apiRequest<boolean[]>(`/api/playlists/${playlistId}/followers/contains?ids=${userIds.join(',')}`),
};

// Player API
export const playerApi = {
  getCurrentPlayback: () => apiRequest<PlaybackState>('/api/player/current'),
  getDevices: () => apiRequest<SpotifyDevice[]>('/api/player/devices'),
  getQueue: () => apiRequest<{ currently_playing: SpotifyTrack | null; queue: SpotifyTrack[] }>('/api/player/queue'),
  play: (options?: { uri?: string; uris?: string[]; context_uri?: string; offset?: { position?: number; uri?: string }; position_ms?: number; device_id?: string }) =>
    apiRequest<void>('/api/player/play', { method: 'PUT', body: JSON.stringify(options) }),
  pause: (deviceId?: string) =>
    apiRequest<void>(`/api/player/pause${deviceId ? `?device_id=${deviceId}` : ''}`, { method: 'PUT' }),
  skipNext: (deviceId?: string) =>
    apiRequest<void>(`/api/player/next${deviceId ? `?device_id=${deviceId}` : ''}`, { method: 'POST' }),
  skipPrevious: (deviceId?: string) =>
    apiRequest<void>(`/api/player/previous${deviceId ? `?device_id=${deviceId}` : ''}`, { method: 'POST' }),
  seek: (positionMs: number, deviceId?: string) =>
    apiRequest<void>(`/api/player/seek?position_ms=${positionMs}${deviceId ? `&device_id=${deviceId}` : ''}`, { method: 'PUT' }),
  setVolume: (volumePercent: number, deviceId?: string) =>
    apiRequest<void>(`/api/player/volume?volume_percent=${volumePercent}${deviceId ? `&device_id=${deviceId}` : ''}`, { method: 'PUT' }),
  setShuffle: (state: boolean, deviceId?: string) =>
    apiRequest<void>(`/api/player/shuffle?state=${state}${deviceId ? `&device_id=${deviceId}` : ''}`, { method: 'PUT' }),
  setRepeat: (state: 'off' | 'track' | 'context', deviceId?: string) =>
    apiRequest<void>(`/api/player/repeat?state=${state}${deviceId ? `&device_id=${deviceId}` : ''}`, { method: 'PUT' }),
  transferPlayback: (deviceIds: string[], play?: boolean) =>
    apiRequest<void>('/api/player/transfer', { method: 'PUT', body: JSON.stringify({ deviceIds, play: play ?? false }) }),
  addToQueue: (uri: string, deviceId?: string) =>
    apiRequest<void>(`/api/player/queue?uri=${encodeURIComponent(uri)}${deviceId ? `&device_id=${deviceId}` : ''}`, { method: 'POST' }),
};

// Playlist API
export const playlistApi = {
  getPlaylist: (playlistId: string) =>
    apiRequest<SpotifyPlaylist>(`/api/playlists/${playlistId}`),
  getPlaylistTracks: (playlistId: string, limit = 100, offset = 0) =>
    apiRequest<{ items: Array<{ added_at: string; track: SpotifyTrack }>; total: number }>(
      `/api/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`
    ),
  createPlaylist: (userId: string, name: string, description?: string, isPublic = false) =>
    apiRequest<SpotifyPlaylist>(`/api/users/${userId}/playlists`, {
      method: 'POST',
      body: JSON.stringify({ name, description, public: isPublic }),
    }),
  updatePlaylistDetails: (playlistId: string, data: { name?: string; description?: string; public?: boolean }) =>
    apiRequest<void>(`/api/playlists/${playlistId}`, { method: 'PUT', body: JSON.stringify(data) }),
  addTracksToPlaylist: (playlistId: string, uris: string[], position?: number) =>
    apiRequest<{ snapshot_id: string }>(`/api/playlists/${playlistId}/tracks`, {
      method: 'POST',
      body: JSON.stringify({ uris, position }),
    }),
  removeTracksFromPlaylist: (playlistId: string, uris: string[]) =>
    apiRequest<{ snapshot_id: string }>(`/api/playlists/${playlistId}/tracks`, {
      method: 'DELETE',
      body: JSON.stringify({ tracks: uris.map(uri => ({ uri })) }),
    }),
  reorderPlaylistTracks: (playlistId: string, rangeStart: number, insertBefore: number, rangeLength = 1) =>
    apiRequest<{ snapshot_id: string }>(`/api/playlists/${playlistId}/tracks`, {
      method: 'PUT',
      body: JSON.stringify({ range_start: rangeStart, insert_before: insertBefore, range_length: rangeLength }),
    }),
  uploadPlaylistCover: (playlistId: string, imageBase64: string) =>
    apiRequest<void>(`/api/playlists/${playlistId}/images`, {
      method: 'PUT',
      headers: { 'Content-Type': 'image/jpeg' },
      body: imageBase64,
    }),
};

// Album API
export const albumApi = {
  getAlbum: (albumId: string) =>
    apiRequest<SpotifyAlbum & { tracks: { items: SpotifyTrack[]; total: number }; copyrights: Array<{ text: string; type: string }>; label: string }>(
      `/api/albums/${albumId}`
    ),
  getAlbumTracks: (albumId: string, limit = 50, offset = 0) =>
    apiRequest<{ items: SpotifyTrack[]; total: number }>(`/api/albums/${albumId}/tracks?limit=${limit}&offset=${offset}`),
  getNewReleases: (limit = 20, offset = 0) =>
    apiRequest<SpotifyAlbum[]>(`/api/browse/new-releases?limit=${limit}&offset=${offset}`),
};

// Artist API
export const artistApi = {
  getArtist: (artistId: string) =>
    apiRequest<SpotifyArtist>(`/api/artists/${artistId}`),
  getArtistTopTracks: async (artistId: string, market = 'US') => {
    const response = await apiRequest<{ tracks: SpotifyTrack[] }>(`/api/artists/${artistId}/top-tracks?market=${market}`);
    return response.tracks ?? [];
  },
  getArtistAlbums: async (artistId: string, includeGroups = 'album,single', limit = 20, offset = 0) => {
    const response = await apiRequest<{ items: SpotifyAlbum[]; total: number }>(`/api/artists/${artistId}/albums?include_groups=${includeGroups}&limit=${limit}&offset=${offset}`);
    return response.items ?? [];
  },
  getRelatedArtists: async (artistId: string) => {
    const response = await apiRequest<{ artists: SpotifyArtist[] }>(`/api/artists/${artistId}/related-artists`);
    return response.artists ?? [];
  },
};

// Track API
export const trackApi = {
  getTrack: (trackId: string) =>
    apiRequest<SpotifyTrack>(`/api/tracks/${trackId}`),
  getTracks: (trackIds: string[]) =>
    apiRequest<SpotifyTrack[]>(`/api/tracks?ids=${trackIds.join(',')}`),
  getAudioFeatures: (trackId: string) =>
    apiRequest<AudioFeatures>(`/api/audio-features/${trackId}`),
  getAudioFeaturesForTracks: (trackIds: string[]) =>
    apiRequest<AudioFeatures[]>(`/api/audio-features?ids=${trackIds.join(',')}`),
  getLyrics: (trackId: string) =>
    apiRequest<any>(`/api/lyrics/${trackId}`),
};

// Show/Podcast API
export const showApi = {
  getShow: (showId: string) =>
    apiRequest<SpotifyShow>(`/api/shows/${showId}`),
  getShowEpisodes: (showId: string, limit = 20, offset = 0) =>
    apiRequest<{ items: SpotifyEpisode[]; total: number }>(`/api/shows/${showId}/episodes?limit=${limit}&offset=${offset}`),
  getShows: (showIds: string[]) =>
    apiRequest<SpotifyShow[]>(`/api/shows?ids=${showIds.join(',')}`),
};

// Episode API
export const episodeApi = {
  getEpisode: (episodeId: string) =>
    apiRequest<SpotifyEpisode>(`/api/episodes/${episodeId}`),
  getEpisodes: (episodeIds: string[]) =>
    apiRequest<SpotifyEpisode[]>(`/api/episodes?ids=${episodeIds.join(',')}`),
};

// Search API
export const searchApi = {
  search: (query: string, types = 'track,artist,album,playlist', limit = 20, offset = 0) =>
    apiRequest<SearchResults>(`/api/search?q=${encodeURIComponent(query)}&type=${types}&limit=${limit}&offset=${offset}`),
  searchWithShows: (query: string, limit = 20, offset = 0) =>
    apiRequest<SearchResults>(`/api/search?q=${encodeURIComponent(query)}&type=track,artist,album,playlist,show,episode&limit=${limit}&offset=${offset}`),
};

// Browse API
export const browseApi = {
  getCategories: () => apiRequest<Category[]>('/api/browse/categories?limit=50'),
  getCategoriesWithContent: () => apiRequest<Category[]>('/api/browse/categories-with-content'),
  getCategoriesPaginated: (limit = 50, offset = 0) =>
    apiRequest<Category[]>(`/api/browse/categories?limit=${limit}&offset=${offset}`),
  getCategory: (categoryId: string) =>
    apiRequest<Category>(`/api/browse/categories/${categoryId}`),
  getCategoryPlaylists: (categoryId: string, limit = 20, offset = 0) =>
    apiRequest<SpotifyPlaylist[]>(`/api/browse/categories/${categoryId}/playlists?limit=${limit}&offset=${offset}`),
  getFeaturedPlaylists: (limit = 20, offset = 0) =>
    apiRequest<{ message: string; playlists: SpotifyPlaylist[] }>(`/api/browse/featured-playlists?limit=${limit}&offset=${offset}`),
  getNewReleases: (limit = 20, offset = 0) =>
    apiRequest<SpotifyAlbum[]>(`/api/browse/new-releases?limit=${limit}&offset=${offset}`),
  getMarkets: () => apiRequest<string[]>('/api/browse/markets'),
};

// Recommendations API
export const recommendationsApi = {
  getRecommendations: (options: {
    seed_artists?: string[];
    seed_genres?: string[];
    seed_tracks?: string[];
    limit?: number;
    min_acousticness?: number;
    max_acousticness?: number;
    target_acousticness?: number;
    min_danceability?: number;
    max_danceability?: number;
    target_danceability?: number;
    min_energy?: number;
    max_energy?: number;
    target_energy?: number;
    min_instrumentalness?: number;
    max_instrumentalness?: number;
    min_popularity?: number;
    max_popularity?: number;
    min_tempo?: number;
    max_tempo?: number;
    target_tempo?: number;
    min_valence?: number;
    max_valence?: number;
    target_valence?: number;
  }) => {
    const params = new URLSearchParams();
    if (options.seed_artists?.length) params.append('seed_artists', options.seed_artists.join(','));
    if (options.seed_genres?.length) params.append('seed_genres', options.seed_genres.join(','));
    if (options.seed_tracks?.length) params.append('seed_tracks', options.seed_tracks.join(','));
    if (options.limit) params.append('limit', options.limit.toString());
    Object.entries(options).forEach(([key, value]) => {
      if (key.startsWith('min_') || key.startsWith('max_') || key.startsWith('target_')) {
        if (value !== undefined) params.append(key, value.toString());
      }
    });
    return apiRequest<Recommendations>(`/api/recommendations?${params.toString()}`);
  },
  getAvailableGenreSeeds: () =>
    apiRequest<{ genres: string[] }>('/api/recommendations/available-genre-seeds'),
};