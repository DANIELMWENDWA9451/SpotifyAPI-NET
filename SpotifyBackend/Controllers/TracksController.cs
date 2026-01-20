using Microsoft.AspNetCore.Mvc;
using SpotifyBackend.Services;
using SpotifyAPI.Web;

namespace SpotifyBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TracksController : ControllerBase
{
    private readonly SpotifyService _spotifyService;

    public TracksController(SpotifyService spotifyService)
    {
        _spotifyService = spotifyService;
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetTrack(string id)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var track = await _spotifyService.GetTrack(id);
        if (track == null) return NotFound();
        
        return Ok(new
        {
            id = track.Id,
            name = track.Name,
            artists = track.Artists?.Select(a => new { id = a.Id, name = a.Name, uri = a.Uri }),
            album = new
            {
                id = track.Album.Id,
                name = track.Album.Name,
                images = track.Album.Images?.Select(i => new { url = i.Url, height = i.Height, width = i.Width }),
                artists = track.Album.Artists?.Select(a => new { id = a.Id, name = a.Name, uri = a.Uri }),
                release_date = track.Album.ReleaseDate,
                uri = track.Album.Uri
            },
            duration_ms = track.DurationMs,
            @explicit = track.Explicit,
            popularity = track.Popularity,
            preview_url = track.PreviewUrl,
            uri = track.Uri,
            track_number = track.TrackNumber,
            disc_number = track.DiscNumber
        });
    }

    [HttpGet("{id}/audio-features")]
    public async Task<IActionResult> GetAudioFeatures(string id)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var features = await _spotifyService.GetAudioFeatures(id);
        if (features == null) return NotFound();
        
        return Ok(new
        {
            id = features.Id,
            danceability = features.Danceability,
            energy = features.Energy,
            key = features.Key,
            loudness = features.Loudness,
            mode = features.Mode,
            speechiness = features.Speechiness,
            acousticness = features.Acousticness,
            instrumentalness = features.Instrumentalness,
            liveness = features.Liveness,
            valence = features.Valence,
            tempo = features.Tempo,
            duration_ms = features.DurationMs,
            time_signature = features.TimeSignature
        });
    }

    [HttpGet("{id}/audio-analysis")]
    public async Task<IActionResult> GetAudioAnalysis(string id)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var analysis = await _spotifyService.GetAudioAnalysis(id);
        if (analysis == null) return NotFound();
        
        return Ok(new
        {
            track = analysis.Track,
            bars = analysis.Bars,
            beats = analysis.Beats,
            sections = analysis.Sections,
            segments = analysis.Segments,
            tatums = analysis.Tatums
        });
    }
}
