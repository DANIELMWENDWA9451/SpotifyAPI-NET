using Microsoft.AspNetCore.Mvc;
using SpotifyBackend.Services;
using SpotifyAPI.Web;

namespace SpotifyBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BrowseController : ControllerBase
{
    private readonly SpotifyService _spotifyService;
    private readonly ILogger<BrowseController> _logger;

    public BrowseController(SpotifyService spotifyService, ILogger<BrowseController> logger)
    {
        _spotifyService = spotifyService;
        _logger = logger;
    }

    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories([FromQuery] string? locale)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        
        // Get user's country for relevant categories
        var user = await _spotifyService.GetCurrentUserProfile();
        var country = user?.Country ?? "US";
        var userLocale = locale ?? $"en_{country}"; // e.g., en_US

        var client = _spotifyService.GetClient();
        if (client == null) return Unauthorized();

        try
        {
            var categories = await client.Browse.GetCategories(new CategoriesRequest { Country = country, Locale = userLocale, Limit = 50 });
            if (categories?.Categories?.Items == null) return Ok(new object[] { });
            
            return Ok(categories.Categories.Items.Select(c => new
            {
                id = c.Id,
                name = c.Name,
                icons = c.Icons?.Select(i => new { url = i.Url, height = i.Height, width = i.Width })
            }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GetCategories error");
            return Ok(new object[] { });
        }
    }

    [HttpGet("markets")]
    public async Task<IActionResult> GetMarkets()
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var client = _spotifyService.GetClient();
        if (client == null) return Unauthorized();

        try 
        {
            var markets = await client.Markets.AvailableMarkets();
            return Ok(markets.Markets);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GetMarkets error");
            return StatusCode(500, new { error = "Failed to fetch markets" });
        }
    }

    /// <summary>
    /// Get categories that have playlists (pre-filtered for better UX)
    /// </summary>
    [HttpGet("categories-with-content")]
    public async Task<IActionResult> GetCategoriesWithContent([FromQuery] string? locale)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        
        var user = await _spotifyService.GetCurrentUserProfile();
        var country = user?.Country ?? "US";
        var userLocale = locale ?? $"en_{country}";

        var client = _spotifyService.GetClient();
        if (client == null) return Unauthorized();

        try
        {
            var categories = await client.Browse.GetCategories(new CategoriesRequest { Country = country, Locale = userLocale, Limit = 50 });
            if (categories?.Categories?.Items == null) return Ok(new object[] { });
            
            // Pre-filter categories that have playlists (check first 3 in parallel for speed)
            var validCategories = new List<object>();
            var tasks = categories.Categories.Items.Take(20).Select(async c =>
            {
                try
                {
                    var playlists = await client.Browse.GetCategoryPlaylists(c.Id, new CategoriesPlaylistsRequest { Country = country, Limit = 1 });
                    if (playlists?.Playlists?.Items?.Count > 0)
                    {
                        return new
                        {
                            id = c.Id,
                            name = c.Name,
                            icons = c.Icons?.Select(i => new { url = i.Url, height = i.Height, width = i.Width })
                        };
                    }
                }
                catch { /* Category has no playlists in this region */ }
                return null;
            }).ToList();

            var results = await Task.WhenAll(tasks);
            return Ok(results.Where(r => r != null));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GetCategoriesWithContent error");
            return Ok(new object[] { });
        }
    }

    [HttpGet("new-releases")]
    public async Task<IActionResult> GetNewReleases()
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        
        var user = await _spotifyService.GetCurrentUserProfile();
        var country = user?.Country ?? "US";

        var releases = await _spotifyService.GetClient().Browse.GetNewReleases(new NewReleasesRequest { Country = country, Limit = 20 });
        if (releases?.Albums?.Items == null) return Ok(new object[] { });
        
        return Ok(releases.Albums.Items.Select(a => new
        {
            id = a.Id,
            name = a.Name,
            images = a.Images?.Select(i => new { url = i.Url, height = i.Height, width = i.Width }),
            artists = a.Artists?.Select(ar => new { id = ar.Id, name = ar.Name, uri = ar.Uri }),
            release_date = a.ReleaseDate,
            total_tracks = a.TotalTracks,
            album_type = a.AlbumType,
            uri = a.Uri
        }));
    }

    [HttpGet("featured-playlists")]
    public async Task<IActionResult> GetFeaturedPlaylists([FromQuery] int limit = 20, [FromQuery] int offset = 0)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var client = _spotifyService.GetClient();
        if (client == null) return Unauthorized();

        try
        {
            var user = await _spotifyService.GetCurrentUserProfile();
            var country = user?.Country ?? "US";
            
            var featured = await client.Browse.GetFeaturedPlaylists(new FeaturedPlaylistsRequest { Limit = limit, Offset = offset, Country = country });
            var items = featured.Playlists?.Items;
            
            object playlistsResult;
            if (items != null)
            {
                playlistsResult = items.Select(p => new
                {
                    id = p.Id,
                    name = p.Name,
                    description = p.Description,
                    images = p.Images?.Select(i => new { url = i.Url, height = i.Height, width = i.Width }),
                    owner = new { id = p.Owner?.Id, display_name = p.Owner?.DisplayName },
                    tracks = new { total = p.Tracks?.Total ?? 0 },
                    @public = p.Public,
                    collaborative = p.Collaborative,
                    uri = p.Uri
                });
            }
            else
            {
                playlistsResult = new object[] { };
            }
            
            return Ok(new
            {
                message = featured.Message,
                playlists = playlistsResult
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GetFeaturedPlaylists error");
            return Ok(new { message = "", playlists = Array.Empty<object>() });
        }
    }

    [HttpGet("categories/{id}")]
    public async Task<IActionResult> GetCategory(string id)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var client = _spotifyService.GetClient();
        if (client == null) return Unauthorized();

        try
        {
            var user = await _spotifyService.GetCurrentUserProfile();
            var country = user?.Country ?? "US";

            var category = await client.Browse.GetCategory(id, new CategoryRequest { Country = country });
            return Ok(new
            {
                id = category.Id,
                name = category.Name,
                icons = category.Icons?.Select(i => new { url = i.Url, height = i.Height, width = i.Width }),
                href = category.Href
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GetCategory error");
            return Ok(new { id = id, name = "", icons = Array.Empty<object>() });
        }
    }

    [HttpGet("categories/{id}/playlists")]
    public async Task<IActionResult> GetCategoryPlaylists(string id, [FromQuery] int limit = 20, [FromQuery] int offset = 0)
    {
        if (!_spotifyService.IsAuthenticated) return Unauthorized();
        var client = _spotifyService.GetClient();
        if (client == null) return Unauthorized();

        var user = await _spotifyService.GetCurrentUserProfile();
        var country = user?.Country ?? "US";
        
        // Try 1: Get playlists with user's country
        try
        {
            var playlists = await client.Browse.GetCategoryPlaylists(id, new CategoriesPlaylistsRequest { Limit = limit, Offset = offset, Country = country });
            var items = playlists.Playlists?.Items;
            if (items != null && items.Count > 0)
            {
                return Ok(items.Select(p => MapPlaylist(p)));
            }
        }
        catch (APIException ex) when (ex.Response?.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
             _logger.LogWarning(ex, "GetCategoryPlaylists: No playlists for '{Id}' in country '{Country}'", id, country);
        }
        catch (Exception ex)
        {
             _logger.LogError(ex, "GetCategoryPlaylists error");
        }

        // Try 2: Get playlists without country (global)
        try
        {
            var playlists = await client.Browse.GetCategoryPlaylists(id, new CategoriesPlaylistsRequest { Limit = limit, Offset = offset });
            var items = playlists.Playlists?.Items;
            if (items != null && items.Count > 0)
            {
                return Ok(items.Select(p => MapPlaylist(p)));
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "GetCategoryPlaylists global fallback error");
        }

        // Try 3: FALLBACK - Search for playlists by category name
        try
        {
            // First get the category name
            string categoryName = id;
            try
            {
                var category = await client.Browse.GetCategory(id);
                categoryName = category?.Name ?? id;
            }
            catch { /* Use ID as search term */ }



            _logger.LogInformation("Falling back to search for: {CategoryName} playlists", categoryName);
            var searchResults = await client.Search.Item(new SearchRequest(SearchRequest.Types.Playlist, $"{categoryName} playlist")
            {
                Limit = limit,
                Offset = offset
            });

            var searchPlaylists = searchResults.Playlists?.Items;
            if (searchPlaylists != null && searchPlaylists.Count > 0)
            {
                // Filter out null items and map
                return Ok(searchPlaylists.Where(p => p != null).Select(p => MapPlaylist(p!)));
            }
        }

        catch (Exception ex)
        {
            _logger.LogError(ex, "GetCategoryPlaylists search fallback error");
        }

        return Ok(Array.Empty<object>());
    }

    private static object MapPlaylist(FullPlaylist p) => new
    {
        id = p?.Id ?? "",
        name = p?.Name ?? "",
        description = p?.Description ?? "",
        images = p?.Images?.Select(i => new { url = i?.Url ?? "", height = i?.Height, width = i?.Width }),
        owner = new { id = p?.Owner?.Id ?? "", display_name = p?.Owner?.DisplayName ?? "" },
        tracks = new { total = p?.Tracks?.Total ?? 0 },
        uri = p?.Uri ?? ""
    };
}
