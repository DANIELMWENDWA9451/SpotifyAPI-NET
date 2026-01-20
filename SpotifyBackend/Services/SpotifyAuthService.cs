namespace SpotifyBackend.Services;

using SpotifyAPI.Web;
using SpotifyAPI.Web.Auth;
using System.Threading;

using Microsoft.AspNetCore.DataProtection;

public class SpotifyAuthService
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly string _clientId;
    private readonly Uri _redirectUri;
    private readonly IDataProtector _protector;
    private const string VerifierCookieName = "spotify_verifier";

    public SpotifyAuthService(IConfiguration configuration, IHttpContextAccessor httpContextAccessor, IDataProtectionProvider provider)
    {
        _clientId = configuration["Spotify:ClientId"] 
            ?? throw new InvalidOperationException("Spotify ClientId not configured");
        var redirectUriString = configuration["Spotify:RedirectUri"] 
            ?? throw new InvalidOperationException("Spotify RedirectUri not configured");
        _redirectUri = new Uri(redirectUriString);
        _httpContextAccessor = httpContextAccessor;
        _protector = provider.CreateProtector("SpotifyAuthService");
    }

    public async Task<Uri> GetAuthorizationUri()
    {
        var (verifier, challenge) = PKCEUtil.GenerateCodes();
        
        // Store verifier in encrypted cookie
        var encryptedVerifier = _protector.Protect(verifier);
        _httpContextAccessor.HttpContext?.Response.Cookies.Append(VerifierCookieName, encryptedVerifier, new CookieOptions
        {
            HttpOnly = true,
            Secure = true, // Always secure in production
            SameSite = SameSiteMode.None, // Allow cross-site redirects (Vercel proxy/redirect)
            Expires = DateTime.UtcNow.AddMinutes(10), // Short lifespan
            IsEssential = true
        });

        var loginRequest = new LoginRequest(_redirectUri, _clientId, LoginRequest.ResponseType.Code)
        {
            CodeChallenge = challenge,
            CodeChallengeMethod = "S256",
            Scope = new List<string>
            {
                Scopes.UserReadPrivate,
                Scopes.UserReadEmail,
                Scopes.UserReadPlaybackState,
                Scopes.UserModifyPlaybackState,
                Scopes.UserReadCurrentlyPlaying,
                Scopes.UserReadRecentlyPlayed,
                Scopes.UserTopRead,
                Scopes.PlaylistReadPrivate,
                Scopes.PlaylistReadCollaborative,
                Scopes.PlaylistModifyPublic,
                Scopes.PlaylistModifyPrivate,
                Scopes.UserLibraryRead,
                Scopes.UserLibraryModify,
                Scopes.UserFollowRead,
                Scopes.UserFollowModify,
                Scopes.Streaming // Required for Web Playback SDK
            }
        };

        return loginRequest.ToUri();
    }

    public async Task<PKCETokenResponse> ExchangeCodeForToken(string code)
    {
        // Retrieve and decrypt verifier from cookie
        var encryptedVerifier = _httpContextAccessor.HttpContext?.Request.Cookies[VerifierCookieName];
        if (string.IsNullOrEmpty(encryptedVerifier))
        {
            throw new InvalidOperationException("PKCE Verifier cookie not found. Please try logging in again.");
        }

        string verifier;
        try
        {
            verifier = _protector.Unprotect(encryptedVerifier);
        }
        catch
        {
             throw new InvalidOperationException("Invalid PKCE Verifier cookie.");
        }

        // Clean up the cookie
        _httpContextAccessor.HttpContext?.Response.Cookies.Delete(VerifierCookieName);

        var tokenRequest = new PKCETokenRequest(_clientId, code, _redirectUri, verifier);
        var oauthClient = new OAuthClient();
        return await oauthClient.RequestToken(tokenRequest);
    }

    public async Task<PKCETokenResponse> RefreshToken(string refreshToken)
    {
        var refreshRequest = new PKCETokenRefreshRequest(_clientId, refreshToken);
        var oauthClient = new OAuthClient();
        return await oauthClient.RequestToken(refreshRequest);
    }

    public SpotifyClient CreateClient(string accessToken)
    {
        var config = SpotifyClientConfig.CreateDefault(accessToken);
        return new SpotifyClient(config);
    }

    public SpotifyClient CreateClient(PKCETokenResponse token)
    {
        var authenticator = new PKCEAuthenticator(_clientId, token);
        var config = SpotifyClientConfig.CreateDefault().WithAuthenticator(authenticator);
        return new SpotifyClient(config);
    }
}
