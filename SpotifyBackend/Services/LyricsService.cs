#nullable disable
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
// Removed IMemoryCache usage to prevent build errors
using SpotifyAPI.Web;

namespace SpotifyBackend.Services
{
    public interface ILyricsService
    {
        Task<object> GetLyricsAsync(string trackId);
    }

    public class LyricsService : ILyricsService
    {
        private readonly HttpClient _httpClient;
        private readonly SpotifyService _spotifyService;

        public LyricsService(HttpClient httpClient, SpotifyService spotifyService)
        {
            _httpClient = httpClient;
            _spotifyService = spotifyService;
        }

        public async Task<object> GetLyricsAsync(string trackId)
        {
            try
            {
                // 1. Get Track Metadata from Official Spotify API
                var client = _spotifyService.GetClient();
                if (client == null) return new { error = "Not authenticated with Spotify" };

                var track = await client.Tracks.Get(trackId);
                if (track == null) return new { error = "Track not found" };

                string trackName = track.Name ?? "";
                string artistName = track.Artists?.FirstOrDefault()?.Name ?? "";
                string albumName = track.Album?.Name ?? "";
                double duration = track.DurationMs / 1000.0;

                // 2. Request Lyrics from LrcLib.net
                var queryUrl = $"https://lrclib.net/api/get?artist_name={Uri.EscapeDataString(artistName)}&track_name={Uri.EscapeDataString(trackName)}&album_name={Uri.EscapeDataString(albumName)}&duration={duration}";
                
                var response = await _httpClient.GetAsync(queryUrl);
                
                if (!response.IsSuccessStatusCode)
                {
                    // Fallback: Try searching without album/duration
                    var simpleUrl = $"https://lrclib.net/api/get?artist_name={Uri.EscapeDataString(artistName)}&track_name={Uri.EscapeDataString(trackName)}";
                    response = await _httpClient.GetAsync(simpleUrl);
                }

                if (response.IsSuccessStatusCode)
                {
                    var jsonContent = await response.Content.ReadAsStringAsync();
                    var lrcData = JsonSerializer.Deserialize<LrcLibResponse>(jsonContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    
                    var formattedLyrics = ConvertToFrontendFormat(lrcData);
                    
                    return new { lyrics = formattedLyrics };
                }
                
                return new { error = "Lyrics not found in public database" };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching lyrics: {ex.Message}");
                return new { error = "Failed to fetch lyrics" };
            }
        }

        private object ConvertToFrontendFormat(LrcLibResponse data)
        {
            if (data == null || (string.IsNullOrEmpty(data.syncedLyrics) && string.IsNullOrEmpty(data.plainLyrics)))
            {
                return new { syncType = "UNSYNCED", lines = new List<object>() };
            }

            var lines = new List<object>();
            string syncType = "LINE_SYNCED";

            if (!string.IsNullOrEmpty(data.syncedLyrics))
            {
                var rawLines = data.syncedLyrics.Split('\n');
                foreach (var line in rawLines)
                {
                    if (string.IsNullOrWhiteSpace(line)) continue;
                    
                    var match = System.Text.RegularExpressions.Regex.Match(line, @"\[(\d+):(\d+\.\d+)\](.*)");
                    if (match.Success)
                    {
                        var minutes = int.Parse(match.Groups[1].Value);
                        var seconds = double.Parse(match.Groups[2].Value);
                        var text = match.Groups[3].Value.Trim();
                        var startTimeMs = (long)((minutes * 60 + seconds) * 1000);

                        lines.Add(new { startTimeMs = startTimeMs.ToString(), words = text });
                    }
                }
            }
            else
            {
                syncType = "UNSYNCED";
                var rawLines = data.plainLyrics.Split('\n');
                foreach (var line in rawLines)
                {
                    lines.Add(new { words = line.Trim(), startTimeMs = "0" });
                }
            }

            return new { syncType, lines };
        }

        private class LrcLibResponse
        {
            public string syncedLyrics { get; set; }
            public string plainLyrics { get; set; }
        }
    }
}
