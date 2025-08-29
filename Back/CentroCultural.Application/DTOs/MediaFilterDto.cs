using System;
using CentroCultural.Domain.Enums;

namespace CentroCultural.Application.DTOs
{
    public class MediaFilterDto
    {
        public MediaType? Type { get; set; }
        public string? CreatedBy { get; set; }
        public DateTime? CreatedAfter { get; set; }
        public DateTime? CreatedBefore { get; set; }
        public string? FileNameContains { get; set; }
        public int? Skip { get; set; }
        public int? Take { get; set; }
    }
}