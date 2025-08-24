public class MediaEntity
{
    public int Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string RelativePath { get; set; } = string.Empty;
    public string ThumbnailPath { get; set; } = string.Empty;
    public MediaType Type { get; set; }
    public long SizeBytes { get; set; }
    public int? DurationSeconds { get; set; }
    public string MimeType { get; set; } = string.Empty;
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public Dictionary<string, object> Metadata { get; set; } = new();
}

public enum MediaType { Image = 1, Video = 2, Audio = 3, Document = 4 }