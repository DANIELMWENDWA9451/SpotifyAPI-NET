using Microsoft.AspNetCore.Mvc;
using SpotifyBackend.Services;

namespace SpotifyBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly SpotifyAuthService _authService;
    private readonly SpotifyService _spotifyService;
    private readonly IConfiguration _configuration;

    public AuthController(SpotifyAuthService authService, SpotifyService spotifyService, IConfiguration configuration)
    {
        _authService = authService;
        _spotifyService = spotifyService;
        _configuration = configuration;
    }

    [HttpGet("login")]
    public async Task<IActionResult> Login()
    {
        var uri = await _authService.GetAuthorizationUri();
        return Redirect(uri.ToString());
    }

    [HttpGet("callback")]
    public async Task<IActionResult> Callback(string code, string? error)
    {
        if (!string.IsNullOrEmpty(error))
            return BadRequest(new { error });

        try
        {
            var token = await _authService.ExchangeCodeForToken(code);
            // var encryptedToken = _spotifyService.GenerateEncryptedToken(token); // Method updated in previous step
            // We need to call GenerateEncryptedToken which I added to SpotifyService
            var encryptedToken = _spotifyService.GenerateEncryptedToken(token);

            // Redirect back to React App with token in URL
            var frontendUrl = _configuration["FrontendUrl"] ?? "http://127.0.0.1:8080";
            return Redirect($"{frontendUrl}/login?token={Uri.EscapeDataString(encryptedToken)}"); 
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("status")]
    public IActionResult Status()
    {
        return Ok(new 
        { 
            isAuthenticated = _spotifyService.IsAuthenticated 
        });
    }

    [HttpGet("check")]
    public async Task<IActionResult> Check()
    {
        if (!_spotifyService.IsAuthenticated)
        {
            return Ok(new { isAuthenticated = false });
        }

        try
        {
            var user = await _spotifyService.GetCurrentUserProfile();
            if (user == null)
            {
                return Ok(new { isAuthenticated = false });
            }

            return Ok(new
            {
                isAuthenticated = true,
                user = new
                {
                    id = user.Id,
                    display_name = user.DisplayName,
                    email = user.Email,
                    images = user.Images?.Select(i => new { url = i.Url, height = i.Height, width = i.Width }),
                    product = user.Product,
                    country = user.Country,
                    uri = user.Uri
                }
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Check auth error: {ex.Message}");
            return Ok(new { isAuthenticated = false });
        }
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        _spotifyService.ClearToken();
        return Ok(new { message = "Logged out" });
    }

    [HttpGet("token")]
    public IActionResult GetToken()
    {
        if (!_spotifyService.IsAuthenticated)
            return Unauthorized(new { error = "Not authenticated" });
        
        var accessToken = _spotifyService.GetAccessToken();
        if (string.IsNullOrEmpty(accessToken))
            return Unauthorized(new { error = "No access token available" });
            
        return Ok(new { access_token = accessToken });
    }
}
