using Microsoft.AspNetCore.Mvc;
using SpotifyBackend.Services;
using SpotifyAPI.Web;

namespace SpotifyBackend.Controllers;

[ApiController]
[Route("api")]
public class SearchController : ControllerBase
{
    private readonly SpotifyService _spotifyService;

    public SearchController(SpotifyService spotifyService)
    {
        _spotifyService = spotifyService;
    }

    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string q, [FromQuery] string type = "track,artist,album,playlist")
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        if (string.IsNullOrEmpty(q)) return BadRequest("Query required");
        
        try
        {
            var results = await _spotifyService.Search(q);
            if (results == null)
            {
                return Ok(new { 
                    tracks = new { items = new object[0], total = 0 },
                    artists = new { items = new object[0], total = 0 },
                    albums = new { items = new object[0], total = 0 },
                    playlists = new { items = new object[0], total = 0 }
                });
            }

            var tracksList = new List<object>();
            if (results.Tracks?.Items != null)
            {
                foreach (var t in results.Tracks.Items)
                {
                    if (t == null) continue;
                    try { tracksList.Add(MapTrack(t)); } catch { }
                }
            }

            var artistsList = new List<object>();
            if (results.Artists?.Items != null)
            {
                foreach (var a in results.Artists.Items)
                {
                    if (a == null) continue;
                    try { artistsList.Add(MapArtist(a)); } catch { }
                }
            }

            var albumsList = new List<object>();
            if (results.Albums?.Items != null)
            {
                foreach (var a in results.Albums.Items)
                {
                    if (a == null) continue;
                    try { albumsList.Add(MapAlbum(a)); } catch { }
                }
            }

            var playlistsList = new List<object>();
            if (results.Playlists?.Items != null)
            {
                foreach (var p in results.Playlists.Items)
                {
                    if (p == null) continue;
                    try { playlistsList.Add(MapPlaylist(p)); } catch { }
                }
            }

            return Ok(new
            {
                tracks = new { items = tracksList, total = results.Tracks?.Total ?? 0 },
                artists = new { items = artistsList, total = results.Artists?.Total ?? 0 },
                albums = new { items = albumsList, total = results.Albums?.Total ?? 0 },
                playlists = new { items = playlistsList, total = results.Playlists?.Total ?? 0 }
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Search error: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    private static object MapTrack(FullTrack t)
    {
        return new
        {
            id = t.Id ?? "",
            name = t.Name ?? "",
            artists = t.Artists?.Select(a => new { id = a?.Id ?? "", name = a?.Name ?? "", uri = a?.Uri ?? "" }).ToArray(),
            album = t.Album != null ? new
            {
                id = t.Album.Id ?? "",
                name = t.Album.Name ?? "",
                images = t.Album.Images?.Select(i => new { url = i?.Url ?? "", height = i?.Height, width = i?.Width }).ToArray(),
                artists = t.Album.Artists?.Select(a => new { id = a?.Id ?? "", name = a?.Name ?? "", uri = a?.Uri ?? "" }).ToArray(),
                release_date = t.Album.ReleaseDate ?? "",
                total_tracks = t.Album.TotalTracks,
                album_type = t.Album.AlbumType,
                uri = t.Album.Uri ?? ""
            } : (object?)null,
            duration_ms = t.DurationMs,
            @explicit = t.Explicit,
            popularity = t.Popularity,
            preview_url = t.PreviewUrl,
            uri = t.Uri ?? "",
            track_number = t.TrackNumber
        };
    }

    private static object MapArtist(FullArtist a)
    {
        return new
        {
            id = a.Id ?? "",
            name = a.Name ?? "",
            images = a.Images?.Select(i => new { url = i?.Url ?? "", height = i?.Height, width = i?.Width }).ToArray(),
            genres = a.Genres,
            followers = new { total = a.Followers?.Total ?? 0 },
            popularity = a.Popularity,
            uri = a.Uri ?? ""
        };
    }

    private static object MapAlbum(SimpleAlbum a)
    {
        return new
        {
            id = a.Id ?? "",
            name = a.Name ?? "",
            images = a.Images?.Select(i => new { url = i?.Url ?? "", height = i?.Height, width = i?.Width }).ToArray(),
            artists = a.Artists?.Select(ar => new { id = ar?.Id ?? "", name = ar?.Name ?? "", uri = ar?.Uri ?? "" }).ToArray(),
            release_date = a.ReleaseDate ?? "",
            total_tracks = a.TotalTracks,
            album_type = a.AlbumType,
            uri = a.Uri ?? ""
        };
    }

    private static object MapPlaylist(FullPlaylist p)
    {
        return new
        {
            id = p.Id ?? "",
            name = p.Name ?? "",
            description = p.Description ?? "",
            images = p.Images?.Select(i => new { url = i?.Url ?? "", height = i?.Height, width = i?.Width }).ToArray(),
            owner = new { id = p.Owner?.Id ?? "", display_name = p.Owner?.DisplayName ?? "" },
            tracks = new { total = p.Tracks?.Total ?? 0 },
            @public = p.Public,
            collaborative = p.Collaborative,
            uri = p.Uri ?? ""
        };
    }
}
