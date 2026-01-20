using Microsoft.AspNetCore.Mvc;
using SpotifyBackend.Services;
using SpotifyAPI.Web;

namespace SpotifyBackend.Controllers;

[ApiController]
[Route("api")]
public class FollowController : ControllerBase
{
    private readonly SpotifyService _spotifyService;

    public FollowController(SpotifyService spotifyService)
    {
        _spotifyService = spotifyService;
    }

    // Follow artists
    [HttpPut("follow/artists")]
    public async Task<IActionResult> FollowArtists([FromBody] IdsRequest request)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var client = _spotifyService.GetClient();
        if (client == null) return Unauthorized();
        
        try
        {
            var followRequest = new FollowRequest(FollowRequest.Type.Artist, request.Ids);
            await client.Follow.Follow(followRequest);
            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // Unfollow artists
    [HttpDelete("follow/artists")]
    public async Task<IActionResult> UnfollowArtists([FromBody] IdsRequest request)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var client = _spotifyService.GetClient();
        if (client == null) return Unauthorized();
        
        try
        {
            var unfollowRequest = new UnfollowRequest(UnfollowRequest.Type.Artist, request.Ids);
            await client.Follow.Unfollow(unfollowRequest);
            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // Check if following artists
    [HttpGet("follow/artists/contains")]
    public async Task<IActionResult> CheckFollowingArtists([FromQuery] string ids)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var client = _spotifyService.GetClient();
        if (client == null) return Unauthorized();
        
        try
        {
            var idList = ids.Split(',').ToList();
            var result = await client.Follow.CheckCurrentUser(new FollowCheckCurrentUserRequest(FollowCheckCurrentUserRequest.Type.Artist, idList));
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // Follow playlist
    [HttpPut("playlists/{playlistId}/followers")]
    public async Task<IActionResult> FollowPlaylist(string playlistId)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var client = _spotifyService.GetClient();
        if (client == null) return Unauthorized();
        
        try
        {
            await client.Follow.FollowPlaylist(playlistId);
            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // Unfollow playlist
    [HttpDelete("playlists/{playlistId}/followers")]
    public async Task<IActionResult> UnfollowPlaylist(string playlistId)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var client = _spotifyService.GetClient();
        if (client == null) return Unauthorized();
        
        try
        {
            await client.Follow.UnfollowPlaylist(playlistId);
            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // Check if users follow playlist
    [HttpGet("playlists/{playlistId}/followers/contains")]
    public async Task<IActionResult> CheckFollowingPlaylist(string playlistId, [FromQuery] string ids)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var client = _spotifyService.GetClient();
        if (client == null) return Unauthorized();
        
        try
        {
            var idList = ids.Split(',').ToList();
            var result = await client.Follow.CheckPlaylist(playlistId, new FollowCheckPlaylistRequest(idList));
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    public record IdsRequest(
        [property: System.Text.Json.Serialization.JsonPropertyName("ids")] List<string> Ids
    );
}
