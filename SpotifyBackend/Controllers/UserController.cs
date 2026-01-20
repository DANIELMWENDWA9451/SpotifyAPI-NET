using Microsoft.AspNetCore.Mvc;
using SpotifyBackend.Services;
using SpotifyAPI.Web;

namespace SpotifyBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    private readonly SpotifyService _spotifyService;

    public UserController(SpotifyService spotifyService)
    {
        _spotifyService = spotifyService;
    }

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var user = await _spotifyService.GetCurrentUserProfile();
        if (user == null) return NotFound();
        
        return Ok(new
        {
            id = user.Id,
            display_name = user.DisplayName,
            email = user.Email,
            images = user.Images?.Select(i => new { url = i.Url, height = i.Height, width = i.Width }),
            followers = new { total = user.Followers?.Total ?? 0 },
            product = user.Product
        });
    }

    [HttpGet("playlists")]
    public async Task<IActionResult> GetPlaylists()
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var playlists = await _spotifyService.GetUserPlaylists();
        if (playlists?.Items == null) return Ok(new object[] { });
        
        return Ok(playlists.Items.Select(p => new
        {
            id = p.Id,
            name = p.Name,
            description = p.Description,
            images = p.Images?.Select(i => new { url = i.Url, height = i.Height, width = i.Width }),
            owner = new { id = p.Owner?.Id, display_name = p.Owner?.DisplayName },
            tracks = new { total = p.Tracks?.Total ?? 0 },
            @public = p.Public,
            collaborative = p.Collaborative,
            uri = p.Uri
        }));
    }

    [HttpGet("top-tracks")]
    public async Task<IActionResult> GetTopTracks([FromQuery] int limit = 20)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var tracks = await _spotifyService.GetTopTracks();
        if (tracks?.Items == null) return Ok(new object[] { });
        
        return Ok(tracks.Items.Take(limit).Select(MapTrack));
    }

    [HttpGet("top-artists")]
    public async Task<IActionResult> GetTopArtists([FromQuery] int limit = 20)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var artists = await _spotifyService.GetTopArtists();
        if (artists?.Items == null) return Ok(new object[] { });
        
        return Ok(artists.Items.Take(limit).Select(MapArtist));
    }

    [HttpGet("recently-played")]
    public async Task<IActionResult> GetRecentlyPlayed([FromQuery] int limit = 20)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var recent = await _spotifyService.GetRecentlyPlayed();
        if (recent?.Items == null) return Ok(new { items = new object[] { } });
        
        return Ok(new
        {
            items = recent.Items.Take(limit).Select(item => new
            {
                track = MapTrack(item.Track),
                played_at = item.PlayedAt.ToString("o"),
                context = item.Context != null ? new { type = item.Context.Type, uri = item.Context.Uri } : null
            })
        });
    }

    [HttpGet("saved-albums")]
    public async Task<IActionResult> GetSavedAlbums()
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var albums = await _spotifyService.GetSavedAlbums();
        if (albums?.Items == null) return Ok(new object[] { });
        
        return Ok(albums.Items.Select(a => MapAlbum(a.Album)));
    }

    [HttpGet("saved-tracks")]
    public async Task<IActionResult> GetSavedTracks([FromQuery] int limit = 50, [FromQuery] int offset = 0)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var client = _spotifyService.GetClient();
        if (client == null) return Unauthorized();

        try
        {
            var tracks = await client.Library.GetTracks(new LibraryTracksRequest { Limit = limit, Offset = offset });
            return Ok(tracks.Items?.Select(t => MapTrack(t.Track)) ?? Array.Empty<object>());
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("following/artists")]
    public async Task<IActionResult> GetFollowedArtists([FromQuery] int limit = 50)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var client = _spotifyService.GetClient();
        if (client == null) return Unauthorized();

        try
        {
            var followed = await client.Follow.OfCurrentUser(new FollowOfCurrentUserRequest(FollowOfCurrentUserRequest.Type.Artist) { Limit = limit });
            return Ok(followed.Artists?.Items?.Select(MapArtist) ?? Array.Empty<object>());
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("shows")]
    public async Task<IActionResult> GetSavedShows([FromQuery] int limit = 50, [FromQuery] int offset = 0)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var client = _spotifyService.GetClient();
        if (client == null) return Unauthorized();

        try
        {
            var shows = await client.Library.GetShows(new LibraryShowsRequest { Limit = limit, Offset = offset });
            if (shows.Items == null)
                return Ok(new object[] { });
            
            return Ok(shows.Items.Select(s => new
            {
                id = s.Show.Id,
                name = s.Show.Name,
                description = s.Show.Description,
                images = s.Show.Images?.Select(i => new { url = i.Url, height = i.Height, width = i.Width }),
                publisher = s.Show.Publisher,
                total_episodes = s.Show.TotalEpisodes,
                uri = s.Show.Uri
            }));
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("episodes")]
    public async Task<IActionResult> GetSavedEpisodes([FromQuery] int limit = 50, [FromQuery] int offset = 0)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var client = _spotifyService.GetClient();
        if (client == null) return Unauthorized();

        try
        {
            var episodes = await client.Library.GetEpisodes(new LibraryEpisodesRequest { Limit = limit, Offset = offset });
            if (episodes.Items == null)
                return Ok(new object[] { });
            
            return Ok(episodes.Items.Select(e => new
            {
                id = e.Episode.Id,
                name = e.Episode.Name,
                description = e.Episode.Description,
                images = e.Episode.Images?.Select(i => new { url = i.Url, height = i.Height, width = i.Width }),
                duration_ms = e.Episode.DurationMs,
                release_date = e.Episode.ReleaseDate,
                uri = e.Episode.Uri,
                show = new { id = e.Episode.Show?.Id, name = e.Episode.Show?.Name }
            }));
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // Helper methods to map Spotify objects to frontend-expected format
    private static object MapTrack(FullTrack track) => new
    {
        id = track.Id,
        name = track.Name,
        artists = track.Artists?.Select(a => new { id = a.Id, name = a.Name, uri = a.Uri }),
        album = MapAlbum(track.Album),
        duration_ms = track.DurationMs,
        @explicit = track.Explicit,
        popularity = track.Popularity,
        preview_url = track.PreviewUrl,
        uri = track.Uri,
        track_number = track.TrackNumber
    };

    private static object MapAlbum(SimpleAlbum album) => new
    {
        id = album.Id,
        name = album.Name,
        images = album.Images?.Select(i => new { url = i.Url, height = i.Height, width = i.Width }),
        artists = album.Artists?.Select(a => new { id = a.Id, name = a.Name, uri = a.Uri }),
        release_date = album.ReleaseDate,
        total_tracks = album.TotalTracks,
        album_type = album.AlbumType,
        uri = album.Uri
    };

    private static object MapArtist(FullArtist artist) => new
    {
        id = artist.Id,
        name = artist.Name,
        images = artist.Images?.Select(i => new { url = i.Url, height = i.Height, width = i.Width }),
        genres = artist.Genres,
        followers = new { total = artist.Followers?.Total ?? 0 },
        popularity = artist.Popularity,
        uri = artist.Uri
    };

    private static object MapAlbum(FullAlbum album) => new
    {
        id = album.Id,
        name = album.Name,
        images = album.Images?.Select(i => new { url = i.Url, height = i.Height, width = i.Width }),
        artists = album.Artists?.Select(a => new { id = a.Id, name = a.Name, uri = a.Uri }),
        release_date = album.ReleaseDate,
        total_tracks = album.TotalTracks,
        album_type = album.AlbumType,
        uri = album.Uri
    };
}
