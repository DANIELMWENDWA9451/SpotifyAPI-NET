using SpotifyBackend.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
// Add Data Protection
builder.Services.AddDataProtection();

// Add HttpContextAccessor
builder.Services.AddHttpContextAccessor();

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
// app.UseSession(); // Removed for stateless auth
app.UseAuthorization();

app.MapControllers();

app.Run();

