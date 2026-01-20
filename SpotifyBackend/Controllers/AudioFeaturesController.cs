using Microsoft.AspNetCore.Mvc;
using SpotifyBackend.Services;
using SpotifyAPI.Web;

namespace SpotifyBackend.Controllers;

[ApiController]
[Route("api")]
public class AudioFeaturesController : ControllerBase
{
    private readonly SpotifyService _spotifyService;

    public AudioFeaturesController(SpotifyService spotifyService)
    {
        _spotifyService = spotifyService;
    }

    [HttpGet("audio-features/{id}")]
    public async Task<IActionResult> GetAudioFeatures(string id)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var client = _spotifyService.GetClient();
        if (client == null) return Unauthorized();

        try
        {
            var features = await client.Tracks.GetAudioFeatures(id);
            return Ok(new
            {
                id = features.Id,
                acousticness = features.Acousticness,
                analysis_url = features.AnalysisUrl,
                danceability = features.Danceability,
                duration_ms = features.DurationMs,
                energy = features.Energy,
                instrumentalness = features.Instrumentalness,
                key = features.Key,
                liveness = features.Liveness,
                loudness = features.Loudness,
                mode = features.Mode,
                speechiness = features.Speechiness,
                tempo = features.Tempo,
                time_signature = features.TimeSignature,
                track_href = features.TrackHref,
                type = features.Type,
                uri = features.Uri,
                valence = features.Valence
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("audio-features")]
    public async Task<IActionResult> GetAudioFeaturesForTracks([FromQuery] string ids)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var client = _spotifyService.GetClient();
        if (client == null) return Unauthorized();

        try
        {
            var idList = ids.Split(',').ToList();
            var response = await client.Tracks.GetSeveralAudioFeatures(new TracksAudioFeaturesRequest(idList));
            if (response.AudioFeatures == null)
                return Ok(new object[] { });
            
            var result = response.AudioFeatures.Where(f => f != null).Select(f => new
            {
                id = f.Id,
                acousticness = f.Acousticness,
                danceability = f.Danceability,
                duration_ms = f.DurationMs,
                energy = f.Energy,
                instrumentalness = f.Instrumentalness,
                key = f.Key,
                liveness = f.Liveness,
                loudness = f.Loudness,
                mode = f.Mode,
                speechiness = f.Speechiness,
                tempo = f.Tempo,
                time_signature = f.TimeSignature,
                uri = f.Uri,
                valence = f.Valence
            });
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
