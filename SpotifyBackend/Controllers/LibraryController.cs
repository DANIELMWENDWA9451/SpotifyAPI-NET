using Microsoft.AspNetCore.Mvc;
using SpotifyBackend.Services;
using SpotifyAPI.Web;

namespace SpotifyBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LibraryController : ControllerBase
{
    private readonly SpotifyService _spotifyService;

    public LibraryController(SpotifyService spotifyService)
    {
        _spotifyService = spotifyService;
    }

    [HttpPut("tracks")]
    public async Task<IActionResult> SaveTracks([FromBody] SaveItemsRequest request)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var success = await _spotifyService.SaveTracks(request.Ids);
        return success ? Ok() : BadRequest();
    }

    [HttpDelete("tracks")]
    public async Task<IActionResult> RemoveTracks([FromBody] SaveItemsRequest request)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var success = await _spotifyService.RemoveTracks(request.Ids);
        return success ? Ok() : BadRequest();
    }

    [HttpGet("tracks/contains")]
    public async Task<IActionResult> CheckSavedTracks([FromQuery] string ids)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var idList = ids.Split(',').ToList();
        var result = await _spotifyService.CheckSavedTracks(idList);
        return Ok(result ?? new List<bool>());
    }

    [HttpPut("albums")]
    public async Task<IActionResult> SaveAlbums([FromBody] SaveItemsRequest request)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var success = await _spotifyService.SaveAlbums(request.Ids);
        return success ? Ok() : BadRequest();
    }

    [HttpDelete("albums")]
    public async Task<IActionResult> RemoveAlbums([FromBody] SaveItemsRequest request)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var success = await _spotifyService.RemoveAlbums(request.Ids);
        return success ? Ok() : BadRequest();
    }

    [HttpGet("albums/contains")]
    public async Task<IActionResult> CheckSavedAlbums([FromQuery] string ids)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var client = _spotifyService.GetClient();
        if (client == null) return Unauthorized();

        try
        {
            var idList = ids.Split(',').ToList();
            var result = await client.Library.CheckAlbums(new LibraryCheckAlbumsRequest(idList));
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // Shows
    [HttpPut("shows")]
    public async Task<IActionResult> SaveShows([FromBody] SaveItemsRequest request)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var client = _spotifyService.GetClient();
        if (client == null) return Unauthorized();

        try
        {
            await client.Library.SaveShows(new LibrarySaveShowsRequest(request.Ids));
            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("shows")]
    public async Task<IActionResult> RemoveShows([FromBody] SaveItemsRequest request)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var client = _spotifyService.GetClient();
        if (client == null) return Unauthorized();

        try
        {
            await client.Library.RemoveShows(new LibraryRemoveShowsRequest(request.Ids));
            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("shows/contains")]
    public async Task<IActionResult> CheckSavedShows([FromQuery] string ids)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var client = _spotifyService.GetClient();
        if (client == null) return Unauthorized();

        try
        {
            var idList = ids.Split(',').ToList();
            var result = await client.Library.CheckShows(new LibraryCheckShowsRequest(idList));
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // Episodes
    [HttpPut("episodes")]
    public async Task<IActionResult> SaveEpisodes([FromBody] SaveItemsRequest request)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var client = _spotifyService.GetClient();
        if (client == null) return Unauthorized();

        try
        {
            await client.Library.SaveEpisodes(new LibrarySaveEpisodesRequest(request.Ids));
            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("episodes")]
    public async Task<IActionResult> RemoveEpisodes([FromBody] SaveItemsRequest request)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var client = _spotifyService.GetClient();
        if (client == null) return Unauthorized();

        try
        {
            await client.Library.RemoveEpisodes(new LibraryRemoveEpisodesRequest(request.Ids));
            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("episodes/contains")]
    public async Task<IActionResult> CheckSavedEpisodes([FromQuery] string ids)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var client = _spotifyService.GetClient();
        if (client == null) return Unauthorized();

        try
        {
            var idList = ids.Split(',').ToList();
            var result = await client.Library.CheckEpisodes(new LibraryCheckEpisodesRequest(idList));
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    public record SaveItemsRequest(
        [property: System.Text.Json.Serialization.JsonPropertyName("ids")] List<string> Ids
    );
}
