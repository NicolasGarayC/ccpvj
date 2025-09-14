using CentroCultural.Domain.Entities;
using Models;
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
        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<Rol> Rol { get; set; }
        public DbSet<Course> Course { get; set; }
        public DbSet<Module> Module { get; set; }
        public DbSet<WorkItem> WorkItem { get; set; }
        public DbSet<MediaEntity> MediaEntity { get; set; }
        public DbSet<UploadStatus> UploadStatus { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<TokenBlacklist> TokenBlacklist { get; set; }
        
        // Blog system entities
        public DbSet<BlogPost> BlogPost { get; set; }
        public DbSet<BlogCategory> BlogCategory { get; set; }
        
        // Event system entities
        public DbSet<Event> Event { get; set; }
        public DbSet<Event> Events { get; set; }
        public DbSet<EventRegistration> EventRegistration { get; set; }

        // Library system entities
        public DbSet<LibraryResource> LibraryResources { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (optionsBuilder.IsConfigured)
            {
                // Enable foreign key constraints for SQLite
                optionsBuilder.UseSqlite(options => options.CommandTimeout(30))
                            .EnableSensitiveDataLogging(false)
                            .EnableServiceProviderCaching()
                            .EnableDetailedErrors();
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure SQLite to enforce foreign key constraints
            modelBuilder.HasAnnotation("Sqlite:CheckConstraints", true);

            // Configuraci�n de Rol
            modelBuilder.Entity<Rol>(entity =>
            {
                entity.HasKey(e => e.IdRol);
                entity.Property(e => e.NombreRol).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Descripcion).HasMaxLength(255);
            });

            // Configuraci�n de Usuario
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
                
                // Propiedades adicionales para compatibilidad
                entity.Property(e => e.EsActivo).HasDefaultValue(true);
                entity.Property(e => e.FechaCreacion).HasDefaultValueSql("datetime('now')");
                entity.Property(e => e.FechaActualizacion);

                // �ndice �nico para nombre de usuario
                entity.HasIndex(e => e.NombreUsuario).IsUnique();

                // Configuraci�n de la relaci�n con Rol
                entity.HasOne(u => u.Rol)
                      .WithMany(r => r.Usuarios)
                      .HasForeignKey(u => u.IdRol)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Configuraci�n de Course
            modelBuilder.Entity<Course>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Description).IsRequired().HasMaxLength(1000);
                entity.Property(e => e.ImagePath).HasMaxLength(500);
                entity.Property(e => e.IsActive).HasDefaultValue(true);
                entity.Property(e => e.IsFeatured).HasDefaultValue(false);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("datetime('now')");

                // Relaci�n con Usuario (Educador)
                entity.HasOne(c => c.Educator)
                      .WithMany()
                      .HasForeignKey(c => c.EducatorId)
                      .OnDelete(DeleteBehavior.Restrict);

                // �ndice para b�squedas
                entity.HasIndex(e => e.Title);
                entity.HasIndex(e => e.IsActive);
                entity.HasIndex(e => e.IsFeatured);
            });

            // Configuraci�n de Module
            modelBuilder.Entity<Module>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Description).HasMaxLength(500);
                entity.Property(e => e.Content).HasColumnType("TEXT");
                entity.Property(e => e.OrderNumber).IsRequired();
                entity.Property(e => e.IsActive).HasDefaultValue(true);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("datetime('now')");

                // Relaci�n con Course
                entity.HasOne(m => m.Course)
                      .WithMany(c => c.Modules)
                      .HasForeignKey(m => m.CourseId)
                      .OnDelete(DeleteBehavior.Cascade);

                // �ndices para b�squedas y ordenamiento
                entity.HasIndex(e => new { e.CourseId, e.OrderNumber });
                entity.HasIndex(e => e.IsActive);
            });

            // Configuración de WorkItem
            modelBuilder.Entity<WorkItem>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Description).HasMaxLength(500);
                entity.Property(e => e.LongText).HasColumnType("TEXT");
                entity.Property(e => e.OrderNumber).IsRequired();
                entity.Property(e => e.IsActive).HasDefaultValue(true);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("datetime('now')");
                entity.Property(e => e.ImagePath).HasMaxLength(500);
                entity.Property(e => e.VideoPath).HasMaxLength(500);

                // Relación con Module
                entity.HasOne(w => w.Module)
                      .WithMany()
                      .HasForeignKey(w => w.ModuleId)
                      .OnDelete(DeleteBehavior.Cascade);

                // Índices para búsquedas y ordenamiento
                entity.HasIndex(e => new { e.ModuleId, e.OrderNumber });
                entity.HasIndex(e => e.IsActive);
            });

            // Configuraci�n de MediaEntity (contextual multimedia)
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
                
                // Contextual multimedia properties
                entity.Property(e => e.ContentType).IsRequired().HasMaxLength(50);
                entity.Property(e => e.ContentId).IsRequired();
                entity.Property(e => e.MediaType).IsRequired().HasMaxLength(50);

                // Serializar el diccionario como JSON
                entity.Property(e => e.Metadata)
                      .HasConversion(
                          v => JsonSerializer.Serialize(v, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }),
                          v => JsonSerializer.Deserialize<Dictionary<string, object>>(v, new JsonSerializerOptions 
                          { 
                              PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                              NumberHandling = JsonNumberHandling.AllowReadingFromString
                          }) ?? new Dictionary<string, object>())
                      .HasColumnType("TEXT");

                // Índices para consultas contextuales
                entity.HasIndex(e => new { e.ContentType, e.ContentId });
                entity.HasIndex(e => e.MediaType);
                entity.HasIndex(e => e.CreatedBy);
            });

            // Configuración de BlogCategory
            modelBuilder.Entity<BlogCategory>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Description).HasMaxLength(500);
                entity.Property(e => e.Color).HasMaxLength(20).HasDefaultValue("#6B7280");
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("datetime('now')");

                // Índice único para el nombre
                entity.HasIndex(e => e.Name).IsUnique();
            });

            // Configuración de BlogPost
            modelBuilder.Entity<BlogPost>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Content).IsRequired().HasColumnType("TEXT");
                entity.Property(e => e.Summary).HasMaxLength(500);
                entity.Property(e => e.Slug).IsRequired().HasMaxLength(200);
                entity.Property(e => e.IsPublished).HasDefaultValue(false);
                entity.Property(e => e.IsFeatured).HasDefaultValue(false);
                entity.Property(e => e.Views).HasDefaultValue(0);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("datetime('now')");
                entity.Property(e => e.FeaturedImagePath).HasMaxLength(500);
                entity.Property(e => e.PdfPath).HasMaxLength(500);
                entity.Property(e => e.VideoPath).HasMaxLength(500);

                // Relación con Usuario (Autor)
                entity.HasOne(p => p.Author)
                      .WithMany()
                      .HasForeignKey(p => p.AuthorId)
                      .OnDelete(DeleteBehavior.Restrict);

                // Relación con BlogCategory
                entity.HasOne(p => p.Category)
                      .WithMany(c => c.BlogPosts)
                      .HasForeignKey(p => p.CategoryId)
                      .OnDelete(DeleteBehavior.SetNull);

                // Índices
                entity.HasIndex(e => e.Slug).IsUnique();
                entity.HasIndex(e => e.IsPublished);
                entity.HasIndex(e => e.IsFeatured);
                entity.HasIndex(e => e.AuthorId);
                entity.HasIndex(e => e.CategoryId);
                entity.HasIndex(e => e.PublishedAt);
                entity.HasIndex(e => e.Views);
            });

            // Configuraci�n de UploadStatus
            modelBuilder.Entity<UploadStatus>(entity =>
            {
                entity.HasKey(e => e.UploadId);
                entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
                entity.Property(e => e.ErrorMessage).HasMaxLength(1000);
                entity.Property(e => e.Progress).HasDefaultValue(0);
                entity.Property(e => e.FileName).IsRequired().HasMaxLength(255);
                entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("datetime('now')");
                
                // �ndices para b�squedas
                entity.HasIndex(e => e.Status);
                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.CreatedAt);
            });

            // Configuraci�n de RefreshToken
            modelBuilder.Entity<RefreshToken>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Token).IsRequired().HasMaxLength(500);
                entity.Property(e => e.ExpiresAt).IsRequired();
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("datetime('now')");
                entity.Property(e => e.IsRevoked).HasDefaultValue(false);
                
                // Relaci�n con Usuario
                entity.HasOne(rt => rt.Usuario)
                      .WithMany()
                      .HasForeignKey(rt => rt.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
                
                // �ndices
                entity.HasIndex(e => e.Token).IsUnique();
                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.ExpiresAt);
            });

            // Configuraci�n de TokenBlacklist
            modelBuilder.Entity<TokenBlacklist>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.TokenJti).IsRequired().HasMaxLength(100);
                entity.Property(e => e.ExpiresAt).IsRequired();
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("datetime('now')");
                entity.Property(e => e.UserId).IsRequired();
                
                // �ndices
                entity.HasIndex(e => e.TokenJti).IsUnique();
                entity.HasIndex(e => e.ExpiresAt);
                entity.HasIndex(e => e.UserId);
            });

            // Configuración de EventRegistration
            modelBuilder.Entity<EventRegistration>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.EventId).IsRequired();
                entity.Property(e => e.UserId).IsRequired();
                entity.Property(e => e.RegistrationDate).IsRequired().HasDefaultValueSql("datetime('now')");
                entity.Property(e => e.Status).IsRequired();
                entity.Property(e => e.Notes).HasMaxLength(500);
                entity.Property(e => e.GuestName).HasMaxLength(100);
                entity.Property(e => e.GuestEmail).HasMaxLength(100);
                entity.Property(e => e.GuestPhone).HasMaxLength(20);
                entity.Property(e => e.IsGuest).HasDefaultValue(false);

                // Relaciones
                entity.HasOne(er => er.Event)
                      .WithMany(e => e.Registrations)
                      .HasForeignKey(er => er.EventId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(er => er.User)
                      .WithMany()
                      .HasForeignKey(er => er.UserId)
                      .OnDelete(DeleteBehavior.Restrict);

                // Índices
                entity.HasIndex(e => e.EventId);
                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.RegistrationDate);
                entity.HasIndex(e => e.Status);
            });

            // Configuración de LibraryResource
            modelBuilder.Entity<LibraryResource>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(500);
                entity.Property(e => e.Description).HasMaxLength(2000);
                entity.Property(e => e.Authors).IsRequired().HasColumnType("TEXT");
                entity.Property(e => e.PublishYear);
                entity.Property(e => e.Category).IsRequired().HasMaxLength(50);
                entity.Property(e => e.MediaType).IsRequired().HasMaxLength(20);
                entity.Property(e => e.FileName).IsRequired().HasMaxLength(255);
                entity.Property(e => e.FilePath).IsRequired().HasMaxLength(500);
                entity.Property(e => e.FileSize).IsRequired();
                entity.Property(e => e.MimeType).IsRequired().HasMaxLength(100);
                entity.Property(e => e.ThumbnailPath).HasMaxLength(500);
                entity.Property(e => e.Downloadable).HasDefaultValue(true);
                entity.Property(e => e.DownloadCount).HasDefaultValue(0);
                entity.Property(e => e.Tags).HasColumnType("TEXT");
                entity.Property(e => e.ISBN).HasMaxLength(50);
                entity.Property(e => e.Duration);
                entity.Property(e => e.Language).IsRequired().HasMaxLength(10).HasDefaultValue("es");
                entity.Property(e => e.UploadedBy).IsRequired();
                entity.Property(e => e.UploadedAt).HasDefaultValueSql("datetime('now')");
                entity.Property(e => e.UpdatedAt);
                entity.Property(e => e.IsActive).HasDefaultValue(true);
                entity.Property(e => e.IsFeatured).HasDefaultValue(false);

                // Relación con Usuario
                entity.HasOne(lr => lr.Uploader)
                      .WithMany()
                      .HasForeignKey("UploadedBy")
                      .HasPrincipalKey("IdUsuario")
                      .OnDelete(DeleteBehavior.Restrict);

                // Índices
                entity.HasIndex(e => e.Name);
                entity.HasIndex(e => e.Category);
                entity.HasIndex(e => e.MediaType);
                entity.HasIndex(e => e.Language);
                entity.HasIndex(e => e.UploadedBy);
                entity.HasIndex(e => e.UploadedAt);
                entity.HasIndex(e => e.IsActive);
                entity.HasIndex(e => e.IsFeatured);
                entity.HasIndex(e => e.Downloadable);
            });

            // Datos semilla para Rol
            modelBuilder.Entity<Rol>().HasData(
                new Rol
                {
                    IdRol = 1,
                    NombreRol = "Asistente",
                    Descripcion = "Rol de asistente del sistema, solo lectura"
                },
                new Rol
                {
                    IdRol = 2,
                    NombreRol = "Colaborador",
                    Descripcion = "Rol de colaborador del sistema, puede crear y editar contenido"
                },
                new Rol
                {
                    IdRol = 3,
                    NombreRol = "Administrador",
                    Descripcion = "Rol de administrador del sistema, acceso completo"
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
                    IdRol = 3
                }
            );

            // Datos semilla para Course
            var courseId = new Guid("12345678-1234-5678-9abc-123456789012");
            modelBuilder.Entity<Course>().HasData(
                new Course
                {
                    Id = courseId,
                    Title = "Introducci�n a la Programaci�n",
                    Description = "Curso b�sico de programaci�n para principiantes",
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
                    Title = "Conceptos B�sicos",
                    Description = "Introducci�n a los conceptos fundamentales de programaci�n",
                    Content = "En este m�dulo aprender�s los conceptos b�sicos de programaci�n...",
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
