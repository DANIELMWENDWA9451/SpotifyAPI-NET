using Microsoft.AspNetCore.Mvc;
using SpotifyBackend.Services;
using SpotifyAPI.Web;

namespace SpotifyBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ArtistsController : ControllerBase
{
    private readonly SpotifyService _spotifyService;

    public ArtistsController(SpotifyService spotifyService)
    {
        _spotifyService = spotifyService;
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetArtist(string id)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var artist = await _spotifyService.GetArtist(id);
        if (artist == null) return NotFound();
        
        return Ok(new
        {
            id = artist.Id,
            name = artist.Name,
            images = artist.Images?.Select(i => new { url = i.Url, height = i.Height, width = i.Width }),
            genres = artist.Genres,
            followers = new { total = artist.Followers?.Total ?? 0 },
            popularity = artist.Popularity,
            uri = artist.Uri
        });
    }

    [HttpGet("{id}/albums")]
    public async Task<IActionResult> GetArtistAlbums(string id)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var client = _spotifyService.GetClient();
        if (client == null) return Unauthorized();
        
        try
        {
            var albums = await client.Artists.GetAlbums(id);
            return Ok(new
            {
                items = albums.Items?.Select(a => new
                {
                    id = a.Id,
                    name = a.Name,
                    images = a.Images?.Select(i => new { url = i.Url, height = i.Height, width = i.Width }),
                    artists = a.Artists?.Select(ar => new { id = ar.Id, name = ar.Name, uri = ar.Uri }),
                    release_date = a.ReleaseDate,
                    total_tracks = a.TotalTracks,
                    album_type = a.AlbumType,
                    uri = a.Uri
                }) ?? Enumerable.Empty<object>(),
                total = albums.Total ?? 0
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"GetArtistAlbums error: {ex.Message}");
            return Ok(new { items = Array.Empty<object>(), total = 0 });
        }
    }

    [HttpGet("{id}/top-tracks")]
    public async Task<IActionResult> GetArtistTopTracks(string id, [FromQuery] string market = "US")
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var client = _spotifyService.GetClient();
        if (client == null) return Unauthorized();
        
        try
        {
            var tracks = await client.Artists.GetTopTracks(id, new ArtistsTopTracksRequest(market));
            return Ok(new
            {
                tracks = tracks.Tracks?.Select(t => new
                {
                    id = t.Id,
                    name = t.Name,
                    artists = t.Artists?.Select(a => new { id = a.Id, name = a.Name, uri = a.Uri }),
                    album = new
                    {
                        id = t.Album.Id,
                        name = t.Album.Name,
                        images = t.Album.Images?.Select(i => new { url = i.Url, height = i.Height, width = i.Width }),
                        uri = t.Album.Uri
                    },
                    duration_ms = t.DurationMs,
                    popularity = t.Popularity,
                    uri = t.Uri
                }) ?? Enumerable.Empty<object>()
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"GetArtistTopTracks error: {ex.Message}");
            return Ok(new { tracks = Array.Empty<object>() });
        }
    }

    [HttpGet("{id}/related-artists")]
    public async Task<IActionResult> GetRelatedArtists(string id)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var client = _spotifyService.GetClient();
        if (client == null) return Unauthorized();
        
        try
        {
            var related = await client.Artists.GetRelatedArtists(id);
            return Ok(new
            {
                artists = related.Artists?.Select(a => new
                {
                    id = a.Id,
                    name = a.Name,
                    images = a.Images?.Select(i => new { url = i.Url, height = i.Height, width = i.Width }),
                    genres = a.Genres,
                    followers = new { total = a.Followers?.Total ?? 0 },
                    popularity = a.Popularity,
                    uri = a.Uri
                }) ?? Enumerable.Empty<object>()
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"GetRelatedArtists error: {ex.Message}");
            return Ok(new { artists = Array.Empty<object>() });
        }
    }
}
