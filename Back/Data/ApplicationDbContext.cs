using Microsoft.EntityFrameworkCore;
using Back.Models;

namespace Back.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Usuario> Usuario { get; set; }
        public DbSet<Rol> Rol { get; set; }
        public DbSet<Course> Course { get; set; }
        public DbSet<Module> Module { get; set; }
        public DbSet<MediaEntity> MediaEntity { get; set; }
        public DbSet<UploadStatus> UploadStatus { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configuración de Rol
            modelBuilder.Entity<Rol>(entity =>
            {
                entity.HasKey(e => e.IdRol);
                entity.Property(e => e.NombreRol).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Descripcion).HasMaxLength(255);
            });

            // Configuración de Usuario
            modelBuilder.Entity<Usuario>(entity =>
            {
                entity.HasKey(e => e.IdUsuario);
                entity.Property(e => e.NombreUsuario).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Contrasena).IsRequired().HasMaxLength(255);
                entity.Property(e => e.FechaRegistro).IsRequired();
                entity.Property(e => e.Nombre).HasMaxLength(100);
                entity.Property(e => e.Apellido).HasMaxLength(100);
                entity.Property(e => e.Telefono).HasMaxLength(20);
                entity.Property(e => e.IdRol).IsRequired();

                // Índice único para nombre de usuario
                entity.HasIndex(e => e.NombreUsuario).IsUnique();

                // Configuración de la relación con Rol
                entity.HasOne(u => u.Rol)
                      .WithMany(r => r.Usuarios)
                      .HasForeignKey(u => u.IdRol)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Configuración de Course
            modelBuilder.Entity<Course>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Description).IsRequired().HasMaxLength(1000);
                entity.Property(e => e.ImagePath).HasMaxLength(500);
                entity.Property(e => e.IsActive).HasDefaultValue(true);
                entity.Property(e => e.IsFeatured).HasDefaultValue(false);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("datetime('now')");

                // Relación con Usuario (Educador)
                entity.HasOne(c => c.Educator)
                      .WithMany()
                      .HasForeignKey(c => c.EducatorId)
                      .OnDelete(DeleteBehavior.Restrict);

                // Índice para búsquedas
                entity.HasIndex(e => e.Title);
                entity.HasIndex(e => e.IsActive);
                entity.HasIndex(e => e.IsFeatured);
            });

            // Configuración de Module
            modelBuilder.Entity<Module>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Description).HasMaxLength(500);
                entity.Property(e => e.Content).HasColumnType("TEXT");
                entity.Property(e => e.OrderNumber).IsRequired();
                entity.Property(e => e.IsActive).HasDefaultValue(true);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("datetime('now')");

                // Relación con Course
                entity.HasOne(m => m.Course)
                      .WithMany(c => c.Modules)
                      .HasForeignKey(m => m.CourseId)
                      .OnDelete(DeleteBehavior.Cascade);

                // Índices para búsquedas y ordenamiento
                entity.HasIndex(e => new { e.CourseId, e.OrderNumber });
                entity.HasIndex(e => e.IsActive);
            });

            // Datos semilla para Rol
            modelBuilder.Entity<Rol>().HasData(
                new Rol
                {
                    IdRol = 1,
                    NombreRol = "Educador",
                    Descripcion = "Rol de educador del sistema"
                },
                new Rol
                {
                    IdRol = 2,
                    NombreRol = "Estudiante",
                    Descripcion = "Rol de estudiante del sistema"
                }
            );

            // Datos semilla para Usuario
            modelBuilder.Entity<Usuario>().HasData(
                new Usuario
                {
                    IdUsuario = 1,
                    NombreUsuario = "admin",
                    Contrasena = BCrypt.Net.BCrypt.HashPassword("admin123"),
                    FechaRegistro = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"),
                    Nombre = "Administrador",
                    Apellido = "Sistema",
                    IdRol = 1
                }
            );

            // Datos semilla para Course
            var courseId = Guid.NewGuid();
            modelBuilder.Entity<Course>().HasData(
                new Course
                {
                    Id = courseId,
                    Title = "Introducción a la Programación",
                    Description = "Curso básico de programación para principiantes",
                    ImagePath = "/images/courses/programming-intro.jpg",
                    IsActive = true,
                    IsFeatured = true,
                    CreatedAt = DateTime.UtcNow,
                    EducatorId = 1
                }
            );

            // Datos semilla para Module
            modelBuilder.Entity<Module>().HasData(
                new Module
                {
                    Id = Guid.NewGuid(),
                    Title = "Conceptos Básicos",
                    Description = "Introducción a los conceptos fundamentales de programación",
                    Content = "En este módulo aprenderás los conceptos básicos de programación...",
                    OrderNumber = 1,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    CourseId = courseId
                },
                new Module
                {
                    Id = Guid.NewGuid(),
                    Title = "Variables y Tipos de Datos",
                    Description = "Aprende sobre variables y los diferentes tipos de datos",
                    Content = "Las variables son contenedores que almacenan valores...",
                    OrderNumber = 2,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    CourseId = courseId
                }
            );
        }
    }
}
