// Extended Spotify API Types - Podcasts, Shows, Episodes

export interface SpotifyUser {
  id: string;
  display_name: string;
  email?: string;
  images: SpotifyImage[];
  followers?: {
    total: number;
  };
  product?: 'free' | 'premium' | 'open';
  country?: string;
  explicit_content?: {
    filter_enabled: boolean;
    filter_locked: boolean;
  };
  uri: string;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyImage {
  url: string;
  height: number | null;
  width: number | null;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  images: SpotifyImage[];
  genres?: string[];
  followers?: {
    total: number;
  };
  popularity?: number;
  uri: string;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  images: SpotifyImage[];
  artists: SpotifyArtist[];
  release_date: string;
  release_date_precision: 'year' | 'month' | 'day';
  total_tracks: number;
  album_type: 'album' | 'single' | 'compilation';
  uri: string;
  external_urls: {
    spotify: string;
  };
  available_markets?: string[];
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  duration_ms: number;
  explicit: boolean;
  popularity: number;
  preview_url: string | null;
  uri: string;
  track_number: number;
  disc_number: number;
  is_local: boolean;
  is_playable?: boolean;
  linked_from?: {
    id: string;
    uri: string;
  };
  external_urls: {
    spotify: string;
  };
  external_ids?: {
    isrc?: string;
    ean?: string;
    upc?: string;
  };
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string | null;
  images: SpotifyImage[];
  owner: {
    id: string;
    display_name: string;
    uri: string;
    external_urls: {
      spotify: string;
    };
  };
  tracks: {
    total: number;
    items?: Array<{
      added_at: string;
      added_by: {
        id: string;
        uri: string;
      };
      track: SpotifyTrack;
    }>;
  };
  public: boolean;
  collaborative: boolean;
  uri: string;
  snapshot_id: string;
  followers?: {
    total: number;
  };
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyDevice {
  id: string;
  name: string;
  type: 'Computer' | 'Smartphone' | 'Speaker' | 'TV' | 'AVR' | 'STB' | 'AudioDongle' | 'GameConsole' | 'CastVideo' | 'CastAudio' | 'Automobile' | 'Unknown';
  volume_percent: number;
  is_active: boolean;
  is_private_session: boolean;
  is_restricted: boolean;
  supports_volume: boolean;
}

export interface PlaybackState {
  is_playing: boolean;
  progress_ms: number;
  timestamp: number;
  item: SpotifyTrack | null;
  device: SpotifyDevice | null;
  shuffle_state: boolean;
  repeat_state: 'off' | 'track' | 'context';
  context: {
    type: 'album' | 'artist' | 'playlist' | 'show';
    uri: string;
    external_urls: {
      spotify: string;
    };
  } | null;
  actions: {
    disallows: {
      interrupting_playback?: boolean;
      pausing?: boolean;
      resuming?: boolean;
      seeking?: boolean;
      skipping_next?: boolean;
      skipping_prev?: boolean;
      toggling_repeat_context?: boolean;
      toggling_repeat_track?: boolean;
      toggling_shuffle?: boolean;
      transferring_playback?: boolean;
    };
  };
  currently_playing_type: 'track' | 'episode' | 'ad' | 'unknown';
}

export interface SearchResults {
  tracks: {
    items: SpotifyTrack[];
    total: number;
    limit: number;
    offset: number;
    next: string | null;
    previous: string | null;
  };
  artists: {
    items: SpotifyArtist[];
    total: number;
    limit: number;
    offset: number;
    next: string | null;
    previous: string | null;
  };
  albums: {
    items: SpotifyAlbum[];
    total: number;
    limit: number;
    offset: number;
    next: string | null;
    previous: string | null;
  };
  playlists: {
    items: SpotifyPlaylist[];
    total: number;
    limit: number;
    offset: number;
    next: string | null;
    previous: string | null;
  };
  shows?: {
    items: SpotifyShow[];
    total: number;
    limit: number;
    offset: number;
    next: string | null;
    previous: string | null;
  };
  episodes?: {
    items: SpotifyEpisode[];
    total: number;
    limit: number;
    offset: number;
    next: string | null;
    previous: string | null;
  };
}

export interface RecentlyPlayed {
  items: Array<{
    track: SpotifyTrack;
    played_at: string;
    context: {
      type: string;
      uri: string;
      external_urls: {
        spotify: string;
      };
    } | null;
  }>;
  next: string | null;
  cursors: {
    after: string;
    before: string;
  };
  limit: number;
  total?: number;
}

export interface Category {
  id: string;
  name: string;
  icons: SpotifyImage[];
  href: string;
}

export interface AudioFeatures {
  id: string;
  acousticness: number;
  analysis_url: string;
  danceability: number;
  duration_ms: number;
  energy: number;
  instrumentalness: number;
  key: number;
  liveness: number;
  loudness: number;
  mode: number;
  speechiness: number;
  tempo: number;
  time_signature: number;
  track_href: string;
  type: 'audio_features';
  uri: string;
  valence: number;
}

export interface AudioAnalysis {
  bars: Array<{ start: number; duration: number; confidence: number }>;
  beats: Array<{ start: number; duration: number; confidence: number }>;
  sections: Array<{
    start: number;
    duration: number;
    confidence: number;
    loudness: number;
    tempo: number;
    tempo_confidence: number;
    key: number;
    key_confidence: number;
    mode: number;
    mode_confidence: number;
    time_signature: number;
    time_signature_confidence: number;
  }>;
  segments: Array<{
    start: number;
    duration: number;
    confidence: number;
    loudness_start: number;
    loudness_max: number;
    loudness_max_time: number;
    loudness_end: number;
    pitches: number[];
    timbre: number[];
  }>;
  tatums: Array<{ start: number; duration: number; confidence: number }>;
  track: {
    duration: number;
    sample_md5: string;
    offset_seconds: number;
    window_seconds: number;
    analysis_sample_rate: number;
    analysis_channels: number;
    end_of_fade_in: number;
    start_of_fade_out: number;
    loudness: number;
    tempo: number;
    tempo_confidence: number;
    time_signature: number;
    time_signature_confidence: number;
    key: number;
    key_confidence: number;
    mode: number;
    mode_confidence: number;
  };
}

export interface Recommendations {
  seeds: Array<{
    id: string;
    type: 'artist' | 'track' | 'genre';
    href: string | null;
    initialPoolSize: number;
    afterFilteringSize: number;
    afterRelinkingSize: number;
  }>;
  tracks: SpotifyTrack[];
}

// Podcast/Show Types
export interface SpotifyShow {
  id: string;
  name: string;
  description: string;
  html_description: string;
  images: SpotifyImage[];
  publisher: string;
  languages: string[];
  explicit: boolean;
  total_episodes: number;
  media_type: string;
  uri: string;
  is_externally_hosted: boolean;
  available_markets?: string[];
  copyrights: Array<{ text: string; type: string }>;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyEpisode {
  id: string;
  name: string;
  description: string;
  html_description: string;
  images: SpotifyImage[];
  duration_ms: number;
  explicit: boolean;
  release_date: string;
  release_date_precision: 'year' | 'month' | 'day';
  uri: string;
  is_playable: boolean;
  language: string;
  languages: string[];
  audio_preview_url: string | null;
  resume_point?: {
    fully_played: boolean;
    resume_position_ms: number;
  };
  show: SpotifyShow;
  external_urls: {
    spotify: string;
  };
}

export interface SavedShow {
  added_at: string;
  show: SpotifyShow;
}

export interface SavedEpisode {
  added_at: string;
  episode: SpotifyEpisode;
}

export interface SavedTrack {
  added_at: string;
  track: SpotifyTrack;
}

export interface SavedAlbum {
  added_at: string;
  album: SpotifyAlbum;
}

export interface FollowedArtists {
  artists: {
    items: SpotifyArtist[];
    next: string | null;
    total: number;
    cursors: {
      after: string;
    };
    limit: number;
  };
}