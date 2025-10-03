using CentroCultural.Application.DTOs;

namespace CentroCultural.Application.Interfaces
{
    public interface IAnalyticsService
    {
        Task<AnalyticsSummaryDto> GetSummaryAsync();
        Task<VisitorsChartDto> GetVisitorsChartAsync(int days = 30);
        Task<TopResourcesDto> GetTopDownloadsAsync(int limit = 5);
        Task TrackVisitorAsync(string ipAddress, string userAgent, string pageVisited, int? userId = null);
        Task TrackDownloadAsync(string resourceId, string resourceType, string filePath, string fileName, int? userId, string ipAddress, int? fileSize = null);
    }
}