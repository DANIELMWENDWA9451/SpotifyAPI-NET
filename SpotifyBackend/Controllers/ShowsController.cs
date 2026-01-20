using Microsoft.AspNetCore.Mvc;
using SpotifyBackend.Services;
using SpotifyAPI.Web;

namespace SpotifyBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ShowsController : ControllerBase
{
    private readonly SpotifyService _spotifyService;

    public ShowsController(SpotifyService spotifyService)
    {
        _spotifyService = spotifyService;
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetShow(string id)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var client = _spotifyService.GetClient();
        if (client == null) return Unauthorized();
        
        try
        {
            var show = await client.Shows.Get(id);
            return Ok(MapShow(show));
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{id}/episodes")]
    public async Task<IActionResult> GetShowEpisodes(string id, [FromQuery] int limit = 20, [FromQuery] int offset = 0)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var client = _spotifyService.GetClient();
        if (client == null) return Unauthorized();
        
        try
        {
            var episodes = await client.Shows.GetEpisodes(id, new ShowEpisodesRequest { Limit = limit, Offset = offset });
            
            object itemsResult;
            if (episodes.Items != null)
            {
                itemsResult = episodes.Items.Select(MapEpisode);
            }
            else
            {
                itemsResult = new object[] { };
            }
            
            return Ok(new
            {
                items = itemsResult,
                total = episodes.Total ?? 0
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetShows([FromQuery] string ids)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var client = _spotifyService.GetClient();
        if (client == null) return Unauthorized();
        
        try
        {
            var idList = ids.Split(',').ToList();
            var shows = await client.Shows.GetSeveral(new ShowsRequest(idList));
            if (shows.Shows == null)
                return Ok(new object[] { });
            
            var result = new List<object>();
            foreach (var show in shows.Shows)
            {
                if (show != null)
                    result.Add(MapSimpleShow(show));
            }
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    private static object MapShow(FullShow show) => new
    {
        id = show.Id,
        name = show.Name,
        description = show.Description,
        html_description = show.HtmlDescription,
        images = show.Images?.Select(i => new { url = i.Url, height = i.Height, width = i.Width }).ToList(),
        publisher = show.Publisher,
        languages = show.Languages,
        @explicit = show.Explicit,
        total_episodes = show.TotalEpisodes,
        media_type = show.MediaType,
        uri = show.Uri,
        is_externally_hosted = show.IsExternallyHosted,
        external_urls = new { spotify = show.ExternalUrls?.FirstOrDefault().Value }
    };

    private static object MapEpisode(SimpleEpisode ep) => new
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
        external_urls = new { spotify = ep.ExternalUrls?.FirstOrDefault().Value }
    };

    private static object MapSimpleShow(SimpleShow show) => new
    {
        id = show.Id,
        name = show.Name,
        description = show.Description,
        images = show.Images?.Select(i => new { url = i.Url, height = i.Height, width = i.Width }).ToList(),
        publisher = show.Publisher,
        languages = show.Languages,
        @explicit = show.Explicit,
        total_episodes = show.TotalEpisodes,
        media_type = show.MediaType,
        uri = show.Uri,
        is_externally_hosted = show.IsExternallyHosted,
        external_urls = new { spotify = show.ExternalUrls?.FirstOrDefault().Value }
    };
}
