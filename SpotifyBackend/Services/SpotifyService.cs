namespace SpotifyBackend.Services;

using SpotifyAPI.Web;
using Microsoft.AspNetCore.Http;
using System.Text.Json;

public class SpotifyService
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly SpotifyAuthService _authService;
    private const string TokenSessionKey = "SpotifyToken";

    public SpotifyService(IHttpContextAccessor httpContextAccessor, SpotifyAuthService authService)
    {
        _httpContextAccessor = httpContextAccessor;
        _authService = authService;
    }

    private ISession Session => _httpContextAccessor.HttpContext!.Session;

    public bool IsAuthenticated => Session.GetString(TokenSessionKey) != null;

    public void StoreToken(PKCETokenResponse token)
    {
        var tokenJson = JsonSerializer.Serialize(token);
        Session.SetString(TokenSessionKey, tokenJson);
    }

    public PKCETokenResponse? GetToken()
    {
        var tokenJson = Session.GetString(TokenSessionKey);
        if (string.IsNullOrEmpty(tokenJson))
            return null;

        return JsonSerializer.Deserialize<PKCETokenResponse>(tokenJson);
    }

    public void ClearToken()
    {
        Session.Remove(TokenSessionKey);
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
    /// Get a SpotifyClient, automatically refreshing the token if needed
    /// </summary>
    public SpotifyClient? GetClient()
    {
        var token = GetToken();
        if (token == null)
            return null;

        // Check if token needs refresh
        if (IsTokenExpiredOrExpiring(token) && !string.IsNullOrEmpty(token.RefreshToken))
        {
            try
            {
                Console.WriteLine("Token expired or expiring soon, refreshing...");
                var newToken = _authService.RefreshToken(token.RefreshToken).GetAwaiter().GetResult();
                StoreToken(newToken);
                token = newToken;
                Console.WriteLine("Token refreshed successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Token refresh failed: {ex.Message}");
                // Clear invalid token to force re-login
                ClearToken();
                return null;
            }
        }

        return _authService.CreateClient(token);
    }

    /// <summary>
    /// Get a SpotifyClient asynchronously with token refresh
    /// </summary>
    public async Task<SpotifyClient?> GetClientAsync()
    {
        var token = GetToken();
        if (token == null)
            return null;

        // Check if token needs refresh
        if (IsTokenExpiredOrExpiring(token) && !string.IsNullOrEmpty(token.RefreshToken))
        {
            try
            {
                Console.WriteLine("Token expired or expiring soon, refreshing...");
                var newToken = await _authService.RefreshToken(token.RefreshToken);
                StoreToken(newToken);
                token = newToken;
                Console.WriteLine("Token refreshed successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Token refresh failed: {ex.Message}");
                ClearToken();
                return null;
            }
        }

        return _authService.CreateClient(token);
    }

    // User Profile
    public async Task<PrivateUser?> GetCurrentUserProfile()
    {
        var client = GetClient();
        if (client == null) return null;

        try { return await client.UserProfile.Current(); }
        catch { return null; }
    }

    // Playback
    public async Task<CurrentlyPlayingContext?> GetCurrentPlayback()
    {
        var client = GetClient();
        if (client == null) return null;

        try { return await client.Player.GetCurrentPlayback(); }
        catch { return null; }
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
            Console.WriteLine($"PlayTrack error: {ex.Message}");
            return false;
        }
    }

    public async Task<bool> PausePlayback()
    {
        var client = GetClient();
        if (client == null) return false;

        try { await client.Player.PausePlayback(); return true; }
        catch { return false; }
    }

    public async Task<bool> ResumePlayback()
    {
        var client = GetClient();
        if (client == null) return false;

        try { await client.Player.ResumePlayback(); return true; }
        catch { return false; }
    }

    public async Task<bool> SkipNext()
    {
        var client = GetClient();
        if (client == null) return false;

        try { await client.Player.SkipNext(); return true; }
        catch { return false; }
    }

    public async Task<bool> SkipPrevious()
    {
        var client = GetClient();
        if (client == null) return false;

        try { await client.Player.SkipPrevious(); return true; }
        catch { return false; }
    }

    // Search
    public async Task<SearchResponse?> Search(string query, SearchRequest.Types type = SearchRequest.Types.All)
    {
        var client = GetClient();
        if (client == null) return null;

        try { return await client.Search.Item(new SearchRequest(type, query)); }
        catch { return null; }
    }

    // Playlists
    public async Task<Paging<FullPlaylist>?> GetUserPlaylists()
    {
        var client = GetClient();
        if (client == null) return null;

        try { return await client.Playlists.CurrentUsers(); }
        catch { return null; }
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
        catch { return null; }
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
        catch { return null; }
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
        catch { return null; }
    }

    // Additional Playback Controls
    public async Task<bool> SeekTo(int positionMs)
    {
        var client = GetClient();
        if (client == null) return false;

        try { await client.Player.SeekTo(new PlayerSeekToRequest(positionMs)); return true; }
        catch { return false; }
    }

    public async Task<bool> SetVolume(int volumePercent)
    {
        var client = GetClient();
        if (client == null) return false;

        try { await client.Player.SetVolume(new PlayerVolumeRequest(volumePercent)); return true; }
        catch { return false; }
    }

    public async Task<bool> SetShuffle(bool state)
    {
        var client = GetClient();
        if (client == null) return false;

        try { await client.Player.SetShuffle(new PlayerShuffleRequest(state)); return true; }
        catch { return false; }
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
        catch { return false; }
    }

    // Library
    public async Task<Paging<SavedAlbum>?> GetSavedAlbums()
    {
        var client = GetClient();
        if (client == null) return null;

        try { return await client.Library.GetAlbums(); }
        catch { return null; }
    }

    public async Task<Paging<SavedTrack>?> GetSavedTracks()
    {
        var client = GetClient();
        if (client == null) return null;

        try { return await client.Library.GetTracks(); }
        catch { return null; }
    }

    // Browse
    public async Task<CategoriesResponse?> GetCategories()
    {
        var client = GetClient();
        if (client == null) return null;

        try { return await client.Browse.GetCategories(); }
        catch { return null; }
    }

    public async Task<NewReleasesResponse?> GetNewReleases()
    {
        var client = GetClient();
        if (client == null) return null;

        try { return await client.Browse.GetNewReleases(); }
        catch { return null; }
    }

    public async Task<FeaturedPlaylistsResponse?> GetFeaturedPlaylists()
    {
        var client = GetClient();
        if (client == null) return null;

        try { return await client.Browse.GetFeaturedPlaylists(); }
        catch { return null; }
    }

    // Albums
    public async Task<FullAlbum?> GetAlbum(string id)
    {
        var client = GetClient();
        if (client == null) return null;

        try { return await client.Albums.Get(id); }
        catch { return null; }
    }

    public async Task<Paging<SimpleTrack>?> GetAlbumTracks(string id)
    {
        var client = GetClient();
        if (client == null) return null;

        try { return await client.Albums.GetTracks(id); }
        catch { return null; }
    }

    // Artists
    public async Task<FullArtist?> GetArtist(string id)
    {
        var client = GetClient();
        if (client == null) return null;

        try { return await client.Artists.Get(id); }
        catch { return null; }
    }

    public async Task<Paging<SimpleAlbum>?> GetArtistAlbums(string id)
    {
        var client = GetClient();
        if (client == null) return null;

        try { return await client.Artists.GetAlbums(id); }
        catch { return null; }
    }

    public async Task<ArtistsTopTracksResponse?> GetArtistTopTracks(string id, string market)
    {
        var client = GetClient();
        if (client == null) return null;

        try { return await client.Artists.GetTopTracks(id, new ArtistsTopTracksRequest(market)); }
        catch { return null; }
    }

    public async Task<ArtistsRelatedArtistsResponse?> GetRelatedArtists(string id)
    {
        var client = GetClient();
        if (client == null) return null;

        try { return await client.Artists.GetRelatedArtists(id); }
        catch { return null; }
    }

    // Tracks
    public async Task<FullTrack?> GetTrack(string id)
    {
        var client = GetClient();
        if (client == null) return null;

        try { return await client.Tracks.Get(id); }
        catch { return null; }
    }

    public async Task<TrackAudioFeatures?> GetAudioFeatures(string id)
    {
        var client = GetClient();
        if (client == null) return null;

        try { return await client.Tracks.GetAudioFeatures(id); }
        catch { return null; }
    }

    public async Task<TrackAudioAnalysis?> GetAudioAnalysis(string id)
    {
        var client = GetClient();
        if (client == null) return null;

        try { return await client.Tracks.GetAudioAnalysis(id); }
        catch { return null; }
    }

    // Library - Tracks
    public async Task<bool> SaveTracks(List<string> ids)
    {
        var client = GetClient();
        if (client == null) return false;

        try { await client.Library.SaveTracks(new LibrarySaveTracksRequest(ids)); return true; }
        catch { return false; }
    }

    public async Task<bool> RemoveTracks(List<string> ids)
    {
        var client = GetClient();
        if (client == null) return false;

        try { await client.Library.RemoveTracks(new LibraryRemoveTracksRequest(ids)); return true; }
        catch { return false; }
    }

    public async Task<List<bool>?> CheckSavedTracks(List<string> ids)
    {
        var client = GetClient();
        if (client == null) return null;

        try { return await client.Library.CheckTracks(new LibraryCheckTracksRequest(ids)); }
        catch { return null; }
    }

    // Library - Albums
    public async Task<bool> SaveAlbums(List<string> ids)
    {
        var client = GetClient();
        if (client == null) return false;

        try { await client.Library.SaveAlbums(new LibrarySaveAlbumsRequest(ids)); return true; }
        catch { return false; }
    }

    public async Task<bool> RemoveAlbums(List<string> ids)
    {
        var client = GetClient();
        if (client == null) return false;

        try { await client.Library.RemoveAlbums(new LibraryRemoveAlbumsRequest(ids)); return true; }
        catch { return false; }
    }

    public async Task<List<bool>?> CheckSavedAlbums(List<string> ids)
    {
        var client = GetClient();
        if (client == null) return null;

        try { return await client.Library.CheckAlbums(new LibraryCheckAlbumsRequest(ids)); }
        catch { return null; }
    }

    // Playlists
    public async Task<FullPlaylist?> GetPlaylist(string id)
    {
        var client = GetClient();
        if (client == null) return null;

        try { return await client.Playlists.Get(id); }
        catch { return null; }
    }

    public async Task<Paging<PlaylistTrack<IPlayableItem>>?> GetPlaylistTracks(string id)
    {
        var client = GetClient();
        if (client == null) return null;

        try { return await client.Playlists.GetItems(id); }
        catch { return null; }
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
        catch { return null; }
    }

    public async Task<bool> AddTracksToPlaylist(string playlistId, List<string> uris)
    {
        var client = GetClient();
        if (client == null) return false;

        try { await client.Playlists.AddItems(playlistId, new PlaylistAddItemsRequest(uris)); return true; }
        catch { return false; }
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
        catch { return false; }
    }
}
