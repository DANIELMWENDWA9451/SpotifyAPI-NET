using Microsoft.AspNetCore.Mvc;
using SpotifyBackend.Services;
using SpotifyAPI.Web;

namespace SpotifyBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EpisodesController : ControllerBase
{
    private readonly SpotifyService _spotifyService;

    public EpisodesController(SpotifyService spotifyService)
    {
        _spotifyService = spotifyService;
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetEpisode(string id)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var client = _spotifyService.GetClient();
        if (client == null) return Unauthorized();
        
        try
        {
            var episode = await client.Episodes.Get(id);
            return Ok(MapEpisode(episode));
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetEpisodes([FromQuery] string ids)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var client = _spotifyService.GetClient();
        if (client == null) return Unauthorized();
        
        try
        {
            var idList = ids.Split(',').ToList();
            var episodes = await client.Episodes.GetSeveral(new EpisodesRequest(idList));
            return Ok(episodes.Episodes?.Select(MapEpisode).ToList() ?? new List<object>());
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    private static object MapEpisode(FullEpisode ep) => new
    {
        id = ep.Id,
        name = ep.Name,
        description = ep.Description,
        html_description = ep.HtmlDescription,
        images = ep.Images?.Select(i => new { url = i.Url, height = i.Height, width = i.Width }).ToList(),
        duration_ms = ep.DurationMs,
        @explicit = ep.Explicit,
        release_date = ep.ReleaseDate,
        release_date_precision = ep.ReleaseDatePrecision,
        uri = ep.Uri,
        is_playable = ep.IsPlayable,
        languages = ep.Languages,
        audio_preview_url = ep.AudioPreviewUrl,
        resume_point = ep.ResumePoint != null ? new 
        { 
            fully_played = ep.ResumePoint.FullyPlayed, 
            resume_position_ms = ep.ResumePoint.ResumePositionMs 
        } : null,
        show = ep.Show != null ? new
        {
            id = ep.Show.Id,
            name = ep.Show.Name,
            publisher = ep.Show.Publisher,
            images = ep.Show.Images?.Select(i => new { url = i.Url, height = i.Height, width = i.Width }).ToList()
        } : null,
        external_urls = new { spotify = ep.ExternalUrls?.FirstOrDefault().Value }
    };
}
