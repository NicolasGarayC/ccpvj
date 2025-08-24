using System;
using System.Collections.Generic;
using Back.Models; // Para Usuario y Module

namespace Back.CentroCultural.Domain.Entities
{
    public class Course
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string ImagePath { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Relaciones
        public int EducatorId { get; set; }
        public virtual Usuario Educator { get; set; } = null!;

        // Inicializar colecciones correctamente
        public virtual ICollection<Module> Modules { get; set; } = new List<Module>();
        // Se elimina Forums porque no existe la clase Forum
    }
}
