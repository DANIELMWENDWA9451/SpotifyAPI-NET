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
    options.Cookie.SameSite = SameSiteMode.Lax; // Important for cross-origin
});

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactApp", builder =>
    {
        builder.WithOrigins(
            "http://localhost:3000", 
            "http://localhost:8080",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:8080"
        )
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

