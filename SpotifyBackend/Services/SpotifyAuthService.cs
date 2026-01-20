namespace SpotifyBackend.Services;

using SpotifyAPI.Web;
using SpotifyAPI.Web.Auth;
using System.Threading;

public class SpotifyAuthService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public SpotifyAuthService(IConfiguration configuration, IHttpContextAccessor httpContextAccessor)
    {
        _clientId = configuration["Spotify:ClientId"] 
            ?? throw new InvalidOperationException("Spotify ClientId not configured");
        var redirectUriString = configuration["Spotify:RedirectUri"] 
            ?? throw new InvalidOperationException("Spotify RedirectUri not configured");
        _redirectUri = new Uri(redirectUriString);
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<Uri> GetAuthorizationUri()
    {
        var (verifier, challenge) = PKCEUtil.GenerateCodes();
        
        // Store verifier in session
        _httpContextAccessor.HttpContext?.Session.SetString("PKCEVerifier", verifier);

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
        var verifier = _httpContextAccessor.HttpContext?.Session.GetString("PKCEVerifier");
        if (string.IsNullOrEmpty(verifier))
        {
            throw new InvalidOperationException("PKCE Verifier not found in session. Please try logging in again.");
        }

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
