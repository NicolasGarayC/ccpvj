using System;
using System.Collections.Generic;

namespace CentroCultural.Domain.Entities
{
    public class Course
    {
        public Guid Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public string ImagePath { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        
        // Relaciones
        public Guid EducatorId { get; set; }
        public virtual User Educator { get; set; }
        public virtual ICollection<Module> Modules { get; set; }
        public virtual ICollection<Forum> Forums { get; set; }
    }
}
