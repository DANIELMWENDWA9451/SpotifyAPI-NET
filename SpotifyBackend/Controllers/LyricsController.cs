using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using SpotifyBackend.Services;

namespace SpotifyBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LyricsController : ControllerBase
    {
        private readonly ILyricsService _lyricsService;

        public LyricsController(ILyricsService lyricsService)
        {
            _lyricsService = lyricsService;
        }

        [HttpGet("{trackId}")]
        public async Task<IActionResult> GetLyrics(string trackId)
        {
            try
            {
                var lyrics = await _lyricsService.GetLyricsAsync(trackId);
                if (lyrics == null)
                {
                    return NotFound(new { message = "Lyrics not found for this track" });
                }
                return Ok(lyrics);
            }
            catch (System.Exception ex)
            {
                // In production, don't expose exception details directly
                return StatusCode(500, new { message = ex.Message });
            }
        }
    }
}
