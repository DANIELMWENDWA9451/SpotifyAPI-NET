using Microsoft.AspNetCore.Mvc;
using SpotifyBackend.Services;
using SpotifyAPI.Web;

namespace SpotifyBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlaylistsController : ControllerBase
{
    private readonly SpotifyService _spotifyService;

    public PlaylistsController(SpotifyService spotifyService)
    {
        _spotifyService = spotifyService;
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetPlaylist(string id)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var playlist = await _spotifyService.GetPlaylist(id);
        if (playlist == null) return NotFound();
        
        return Ok(new
        {
            id = playlist.Id,
            name = playlist.Name,
            description = playlist.Description,
            images = playlist.Images?.Select(i => new { url = i.Url, height = i.Height, width = i.Width }),
            owner = new { id = playlist.Owner?.Id, display_name = playlist.Owner?.DisplayName },
            tracks = new
            {
                items = playlist.Tracks?.Items?.Select(t => new
                {
                    added_at = t.AddedAt,
                    added_by = t.AddedBy != null ? new { id = t.AddedBy.Id } : null,
                    track = t.Track is FullTrack track ? new
                    {
                        id = track.Id,
                        name = track.Name,
                        artists = track.Artists?.Select(a => new { id = a.Id, name = a.Name, uri = a.Uri }),
                        album = new
                        {
                            id = track.Album.Id,
                            name = track.Album.Name,
                            images = track.Album.Images?.Select(i => new { url = i.Url, height = i.Height, width = i.Width }),
                            uri = track.Album.Uri
                        },
                        duration_ms = track.DurationMs,
                        uri = track.Uri
                    } : null
                }),
                total = playlist.Tracks?.Total ?? 0
            },
            @public = playlist.Public,
            collaborative = playlist.Collaborative,
            uri = playlist.Uri,
            followers = new { total = playlist.Followers?.Total ?? 0 }
        });
    }

    [HttpGet("{id}/tracks")]
    public async Task<IActionResult> GetPlaylistTracks(string id)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var tracks = await _spotifyService.GetPlaylistTracks(id);
        if (tracks == null) return NotFound();
        
        return Ok(new
        {
            items = tracks.Items?.Select(t => new
            {
                added_at = t.AddedAt,
                track = t.Track is FullTrack track ? new
                {
                    id = track.Id,
                    name = track.Name,
                    artists = track.Artists?.Select(a => new { id = a.Id, name = a.Name, uri = a.Uri }),
                    album = new
                    {
                        id = track.Album.Id,
                        name = track.Album.Name,
                        images = track.Album.Images?.Select(i => new { url = i.Url, height = i.Height, width = i.Width }),
                        uri = track.Album.Uri
                    },
                    duration_ms = track.DurationMs,
                    uri = track.Uri
                } : null
            }),
            total = tracks.Total
        });
    }

    [HttpPost]
    public async Task<IActionResult> CreatePlaylist([FromBody] CreatePlaylistRequest request)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var playlist = await _spotifyService.CreatePlaylist(request.Name, request.Description, request.Public);
        if (playlist == null) return BadRequest();
        
        return Ok(new { id = playlist.Id, name = playlist.Name, uri = playlist.Uri });
    }

    [HttpPost("{id}/tracks")]
    public async Task<IActionResult> AddTracksToPlaylist(string id, [FromBody] AddTracksRequest request)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var success = await _spotifyService.AddTracksToPlaylist(id, request.Uris);
        return success ? Ok() : BadRequest();
    }

    [HttpDelete("{id}/tracks")]
    public async Task<IActionResult> RemoveTracksFromPlaylist(string id, [FromBody] RemoveTracksRequest request)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var success = await _spotifyService.RemoveTracksFromPlaylist(id, request.Uris);
        return success ? Ok() : BadRequest();
    }

    public record CreatePlaylistRequest(string Name, string? Description = null, bool Public = true);
    public record AddTracksRequest(List<string> Uris);
    public record RemoveTracksRequest(List<string> Uris);
}
