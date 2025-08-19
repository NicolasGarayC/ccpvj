using System;
using System.Collections.Generic;

namespace CentroCultural.Domain.Entities
{
    public class User
    {
        public Guid Id { get; set; }
        public string Username { get; set; }
        public string Email { get; set; }
        public string PasswordHash { get; set; }
        public string Role { get; set; } // "student" o "educator"
        public string FullName { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? LastLogin { get; set; }
        
        // Relaciones
        public virtual ICollection<BlogPost> AuthoredPosts { get; set; }
        public virtual ICollection<Course> ManagedCourses { get; set; } // Solo para educadores
    }
}
