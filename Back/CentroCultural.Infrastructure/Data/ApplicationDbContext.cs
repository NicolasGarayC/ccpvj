using CentroCultural.Domain.Entities;
using Models;
using CentroCultural.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Text.Json.Serialization;
    
namespace CentroCultural.Infrastructure.Data
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
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<TokenBlacklist> TokenBlacklist { get; set; }

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

            // Configuración de MediaEntity
            modelBuilder.Entity<MediaEntity>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.FileName).IsRequired().HasMaxLength(255);
                entity.Property(e => e.RelativePath).IsRequired().HasMaxLength(500);
                entity.Property(e => e.ThumbnailPath).HasMaxLength(500);
                entity.Property(e => e.Type).IsRequired();
                entity.Property(e => e.SizeBytes).IsRequired();
                entity.Property(e => e.MimeType).IsRequired().HasMaxLength(100);
                entity.Property(e => e.CreatedBy).IsRequired().HasMaxLength(100);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("datetime('now')");

                // Opción 1: Serializar el diccionario como JSON (recomendado)
                entity.Property(e => e.Metadata)
                      .HasConversion(
                          v => JsonSerializer.Serialize(v, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }),
                          v => JsonSerializer.Deserialize<Dictionary<string, object>>(v, new JsonSerializerOptions 
                          { 
                              PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                              NumberHandling = JsonNumberHandling.AllowReadingFromString
                          }) ?? new Dictionary<string, object>())
                      .HasColumnType("TEXT");

                // Opción 2: Si no necesitas la propiedad Metadata, puedes ignorarla
                // entity.Ignore(e => e.Metadata);
            });

            // Configuración de UploadStatus
            modelBuilder.Entity<UploadStatus>(entity =>
            {
                entity.HasKey(e => e.UploadId);
                entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
                entity.Property(e => e.ErrorMessage).HasMaxLength(1000);
                entity.Property(e => e.Progress).HasDefaultValue(0);
                entity.Property(e => e.FileName).IsRequired().HasMaxLength(255);
                entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("datetime('now')");
                
                // Índices para búsquedas
                entity.HasIndex(e => e.Status);
                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.CreatedAt);
            });

            // Configuración de RefreshToken
            modelBuilder.Entity<RefreshToken>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Token).IsRequired().HasMaxLength(500);
                entity.Property(e => e.ExpiresAt).IsRequired();
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("datetime('now')");
                entity.Property(e => e.IsRevoked).HasDefaultValue(false);
                
                // Relación con Usuario
                entity.HasOne(rt => rt.Usuario)
                      .WithMany()
                      .HasForeignKey(rt => rt.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
                
                // Índices
                entity.HasIndex(e => e.Token).IsUnique();
                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.ExpiresAt);
            });

            // Configuración de TokenBlacklist
            modelBuilder.Entity<TokenBlacklist>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.TokenJti).IsRequired().HasMaxLength(100);
                entity.Property(e => e.ExpiresAt).IsRequired();
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("datetime('now')");
                entity.Property(e => e.UserId).IsRequired();
                
                // Índices
                entity.HasIndex(e => e.TokenJti).IsUnique();
                entity.HasIndex(e => e.ExpiresAt);
                entity.HasIndex(e => e.UserId);
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
            var courseId = new Guid("12345678-1234-5678-9abc-123456789012");
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
            var module1Id = new Guid("22345678-1234-5678-9abc-123456789012");
            var module2Id = new Guid("32345678-1234-5678-9abc-123456789012");
            modelBuilder.Entity<Module>().HasData(
                new Module
                {
                    Id = module1Id,
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
                    Id = module2Id,
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
