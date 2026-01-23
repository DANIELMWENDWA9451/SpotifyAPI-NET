using Microsoft.AspNetCore.Mvc;
using SpotifyBackend.Services;
using SpotifyAPI.Web;

namespace SpotifyBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlayerController : ControllerBase
{
    private readonly SpotifyService _spotifyService;
    private readonly ILogger<PlayerController> _logger;

    public PlayerController(SpotifyService spotifyService, ILogger<PlayerController> logger)
    {
        _spotifyService = spotifyService;
        _logger = logger;
    }

    [HttpGet("current")]
    public async Task<IActionResult> GetCurrentPlayback()
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var client = _spotifyService.GetClient();
        if (client == null) return Unauthorized();

        try
        {
            var playback = await client.Player.GetCurrentPlayback();
            if (playback == null) return Ok(null);

            return Ok(new
            {
                is_playing = playback.IsPlaying,
                progress_ms = playback.ProgressMs,
                timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                item = playback.Item is FullTrack track ? MapTrack(track) : null,
                device = playback.Device != null ? MapDevice(playback.Device) : null,
                shuffle_state = playback.ShuffleState,
                repeat_state = playback.RepeatState,
                context = playback.Context != null ? new
                {
                    type = playback.Context.Type,
                    uri = playback.Context.Uri,
                    external_urls = new { spotify = playback.Context.ExternalUrls?.FirstOrDefault().Value }
                } : null,
                actions = playback.Actions,
                currently_playing_type = playback.CurrentlyPlayingType
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GetCurrentPlayback error");
            return Ok(null);
        }
    }

    [HttpGet("devices")]
    public async Task<IActionResult> GetDevices()
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var client = _spotifyService.GetClient();
        if (client == null) return Unauthorized();

        try
        {
            var response = await client.Player.GetAvailableDevices();
            return Ok(response.Devices?.Select(MapDevice) ?? Array.Empty<object>());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GetDevices error");
            return Ok(Array.Empty<object>());
        }
    }

    [HttpPut("transfer")]
    public async Task<IActionResult> TransferPlayback([FromBody] TransferRequest request)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var client = _spotifyService.GetClient();
        if (client == null) return Unauthorized();

        try
        {
            var transferRequest = new PlayerTransferPlaybackRequest(request.DeviceIds)
            {
                Play = request.Play
            };
            await client.Player.TransferPlayback(transferRequest);
            return Ok();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"TransferPlayback error: {ex.Message}");
            return BadRequest(new { error = ex.Message });
        }
    }

    public class TransferRequest
    {
        public List<string> DeviceIds { get; set; } = new();
        public bool Play { get; set; } = false;
    }

    [HttpGet("queue")]
    public async Task<IActionResult> GetQueue()
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var client = _spotifyService.GetClient();
        if (client == null) return Unauthorized();

        try
        {
            var queue = await client.Player.GetQueue();
            return Ok(new
            {
                currently_playing = queue.CurrentlyPlaying is FullTrack track ? MapTrack(track) : null,
                queue = queue.Queue?.OfType<FullTrack>().Select(MapTrack) ?? Array.Empty<object>()
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"GetQueue error: {ex.Message}");
            return Ok(new { currently_playing = (object?)null, queue = Array.Empty<object>() });
        }
    }

    [HttpPost("queue")]
    public async Task<IActionResult> AddToQueue([FromQuery] string uri, [FromQuery] string? device_id = null)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var client = _spotifyService.GetClient();
        if (client == null) return Unauthorized();

        try
        {
            var request = new PlayerAddToQueueRequest(uri);
            if (!string.IsNullOrEmpty(device_id))
                request.DeviceId = device_id;
            
            await client.Player.AddToQueue(request);
            return Ok();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"AddToQueue error: {ex.Message}");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("play")]
    public async Task<IActionResult> PlayAdvanced([FromBody] PlayAdvancedRequest? request)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var client = _spotifyService.GetClient();
        if (client == null) return Unauthorized();

        try
        {
            var playRequest = new PlayerResumePlaybackRequest();
            
            if (!string.IsNullOrEmpty(request?.ContextUri))
                playRequest.ContextUri = request.ContextUri;
            if (request?.Uris != null && request.Uris.Count > 0)
                playRequest.Uris = request.Uris;
            if (request?.Offset != null)
            {
                if (request.Offset.Position.HasValue)
                    playRequest.OffsetParam = new PlayerResumePlaybackRequest.Offset { Position = request.Offset.Position };
                else if (!string.IsNullOrEmpty(request.Offset.Uri))
                    playRequest.OffsetParam = new PlayerResumePlaybackRequest.Offset { Uri = request.Offset.Uri };
            }
            if (request?.PositionMs.HasValue == true)
                playRequest.PositionMs = request.PositionMs.Value;
            if (!string.IsNullOrEmpty(request?.DeviceId))
                playRequest.DeviceId = request.DeviceId;

            await client.Player.ResumePlayback(playRequest);
            return Ok();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Play error (Attempt 1): {ex.Message}");
            // Auto-Retry: If no active device, try to find one and transfer
            try 
            {
                var devices = await client.Player.GetAvailableDevices();
                var bestDevice = devices.Devices?.FirstOrDefault(d => !d.IsRestricted); // Pick first unrestricted device
                
                if (bestDevice != null)
                {
                    Console.WriteLine($"Retrying play on device: {bestDevice.Name} ({bestDevice.Id})");
                    // Transfer to this device
                    await client.Player.TransferPlayback(new PlayerTransferPlaybackRequest(new List<string> { bestDevice.Id }) { Play = false });
                    // Small delay to allow propagation
                    await Task.Delay(500);
                    
                    // Recreate Play Request with explicit device ID
                    var retryRequest = new PlayerResumePlaybackRequest { DeviceId = bestDevice.Id };
                    
                    if (!string.IsNullOrEmpty(request?.ContextUri))
                        retryRequest.ContextUri = request.ContextUri;
                    if (request?.Uris != null && request.Uris.Count > 0)
                        retryRequest.Uris = request.Uris;
                    if (request?.Offset != null)
                    {
                        if (request.Offset.Position.HasValue)
                            retryRequest.OffsetParam = new PlayerResumePlaybackRequest.Offset { Position = request.Offset.Position };
                        else if (!string.IsNullOrEmpty(request.Offset.Uri))
                            retryRequest.OffsetParam = new PlayerResumePlaybackRequest.Offset { Uri = request.Offset.Uri };
                    }
                    if (request?.PositionMs.HasValue == true)
                        retryRequest.PositionMs = request.PositionMs.Value;

                    await client.Player.ResumePlayback(retryRequest);
                    return Ok();
                }
            }
            catch (Exception retryEx)
            {
                Console.WriteLine($"Play retry failed: {retryEx.Message}");
            }

            return BadRequest(new { error = "Playback failed. Ensure you have Spotify Premium and an active device." });
        }
    }

    [HttpPost("play")]
    public async Task<IActionResult> Play([FromBody] PlayRequest? request)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var client = _spotifyService.GetClient();
        if (client == null) return Unauthorized();

        try
        {
            var playRequest = new PlayerResumePlaybackRequest();
            if (!string.IsNullOrEmpty(request?.Uri))
                playRequest.Uris = new List<string> { request.Uri };
            
            await client.Player.ResumePlayback(playRequest);
            return Ok();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Play error (Attempt 1): {ex.Message}");
            // Auto-Retry: If no active device, try to find one and transfer
            try 
            {
                var devices = await client.Player.GetAvailableDevices();
                var bestDevice = devices.Devices?.FirstOrDefault(d => !d.IsRestricted);

                if (bestDevice != null)
                {
                    Console.WriteLine($"Retrying play on device: {bestDevice.Name} ({bestDevice.Id})");
                    await client.Player.TransferPlayback(new PlayerTransferPlaybackRequest(new List<string> { bestDevice.Id }) { Play = false });
                    await Task.Delay(500);

                    var retryRequest = new PlayerResumePlaybackRequest { DeviceId = bestDevice.Id };
                    if (!string.IsNullOrEmpty(request?.Uri))
                        retryRequest.Uris = new List<string> { request.Uri };

                    await client.Player.ResumePlayback(retryRequest);
                    return Ok();
                }
            }
            catch (Exception retryEx)
            {
                Console.WriteLine($"Play retry failed: {retryEx.Message}");
            }

            return BadRequest(new { error = "Playback failed. Ensure you have Spotify Premium and an active device." });
        }
    }

    [HttpPut("pause")]
    [HttpPost("pause")]
    public async Task<IActionResult> Pause([FromQuery] string? device_id = null)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var client = _spotifyService.GetClient();
        if (client == null) return Unauthorized();

        try
        {
            var request = new PlayerPausePlaybackRequest();
            if (!string.IsNullOrEmpty(device_id))
                request.DeviceId = device_id;
            await client.Player.PausePlayback(request);
            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("next")]
    public async Task<IActionResult> Next([FromQuery] string? device_id = null)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var client = _spotifyService.GetClient();
        if (client == null) return Unauthorized();

        try
        {
            var request = new PlayerSkipNextRequest();
            if (!string.IsNullOrEmpty(device_id))
                request.DeviceId = device_id;
            await client.Player.SkipNext(request);
            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("previous")]
    public async Task<IActionResult> Previous([FromQuery] string? device_id = null)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var client = _spotifyService.GetClient();
        if (client == null) return Unauthorized();

        try
        {
            var request = new PlayerSkipPreviousRequest();
            if (!string.IsNullOrEmpty(device_id))
                request.DeviceId = device_id;
            await client.Player.SkipPrevious(request);
            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("seek")]
    [HttpPost("seek")]
    public async Task<IActionResult> Seek([FromQuery] int position_ms, [FromQuery] string? device_id = null)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var client = _spotifyService.GetClient();
        if (client == null) return Unauthorized();

        try
        {
            var request = new PlayerSeekToRequest(position_ms);
            if (!string.IsNullOrEmpty(device_id))
                request.DeviceId = device_id;
            await client.Player.SeekTo(request);
            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("volume")]
    [HttpPost("volume")]
    public async Task<IActionResult> SetVolume([FromQuery] int volume_percent, [FromQuery] string? device_id = null)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var client = _spotifyService.GetClient();
        if (client == null) return Unauthorized();

        try
        {
            var request = new PlayerVolumeRequest(volume_percent);
            if (!string.IsNullOrEmpty(device_id))
                request.DeviceId = device_id;
            await client.Player.SetVolume(request);
            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("shuffle")]
    [HttpPost("shuffle")]
    public async Task<IActionResult> SetShuffle([FromQuery] bool state, [FromQuery] string? device_id = null)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var client = _spotifyService.GetClient();
        if (client == null) return Unauthorized();

        try
        {
            var request = new PlayerShuffleRequest(state);
            if (!string.IsNullOrEmpty(device_id))
                request.DeviceId = device_id;
            await client.Player.SetShuffle(request);
            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("repeat")]
    [HttpPost("repeat")]
    public async Task<IActionResult> SetRepeat([FromQuery] string state, [FromQuery] string? device_id = null)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var client = _spotifyService.GetClient();
        if (client == null) return Unauthorized();

        try
        {
            var repeatState = state switch
            {
                "track" => PlayerSetRepeatRequest.State.Track,
                "context" => PlayerSetRepeatRequest.State.Context,
                _ => PlayerSetRepeatRequest.State.Off
            };
            var request = new PlayerSetRepeatRequest(repeatState);
            if (!string.IsNullOrEmpty(device_id))
                request.DeviceId = device_id;
            await client.Player.SetRepeat(request);
            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    private static object MapDevice(Device device) => new
    {
        id = device.Id,
        name = device.Name,
        type = device.Type,
        volume_percent = device.VolumePercent,
        is_active = device.IsActive,
        is_private_session = device.IsPrivateSession,
        is_restricted = device.IsRestricted,
        supports_volume = device.SupportsVolume
    };

    private static object MapTrack(FullTrack track) => new
    {
        id = track.Id,
        name = track.Name,
        artists = track.Artists?.Select(a => new { id = a.Id, name = a.Name, uri = a.Uri }),
        album = track.Album != null ? new
        {
            id = track.Album.Id,
            name = track.Album.Name,
            images = track.Album.Images?.Select(i => new { url = i.Url, height = i.Height, width = i.Width }),
            artists = track.Album.Artists?.Select(a => new { id = a.Id, name = a.Name, uri = a.Uri }),
            release_date = track.Album.ReleaseDate,
            total_tracks = track.Album.TotalTracks,
            album_type = track.Album.AlbumType,
            uri = track.Album.Uri
        } : null,
        duration_ms = track.DurationMs,
        @explicit = track.Explicit,
        popularity = track.Popularity,
        preview_url = track.PreviewUrl,
        uri = track.Uri,
        track_number = track.TrackNumber,
        disc_number = track.DiscNumber,
        is_local = track.IsLocal,
        external_urls = new { spotify = track.ExternalUrls?.FirstOrDefault().Value }
    };

    public record PlayRequest(
        [property: System.Text.Json.Serialization.JsonPropertyName("uri")] string? Uri
    );
    public record PlayAdvancedRequest(
        [property: System.Text.Json.Serialization.JsonPropertyName("context_uri")] string? ContextUri,
        [property: System.Text.Json.Serialization.JsonPropertyName("uris")] List<string>? Uris,
        [property: System.Text.Json.Serialization.JsonPropertyName("offset")] OffsetRequest? Offset,
        [property: System.Text.Json.Serialization.JsonPropertyName("position_ms")] int? PositionMs,
        [property: System.Text.Json.Serialization.JsonPropertyName("device_id")] string? DeviceId
    );
    public record OffsetRequest(
        [property: System.Text.Json.Serialization.JsonPropertyName("position")] int? Position, 
        [property: System.Text.Json.Serialization.JsonPropertyName("uri")] string? Uri
    );
}
