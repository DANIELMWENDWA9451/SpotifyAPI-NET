using SpotifyBackend.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddHttpContextAccessor();

// Add session support
builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromHours(24);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
    options.Cookie.SameSite = SameSiteMode.None; // Required for cross-site (Vercel -> Backend)
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always; // Required for SameSite=None
});

// Add CORS
var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactApp", builder =>
    {
        builder.WithOrigins(allowedOrigins)
               .AllowAnyHeader()
               .AllowAnyMethod()
               .AllowCredentials();
    });
});

// Add Spotify services
builder.Services.AddSingleton<SpotifyAuthService>();
builder.Services.AddScoped<SpotifyService>();
builder.Services.AddHttpClient("").ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
{
    AutomaticDecompression = System.Net.DecompressionMethods.All,
    UseCookies = false // We manually manage cookies in headers
});
builder.Services.AddScoped<ILyricsService, LyricsService>();

var app = builder.Build();

app.UseCors("ReactApp");
app.UseSession();
app.UseAuthorization();

app.MapControllers();

app.Run();

