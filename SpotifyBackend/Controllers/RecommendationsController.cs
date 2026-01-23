using Microsoft.AspNetCore.Mvc;
using SpotifyBackend.Services;
using SpotifyAPI.Web;

namespace SpotifyBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RecommendationsController : ControllerBase
{
    private readonly SpotifyService _spotifyService;
    private readonly ILogger<RecommendationsController> _logger;

    public RecommendationsController(SpotifyService spotifyService, ILogger<RecommendationsController> logger)
    {
        _spotifyService = spotifyService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetRecommendations(
        [FromQuery] string? seed_artists,
        [FromQuery] string? seed_genres,
        [FromQuery] string? seed_tracks,
        [FromQuery] int limit = 20)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var client = _spotifyService.GetClient();
        if (client == null) return Unauthorized();
        
        try
        {
            var request = new RecommendationsRequest();
            
            // Spotify allows max 5 seeds total
            int seedCount = 0;
            
            if (!string.IsNullOrEmpty(seed_artists))
            {
                foreach (var id in seed_artists.Split(','))
                {
                    if (seedCount >= 5) break;
                    request.SeedArtists.Add(id.Trim());
                    seedCount++;
                }
            }
            if (!string.IsNullOrEmpty(seed_genres))
            {
                foreach (var genre in seed_genres.Split(','))
                {
                    if (seedCount >= 5) break;
                    request.SeedGenres.Add(genre.Trim());
                    seedCount++;
                }
            }
            if (!string.IsNullOrEmpty(seed_tracks))
            {
                foreach (var id in seed_tracks.Split(','))
                {
                    if (seedCount >= 5) break;
                    request.SeedTracks.Add(id.Trim());
                    seedCount++;
                }
            }
            
            // If no seeds provided, return empty
            if (seedCount == 0)
            {
                return Ok(new { seeds = Array.Empty<object>(), tracks = Array.Empty<object>() });
            }
            
            request.Limit = limit;

            // Add market from user profile if available, otherwise let Spotify use token country
            try 
            {
                var user = await _spotifyService.GetCurrentUserProfile();
                if (!string.IsNullOrEmpty(user?.Country))
                {
                    request.Market = user.Country;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to fetch user profile for recommendations market");
            }

            var recommendations = await client.Browse.GetRecommendations(request);
            
            object seedsResult;
            object tracksResult;
            
            if (recommendations.Seeds != null)
            {
                seedsResult = recommendations.Seeds.Select(s => new
                {
                    id = s.Id,
                    type = s.Type,
                    href = s.Href,
                    initialPoolSize = s.InitialPoolSize
                });
            }
            else
            {
                seedsResult = Array.Empty<object>();
            }
            
            if (recommendations.Tracks != null)
            {
                tracksResult = recommendations.Tracks.Select(MapTrack);
            }
            else
            {
                tracksResult = Array.Empty<object>();
            }
            
            return Ok(new
            {
                seeds = seedsResult,
                tracks = tracksResult
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GetRecommendations error");
            return StatusCode(500, new { error = "Failed to load recommendations" });
        }
    }

    [HttpGet("available-genre-seeds")]
    public async Task<IActionResult> GetAvailableGenreSeeds()
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var client = _spotifyService.GetClient();
        if (client == null) return Unauthorized();
        
        try
        {
            var genres = await client.Browse.GetRecommendationGenres();
            return Ok(new { genres = genres.Genres });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    private static object MapTrack(FullTrack track) => new
    {
        id = track.Id,
        name = track.Name,
        artists = track.Artists?.Select(a => new { id = a.Id, name = a.Name, uri = a.Uri }).ToList(),
        album = track.Album != null ? new
        {
            id = track.Album.Id,
            name = track.Album.Name,
            images = track.Album.Images?.Select(i => new { url = i.Url, height = i.Height, width = i.Width }).ToList(),
            release_date = track.Album.ReleaseDate,
            uri = track.Album.Uri
        } : null,
        duration_ms = track.DurationMs,
        @explicit = track.Explicit,
        popularity = track.Popularity,
        preview_url = track.PreviewUrl,
        uri = track.Uri,
        track_number = track.TrackNumber
    };
}
