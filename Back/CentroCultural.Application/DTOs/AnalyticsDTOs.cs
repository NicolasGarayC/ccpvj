namespace CentroCultural.Application.DTOs
{
    public class AnalyticsSummaryDto
    {
        public int TotalVisitors { get; set; }
        public int TotalDownloads { get; set; }
        public int TotalResources { get; set; }
    }

    public class VisitorsChartDto
    {
        public List<DailyVisitorDto> Data { get; set; } = new List<DailyVisitorDto>();
    }

    public class DailyVisitorDto
    {
        public string Date { get; set; } = string.Empty;
        public int Visitors { get; set; }
    }

    public class TopResourcesDto
    {
        public List<TopResourceDto> Resources { get; set; } = new List<TopResourceDto>();
    }

    public class TopResourceDto
    {
        public string Name { get; set; } = string.Empty;
        public int Downloads { get; set; }
        public string Type { get; set; } = string.Empty; // 'library', 'blog', 'course'
    }

    public class VisitorTrackingDto
    {
        public string Id { get; set; } = string.Empty;
        public string IpAddress { get; set; } = string.Empty;
        public string UserAgent { get; set; } = string.Empty;
        public long VisitedAt { get; set; }
        public int? UserId { get; set; }
        public string PageVisited { get; set; } = string.Empty;
        public string SessionId { get; set; } = string.Empty;
    }

    public class DownloadTrackingDto
    {
        public string Id { get; set; } = string.Empty;
        public string ResourceId { get; set; } = string.Empty;
        public string ResourceType { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public int? DownloadedBy { get; set; }
        public long DownloadedAt { get; set; }
        public string IpAddress { get; set; } = string.Empty;
        public int? FileSize { get; set; }
    }
}