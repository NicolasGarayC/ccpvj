using System;

namespace Back.Models
{
    public class UploadStatus
    {
        public Guid UploadId { get; set; }
        public string Status { get; set; } = string.Empty; // "pending", "processing", "completed", "error"
        public string? ErrorMessage { get; set; }
        public int? MediaId { get; set; } // ID del MediaEntity una vez completado
        public DateTime CreatedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public double Progress { get; set; } // 0-100
        public string FileName { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
    }
}