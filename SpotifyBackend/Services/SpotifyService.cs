namespace SpotifyBackend.Services;

using SpotifyAPI.Web;
using Microsoft.AspNetCore.Http;
using System.Text.Json;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.Logging;

public class SpotifyService
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly SpotifyAuthService _authService;
    private readonly IDataProtector _protector;
    private readonly ILogger<SpotifyService> _logger;
    private const string TokenCookieName = "spotify_auth";

    public SpotifyService(
        IHttpContextAccessor httpContextAccessor, 
        SpotifyAuthService authService, 
        IDataProtectionProvider provider,
        ILogger<SpotifyService> logger)
    {
        _httpContextAccessor = httpContextAccessor;
        _authService = authService;
        _protector = provider.CreateProtector("SpotifyService");
        _logger = logger;
    }

    public bool IsAuthenticated => GetToken() != null;

    public string GenerateEncryptedToken(PKCETokenResponse token)
    {
        var tokenJson = JsonSerializer.Serialize(token);
        return _protector.Protect(tokenJson);
    }

    public PKCETokenResponse? GetToken()
    {
        // Try to get token from Authorization header
        var authHeader = _httpContextAccessor.HttpContext?.Request.Headers["Authorization"].FirstOrDefault();
        
        string? encryptedToken = null;
        if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            encryptedToken = authHeader.Substring("Bearer ".Length).Trim();
        }

        // Fallback: Try Cookie (optional, in case we want hybrid support, but let's stick to header for now)
        if (string.IsNullOrEmpty(encryptedToken))
        {
             encryptedToken = _httpContextAccessor.HttpContext?.Request.Cookies[TokenCookieName];
        }

        if (string.IsNullOrEmpty(encryptedToken))
            return null;

        try
        {
            var tokenJson = _protector.Unprotect(encryptedToken);
            return JsonSerializer.Deserialize<PKCETokenResponse>(tokenJson);
        }
        catch
        {
            return null;
        }
    }

    public void ClearToken()
    {
        // For stateless header auth, the client just discards the token.
        // We can still try to delete the cookie just in case.
        _httpContextAccessor.HttpContext?.Response.Cookies.Delete(TokenCookieName);
    }

    public string? GetAccessToken()
    {
        var token = GetToken();
        return token?.AccessToken;
    }

    /// <summary>
    /// Check if token is expired or about to expire (within 5 minutes)
    /// </summary>
    private bool IsTokenExpiredOrExpiring(PKCETokenResponse token)
    {
        if (token.CreatedAt == default)
            return true; // Unknown creation time, assume expired
        
        var expiresAt = token.CreatedAt.AddSeconds(token.ExpiresIn);
        var bufferTime = TimeSpan.FromMinutes(5); // Refresh 5 minutes before expiry
        return DateTime.UtcNow >= expiresAt - bufferTime;
    }

    /// <summary>
    /// Refresh the token if expired/expiring and return new encrypted token.
    /// Returns null if token is still valid (no refresh needed) or on error.
    /// </summary>
    public async Task<string?> RefreshTokenIfNeededAsync()
    {
        var token = GetToken();
        if (token == null)
        {
            _logger.LogWarning("RefreshTokenIfNeeded: No token found");
            return null;
        }

        // Check if token needs refresh
        if (!IsTokenExpiredOrExpiring(token))
        {
            _logger.LogDebug("Token still valid, no refresh needed");
            return null; // No refresh needed
        }

        // Token is expired or expiring, refresh it
        if (string.IsNullOrEmpty(token.RefreshToken))
        {
            _logger.LogWarning("Token expired but no refresh token available");
            return null;
        }

        try
        {
            _logger.LogInformation("Refreshing expired Spotify token");
            var newToken = await _authService.RefreshToken(token.RefreshToken);
            var newEncryptedToken = GenerateEncryptedToken(newToken);
            _logger.LogInformation("Token refreshed successfully");
            return newEncryptedToken;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to refresh token");
            return null;
        }
    }

    /// <summary>
    /// Get a SpotifyClient (Stateless: No auto-refresh on server)
    /// </summary>
    public SpotifyClient? GetClient()
    {
        var token = GetToken();
        if (token == null)
            return null;

        return _authService.CreateClient(token);
    }

    /// <summary>
    /// Get a SpotifyClient asynchronously (Stateless: No auto-refresh on server)
    /// </summary>
    public async Task<SpotifyClient?> GetClientAsync()
    {
        var token = GetToken();
        if (token == null)
            return null;

        return _authService.CreateClient(token);
    }

    // User Profile
    public async Task<PrivateUser?> GetCurrentUserProfile()
    {
        var client = GetClient();
        if (client == null) return null;

        try { return await client.UserProfile.Current(); }
        catch (Exception ex) { _logger.LogError(ex, "Failed to get current user profile"); return null; }
    }

    // Playback
    public async Task<CurrentlyPlayingContext?> GetCurrentPlayback()
    {
        var client = GetClient();
        if (client == null) return null;

        try { return await client.Player.GetCurrentPlayback(); }
        catch (Exception ex) { _logger.LogError(ex, "Failed to get current playback"); return null; }
    }

    public async Task<bool> PlayTrack(string uri)
    {
        var client = GetClient();
        if (client == null) return false;

        try
        {
            var request = new PlayerResumePlaybackRequest { Uris = new List<string> { uri } };
            await client.Player.ResumePlayback(request);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to play track {TrackUri}", uri);
            return false;
        }
    }

    public async Task<bool> PausePlayback()
    {
        var client = GetClient();
        if (client == null) return false;

        try { await client.Player.PausePlayback(); return true; }
        catch (Exception ex) { _logger.LogError(ex, "Failed to pause playback"); return false; }
    }

    public async Task<bool> ResumePlayback()
    {
        var client = GetClient();
        if (client == null) return false;

        try { await client.Player.ResumePlayback(); return true; }
        catch (Exception ex) { _logger.LogError(ex, "Failed to resume playback"); return false; }
    }

    public async Task<bool> SkipNext()
    {
        var client = GetClient();
        if (client == null) return false;

        try { await client.Player.SkipNext(); return true; }
        catch (Exception ex) { _logger.LogError(ex, "Failed to skip to next track"); return false; }
    }

    public async Task<bool> SkipPrevious()
    {
        var client = GetClient();
        if (client == null) return false;

        try { await client.Player.SkipPrevious(); return true; }
        catch (Exception ex) { _logger.LogError(ex, "Failed to skip to previous track"); return false; }
    }

    // Search
    public async Task<SearchResponse?> Search(string query, SearchRequest.Types type = SearchRequest.Types.All)
    {
        var client = GetClient();
        if (client == null) return null;

        try { return await client.Search.Item(new SearchRequest(type, query)); }
        catch (Exception ex) { _logger.LogError(ex, "Failed to search for {Query}", query); return null; }
    }

    // Playlists
    public async Task<Paging<FullPlaylist>?> GetUserPlaylists()
    {
        var client = GetClient();
        if (client == null) return null;

        try { return await client.Playlists.CurrentUsers(); }
        catch (Exception ex) { _logger.LogError(ex, "Failed to get user playlists"); return null; }
    }

    // Top Items
    public async Task<Paging<FullTrack>?> GetTopTracks(PersonalizationTopRequest.TimeRange timeRange = PersonalizationTopRequest.TimeRange.MediumTerm)
    {
        var client = GetClient();
        if (client == null) return null;

        try
        {
            return await client.Personalization.GetTopTracks(new PersonalizationTopRequest
            {
                TimeRangeParam = timeRange,
                Limit = 50
            });
        }
        catch (Exception ex) { _logger.LogError(ex, "Failed to get top tracks"); return null; }
    }

    public async Task<Paging<FullArtist>?> GetTopArtists(PersonalizationTopRequest.TimeRange timeRange = PersonalizationTopRequest.TimeRange.MediumTerm)
    {
        var client = GetClient();
        if (client == null) return null;

        try
        {
            return await client.Personalization.GetTopArtists(new PersonalizationTopRequest
            {
                TimeRangeParam = timeRange,
                Limit = 50
            });
        }
        catch (Exception ex) { _logger.LogError(ex, "Failed to get top artists"); return null; }
    }

    // Recently Played
    public async Task<CursorPaging<PlayHistoryItem>?> GetRecentlyPlayed()
    {
        var client = GetClient();
        if (client == null) return null;

        try
        {
            return await client.Player.GetRecentlyPlayed(new PlayerRecentlyPlayedRequest
            {
                Limit = 50
            });
        }
        catch (Exception ex) { _logger.LogError(ex, "Failed to get recently played"); return null; }
    }

    // Additional Playback Controls
    public async Task<bool> SeekTo(int positionMs)
    {
        var client = GetClient();
        if (client == null) return false;

        try { await client.Player.SeekTo(new PlayerSeekToRequest(positionMs)); return true; }
        catch (Exception ex) { _logger.LogError(ex, "Failed to seek to {PositionMs}ms", positionMs); return false; }
    }

    public async Task<bool> SetVolume(int volumePercent)
    {
        var client = GetClient();
        if (client == null) return false;

        try { await client.Player.SetVolume(new PlayerVolumeRequest(volumePercent)); return true; }
        catch (Exception ex) { _logger.LogError(ex, "Failed to set volume to {VolumePercent}%", volumePercent); return false; }
    }

    public async Task<bool> SetShuffle(bool state)
    {
        var client = GetClient();
        if (client == null) return false;

        try { await client.Player.SetShuffle(new PlayerShuffleRequest(state)); return true; }
        catch (Exception ex) { _logger.LogError(ex, "Failed to set shuffle to {State}", state); return false; }
    }

    public async Task<bool> SetRepeat(string state)
    {
        var client = GetClient();
        if (client == null) return false;

        try 
        { 
            var repeatState = state switch
            {
                "track" => PlayerSetRepeatRequest.State.Track,
                "context" => PlayerSetRepeatRequest.State.Context,
                _ => PlayerSetRepeatRequest.State.Off
            };
            await client.Player.SetRepeat(new PlayerSetRepeatRequest(repeatState)); 
            return true; 
        }
        catch (Exception ex) { _logger.LogError(ex, "Failed to set repeat to {State}", state); return false; }
    }

    // Library
    public async Task<Paging<SavedAlbum>?> GetSavedAlbums()
    {
        var client = GetClient();
        if (client == null) return null;

        try { return await client.Library.GetAlbums(); }
        catch (Exception ex) { _logger.LogError(ex, "Failed to get saved albums"); return null; }
    }

    public async Task<Paging<SavedTrack>?> GetSavedTracks()
    {
        var client = GetClient();
        if (client == null) return null;

        try { return await client.Library.GetTracks(); }
        catch (Exception ex) { _logger.LogError(ex, "Failed to get saved tracks"); return null; }
    }

    // Browse
    public async Task<CategoriesResponse?> GetCategories()
    {
        var client = GetClient();
        if (client == null) return null;

        try { return await client.Browse.GetCategories(); }
        catch (Exception ex) { _logger.LogError(ex, "Failed to get categories"); return null; }
    }

    public async Task<NewReleasesResponse?> GetNewReleases()
    {
        var client = GetClient();
        if (client == null) return null;

        try { return await client.Browse.GetNewReleases(); }
        catch (Exception ex) { _logger.LogError(ex, "Failed to get new releases"); return null; }
    }

    public async Task<FeaturedPlaylistsResponse?> GetFeaturedPlaylists()
    {
        var client = GetClient();
        if (client == null) return null;

        try { return await client.Browse.GetFeaturedPlaylists(); }
        catch (Exception ex) { _logger.LogError(ex, "Failed to get featured playlists"); return null; }
    }

    // Albums
    public async Task<FullAlbum?> GetAlbum(string id)
    {
        var client = GetClient();
        if (client == null) return null;

        try { return await client.Albums.Get(id); }
        catch (Exception ex) { _logger.LogError(ex, "Failed to get album {AlbumId}", id); return null; }
    }

    public async Task<Paging<SimpleTrack>?> GetAlbumTracks(string id)
    {
        var client = GetClient();
        if (client == null) return null;

        try { return await client.Albums.GetTracks(id); }
        catch (Exception ex) { _logger.LogError(ex, "Failed to get album tracks {AlbumId}", id); return null; }
    }

    // Artists
    public async Task<FullArtist?> GetArtist(string id)
    {
        var client = GetClient();
        if (client == null) return null;

        try { return await client.Artists.Get(id); }
        catch (Exception ex) { _logger.LogError(ex, "Failed to get artist {ArtistId}", id); return null; }
    }

    public async Task<Paging<SimpleAlbum>?> GetArtistAlbums(string id)
    {
        var client = GetClient();
        if (client == null) return null;

        try { return await client.Artists.GetAlbums(id); }
        catch (Exception ex) { _logger.LogError(ex, "Failed to get artist albums {ArtistId}", id); return null; }
    }

    public async Task<ArtistsTopTracksResponse?> GetArtistTopTracks(string id, string market)
    {
        var client = GetClient();
        if (client == null) return null;

        try { return await client.Artists.GetTopTracks(id, new ArtistsTopTracksRequest(market)); }
        catch (Exception ex) { _logger.LogError(ex, "Failed to get artist top tracks {ArtistId}", id); return null; }
    }

    public async Task<ArtistsRelatedArtistsResponse?> GetRelatedArtists(string id)
    {
        var client = GetClient();
        if (client == null) return null;

        try { return await client.Artists.GetRelatedArtists(id); }
        catch (Exception ex) { _logger.LogError(ex, "Failed to get related artists {ArtistId}", id); return null; }
    }

    // Tracks
    public async Task<FullTrack?> GetTrack(string id)
    {
        var client = GetClient();
        if (client == null) return null;

        try { return await client.Tracks.Get(id); }
        catch (Exception ex) { _logger.LogError(ex, "Failed to get track {TrackId}", id); return null; }
    }

    public async Task<TrackAudioFeatures?> GetAudioFeatures(string id)
    {
        var client = GetClient();
        if (client == null) return null;

        try { return await client.Tracks.GetAudioFeatures(id); }
        catch (Exception ex) { _logger.LogError(ex, "Failed to get audio features {TrackId}", id); return null; }
    }

    public async Task<TrackAudioAnalysis?> GetAudioAnalysis(string id)
    {
        var client = GetClient();
        if (client == null) return null;

        try { return await client.Tracks.GetAudioAnalysis(id); }
        catch (Exception ex) { _logger.LogError(ex, "Failed to get audio analysis {TrackId}", id); return null; }
    }

    // Library - Tracks
    public async Task<bool> SaveTracks(List<string> ids)
    {
        var client = GetClient();
        if (client == null) return false;

        try { await client.Library.SaveTracks(new LibrarySaveTracksRequest(ids)); return true; }
        catch (Exception ex) { _logger.LogError(ex, "Failed to save tracks"); return false; }
    }

    public async Task<bool> RemoveTracks(List<string> ids)
    {
        var client = GetClient();
        if (client == null) return false;

        try { await client.Library.RemoveTracks(new LibraryRemoveTracksRequest(ids)); return true; }
        catch (Exception ex) { _logger.LogError(ex, "Failed to remove tracks"); return false; }
    }

    public async Task<List<bool>?> CheckSavedTracks(List<string> ids)
    {
        var client = GetClient();
        if (client == null) return null;

        try { return await client.Library.CheckTracks(new LibraryCheckTracksRequest(ids)); }
        catch (Exception ex) { _logger.LogError(ex, "Failed to check saved tracks"); return null; }
    }

    // Library - Albums
    public async Task<bool> SaveAlbums(List<string> ids)
    {
        var client = GetClient();
        if (client == null) return false;

        try { await client.Library.SaveAlbums(new LibrarySaveAlbumsRequest(ids)); return true; }
        catch (Exception ex) { _logger.LogError(ex, "Failed to save albums"); return false; }
    }

    public async Task<bool> RemoveAlbums(List<string> ids)
    {
        var client = GetClient();
        if (client == null) return false;

        try { await client.Library.RemoveAlbums(new LibraryRemoveAlbumsRequest(ids)); return true; }
        catch (Exception ex) { _logger.LogError(ex, "Failed to remove albums"); return false; }
    }

    public async Task<List<bool>?> CheckSavedAlbums(List<string> ids)
    {
        var client = GetClient();
        if (client == null) return null;

        try { return await client.Library.CheckAlbums(new LibraryCheckAlbumsRequest(ids)); }
        catch (Exception ex) { _logger.LogError(ex, "Failed to check saved albums"); return null; }
    }

    // Playlists
    public async Task<FullPlaylist?> GetPlaylist(string id)
    {
        var client = GetClient();
        if (client == null) return null;

        try { return await client.Playlists.Get(id); }
        catch (Exception ex) { _logger.LogError(ex, "Failed to get playlist {PlaylistId}", id); return null; }
    }

    public async Task<Paging<PlaylistTrack<IPlayableItem>>?> GetPlaylistTracks(string id)
    {
        var client = GetClient();
        if (client == null) return null;

        try { return await client.Playlists.GetItems(id); }
        catch (Exception ex) { _logger.LogError(ex, "Failed to get playlist tracks {PlaylistId}", id); return null; }
    }

    public async Task<FullPlaylist?> CreatePlaylist(string name, string? description, bool isPublic)
    {
        var client = GetClient();
        if (client == null) return null;

        try
        {
            var user = await client.UserProfile.Current();
            return await client.Playlists.Create(user.Id, new PlaylistCreateRequest(name)
            {
                Description = description,
                Public = isPublic
            });
        }
        catch (Exception ex) { _logger.LogError(ex, "Failed to create playlist {Name}", name); return null; }
    }

    public async Task<bool> AddTracksToPlaylist(string playlistId, List<string> uris)
    {
        var client = GetClient();
        if (client == null) return false;

        try { await client.Playlists.AddItems(playlistId, new PlaylistAddItemsRequest(uris)); return true; }
        catch (Exception ex) { _logger.LogError(ex, "Failed to add tracks to playlist {PlaylistId}", playlistId); return false; }
    }

    public async Task<bool> RemoveTracksFromPlaylist(string playlistId, List<string> uris)
    {
        var client = GetClient();
        if (client == null) return false;

        try
        {
            var items = uris.Select(uri => new PlaylistRemoveItemsRequest.Item { Uri = uri }).ToList();
            await client.Playlists.RemoveItems(playlistId, new PlaylistRemoveItemsRequest { Tracks = items });
            return true;
        }
        catch (Exception ex) { _logger.LogError(ex, "Failed to remove tracks from playlist {PlaylistId}", playlistId); return false; }
    }
}
