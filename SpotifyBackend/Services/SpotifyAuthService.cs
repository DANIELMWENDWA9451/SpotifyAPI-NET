namespace SpotifyBackend.Services;

using SpotifyAPI.Web;
using SpotifyAPI.Web.Auth;
using System.Threading;

public class SpotifyAuthService
{
    private readonly string _clientId;
    private readonly Uri _redirectUri;

    public SpotifyAuthService(IConfiguration configuration)
    {
        _clientId = configuration["Spotify:ClientId"] 
            ?? throw new InvalidOperationException("Spotify ClientId not configured");
        _redirectUri = new Uri(configuration["Spotify:RedirectUri"] 
            ?? "http://127.0.0.1:5000/api/auth/callback");
    }

    public async Task<Uri> GetAuthorizationUri()
    {
        var (verifier, challenge) = PKCEUtil.GenerateCodes();
        
        // In a real API, this should be stored in a distributed cache or database linked to a session ID
        PKCEVerifier = verifier;

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
        var tokenRequest = new PKCETokenRequest(_clientId, code, _redirectUri, PKCEVerifier!);
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

    // Temporary storage for PKCE verifier
    public static string? PKCEVerifier { get; set; }
}
