using Microsoft.AspNetCore.Mvc;
using SpotifyBackend.Services;
using SpotifyAPI.Web;

namespace SpotifyBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AlbumsController : ControllerBase
{
    private readonly SpotifyService _spotifyService;

    public AlbumsController(SpotifyService spotifyService)
    {
        _spotifyService = spotifyService;
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetAlbum(string id)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var album = await _spotifyService.GetAlbum(id);
        if (album == null) return NotFound();
        
        return Ok(new
        {
            id = album.Id,
            name = album.Name,
            images = album.Images?.Select(i => new { url = i.Url, height = i.Height, width = i.Width }),
            artists = album.Artists?.Select(a => new { id = a.Id, name = a.Name, uri = a.Uri }),
            release_date = album.ReleaseDate,
            total_tracks = album.TotalTracks,
            album_type = album.AlbumType,
            uri = album.Uri,
            label = album.Label,
            popularity = album.Popularity,
            genres = album.Genres,
            copyrights = album.Copyrights?.Select(c => new { text = c.Text, type = c.Type }),
            tracks = new
            {
                items = album.Tracks?.Items?.Select(t => new
                {
                    id = t.Id,
                    name = t.Name,
                    artists = t.Artists?.Select(a => new { id = a.Id, name = a.Name, uri = a.Uri }),
                    duration_ms = t.DurationMs,
                    track_number = t.TrackNumber,
                    uri = t.Uri
                }),
                total = album.Tracks?.Total ?? 0
            }
        });
    }

    [HttpGet("{id}/tracks")]
    public async Task<IActionResult> GetAlbumTracks(string id)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var tracks = await _spotifyService.GetAlbumTracks(id);
        if (tracks == null) return NotFound();
        
        return Ok(new
        {
            items = tracks.Items?.Select(t => new
            {
                id = t.Id,
                name = t.Name,
                artists = t.Artists?.Select(a => new { id = a.Id, name = a.Name, uri = a.Uri }),
                duration_ms = t.DurationMs,
                track_number = t.TrackNumber,
                uri = t.Uri
            }),
            total = tracks.Total
        });
    }
}
