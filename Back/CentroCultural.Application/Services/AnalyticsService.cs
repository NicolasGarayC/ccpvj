using Microsoft.Data.Sqlite;
using CentroCultural.Application.DTOs;
using CentroCultural.Application.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;

namespace CentroCultural.Application.Services
{
    public class AnalyticsService : IAnalyticsService
    {
        private readonly ILogger<AnalyticsService> _logger;
        private readonly string _connectionString;

        public AnalyticsService(ILogger<AnalyticsService> logger, IConfiguration configuration)
        {
            _logger = logger;
            _connectionString = configuration.GetConnectionString("DefaultConnection") ?? throw new InvalidOperationException("Connection string not found");
        }

        public async Task<AnalyticsSummaryDto> GetSummaryAsync()
        {
            try
            {
                using var connection = new SqliteConnection(_connectionString);
                await connection.OpenAsync();

                var summary = new AnalyticsSummaryDto();

                // Get total unique visitors count (distinct IPs from visitor_tracking)
                using var visitorsCmd = new SqliteCommand("SELECT COUNT(DISTINCT ip_address) FROM visitor_tracking", connection);
                var visitorsResult = await visitorsCmd.ExecuteScalarAsync();
                summary.TotalVisitors = Convert.ToInt32(visitorsResult ?? 0);
                _logger.LogInformation("Visitors counted: {Count}", summary.TotalVisitors);

                // Get total downloads count from download_tracking
                using var downloadsCmd = new SqliteCommand("SELECT COUNT(*) FROM download_tracking", connection);
                var downloadsResult = await downloadsCmd.ExecuteScalarAsync();
                summary.TotalDownloads = Convert.ToInt32(downloadsResult ?? 0);
                _logger.LogInformation("Downloads counted: {Count}", summary.TotalDownloads);

                // Get total active resources count (eventos + proyectos + módulos + items biblioteca)
                using var resourcesCmd = new SqliteCommand(@"
                    SELECT
                        (SELECT COUNT(*) FROM event WHERE is_active = 1) +
                        (SELECT COUNT(*) FROM material_apoyo WHERE is_active = 1) +
                        (SELECT COUNT(*) FROM modulo WHERE is_active = 1) +
                        (SELECT COUNT(*) FROM library_item WHERE is_active = 1)
                ", connection);
                var resourcesResult = await resourcesCmd.ExecuteScalarAsync();
                summary.TotalResources = Convert.ToInt32(resourcesResult ?? 0);
                _logger.LogInformation("Resources counted: {Count}", summary.TotalResources);

                _logger.LogInformation("Summary DTO created: {@Summary}", summary);
                return summary;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting analytics summary");
                return new AnalyticsSummaryDto();
            }
        }

        public async Task<VisitorsChartDto> GetVisitorsChartAsync(int days = 30)
        {
            try
            {
                using var connection = new SqliteConnection(_connectionString);
                await connection.OpenAsync();

                var data = new List<DailyVisitorDto>();
                var startDate = DateTimeOffset.UtcNow.AddDays(-days).ToUnixTimeSeconds();

                using var cmd = new SqliteCommand(@"
                    SELECT
                        DATE(visited_at, 'unixepoch') as visit_date,
                        COUNT(DISTINCT ip_address) as unique_visitors
                    FROM visitor_tracking
                    WHERE visited_at >= @startDate
                    GROUP BY DATE(visited_at, 'unixepoch')
                    ORDER BY visit_date ASC
                ", connection);

                cmd.Parameters.AddWithValue("@startDate", startDate);

                using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    var date = reader.GetString(0);
                    var visitors = reader.GetInt32(1);

                    if (DateTime.TryParse(date, out var parsedDate))
                    {
                        data.Add(new DailyVisitorDto
                        {
                            Date = parsedDate.ToString("MMM dd"),
                            Visitors = visitors
                        });
                    }
                }

                return new VisitorsChartDto { Data = data };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting visitors chart data");
                return new VisitorsChartDto();
            }
        }

        public async Task<TopResourcesDto> GetTopDownloadsAsync(int limit = 5)
        {
            try
            {
                using var connection = new SqliteConnection(_connectionString);
                await connection.OpenAsync();

                var resources = new List<TopResourceDto>();

                using var cmd = new SqliteCommand(@"
                    SELECT
                        file_name,
                        resource_type,
                        COUNT(*) as download_count
                    FROM download_tracking
                    GROUP BY file_name, resource_type
                    ORDER BY download_count DESC
                    LIMIT @limit
                ", connection);

                cmd.Parameters.AddWithValue("@limit", limit);

                using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    var fileName = reader.GetString(0);
                    var resourceType = reader.GetString(1);
                    var downloadCount = reader.GetInt32(2);

                    var displayType = resourceType switch
                    {
                        "library_item" => "library",
                        "blog_media" => "blog",
                        "course_media" => "course",
                        _ => "unknown"
                    };

                    resources.Add(new TopResourceDto
                    {
                        Name = fileName,
                        Downloads = downloadCount,
                        Type = displayType
                    });
                }

                return new TopResourcesDto { Resources = resources };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting top downloads data");
                return new TopResourcesDto();
            }
        }

        public async Task TrackVisitorAsync(string ipAddress, string userAgent, string pageVisited, int? userId = null)
        {
            try
            {
                using var connection = new SqliteConnection(_connectionString);
                await connection.OpenAsync();

                var id = Guid.NewGuid().ToString();
                var sessionId = Guid.NewGuid().ToString();
                var visitedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

                using var cmd = new SqliteCommand(@"
                    INSERT INTO visitor_tracking (id, ip_address, user_agent, visited_at, user_id, page_visited, session_id)
                    VALUES (@id, @ipAddress, @userAgent, @visitedAt, @userId, @pageVisited, @sessionId)
                ", connection);

                cmd.Parameters.AddWithValue("@id", id);
                cmd.Parameters.AddWithValue("@ipAddress", ipAddress);
                cmd.Parameters.AddWithValue("@userAgent", userAgent ?? string.Empty);
                cmd.Parameters.AddWithValue("@visitedAt", visitedAt);
                cmd.Parameters.AddWithValue("@userId", userId.HasValue ? userId.Value : DBNull.Value);
                cmd.Parameters.AddWithValue("@pageVisited", pageVisited);
                cmd.Parameters.AddWithValue("@sessionId", sessionId);

                await cmd.ExecuteNonQueryAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error tracking visitor for IP: {IpAddress}, Page: {Page}", ipAddress, pageVisited);
            }
        }

        public async Task TrackDownloadAsync(string resourceId, string resourceType, string filePath, string fileName, int? userId, string ipAddress, int? fileSize = null)
        {
            try
            {
                using var connection = new SqliteConnection(_connectionString);
                await connection.OpenAsync();

                var id = Guid.NewGuid().ToString();
                var downloadedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

                using var cmd = new SqliteCommand(@"
                    INSERT INTO download_tracking (id, resource_id, resource_type, file_path, file_name, downloaded_by, downloaded_at, ip_address, file_size)
                    VALUES (@id, @resourceId, @resourceType, @filePath, @fileName, @downloadedBy, @downloadedAt, @ipAddress, @fileSize)
                ", connection);

                cmd.Parameters.AddWithValue("@id", id);
                cmd.Parameters.AddWithValue("@resourceId", resourceId);
                cmd.Parameters.AddWithValue("@resourceType", resourceType);
                cmd.Parameters.AddWithValue("@filePath", filePath);
                cmd.Parameters.AddWithValue("@fileName", fileName);
                cmd.Parameters.AddWithValue("@downloadedBy", userId.HasValue ? userId.Value : DBNull.Value);
                cmd.Parameters.AddWithValue("@downloadedAt", downloadedAt);
                cmd.Parameters.AddWithValue("@ipAddress", ipAddress);
                cmd.Parameters.AddWithValue("@fileSize", fileSize.HasValue ? fileSize.Value : DBNull.Value);

                await cmd.ExecuteNonQueryAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error tracking download for resource: {ResourceId}, File: {FileName}", resourceId, fileName);
            }
        }
    }
}