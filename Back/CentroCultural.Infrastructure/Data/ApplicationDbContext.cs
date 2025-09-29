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
        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<Course> Course { get; set; }
        public DbSet<Module> Module { get; set; }
        public DbSet<ModulePost> ModulePosts { get; set; }
        public DbSet<PostElement> PostElements { get; set; }
        public DbSet<MediaEntity> MediaEntity { get; set; }
        public DbSet<UploadStatus> UploadStatus { get; set; }
        
        // Blog system entities
        public DbSet<BlogPost> BlogPost { get; set; }
        public DbSet<BlogCategory> BlogCategory { get; set; }
        
        // Event system entities
        public DbSet<Event> Event { get; set; }
        public DbSet<Event> Events { get; set; }
        public DbSet<EventRegistration> EventRegistration { get; set; }

        // Library system entities
        public DbSet<LibraryResource> LibraryResources { get; set; }
        public DbSet<LibraryItem> LibraryItems { get; set; }
        public DbSet<LibraryCollection> LibraryCollections { get; set; }
        public DbSet<LibraryItemCollection> LibraryItemCollections { get; set; }

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
                entity.ToTable("user"); // Mapear a la tabla user existente
                entity.HasKey(e => e.IdUsuario);
                entity.Property(e => e.NombreUsuario).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Contrasena).IsRequired().HasMaxLength(255);
                // FechaRegistro es NotMapped, no configurar en EF
                entity.Property(e => e.Nombre).HasMaxLength(100);
                entity.Property(e => e.Apellido).HasMaxLength(100);
                entity.Property(e => e.Telefono).HasMaxLength(20);
                entity.Property(e => e.RoleString).IsRequired().HasMaxLength(50);
                
                // Propiedades de fecha son NotMapped, no configurar en EF

                // �ndice �nico para nombre de usuario
                entity.HasIndex(e => e.NombreUsuario).IsUnique();

                // Rol se maneja como string, no como relaci�n FK
            });

            // Configuración de Course - explicit DbContext mapping
            modelBuilder.Entity<Course>(entity =>
            {
                entity.ToTable("course");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.Title).HasColumnName("title").IsRequired().HasMaxLength(200);
                entity.Property(e => e.Description).HasColumnName("description").IsRequired().HasMaxLength(1000);
                entity.Property(e => e.ImagePath).HasColumnName("image_path").HasMaxLength(500);
                entity.Property(e => e.IsActive).HasColumnName("is_active");
                entity.Property(e => e.IsFeatured).HasColumnName("is_featured");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
                entity.Property(e => e.EducatorId).HasColumnName("educator_id").IsRequired();
            });

            // Configuraci�n de Module
            modelBuilder.Entity<Module>(entity =>
            {
                entity.ToTable("module");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.Title).HasColumnName("title").IsRequired().HasMaxLength(200);
                entity.Property(e => e.Description).HasColumnName("description").HasMaxLength(500);
                entity.Property(e => e.OrderNumber).HasColumnName("order_number").IsRequired();
                entity.Property(e => e.IsActive).HasColumnName("is_active").HasDefaultValue(true);
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
                entity.Property(e => e.CourseId).HasColumnName("course_id").IsRequired();

                // �ndices para b�squedas y ordenamiento
                entity.HasIndex(e => new { e.CourseId, e.OrderNumber });
                entity.HasIndex(e => e.IsActive);
            });

            // Configuración de ModulePost
            modelBuilder.Entity<ModulePost>(entity =>
            {
                entity.ToTable("module_post"); // Explicitly specify table name
                entity.HasKey(e => e.Id);

                // No configure foreign keys explicitly - let the database handle them
                // The table already has the foreign key constraints defined

                // Índices para búsquedas y ordenamiento
                entity.HasIndex(e => new { e.ModuleId, e.OrderNumber });
                entity.HasIndex(e => e.IsActive);
                entity.HasIndex(e => e.AuthorId);
                entity.HasIndex(e => e.CreatedAt);
            });

            // Configuración de PostElement
            modelBuilder.Entity<PostElement>(entity =>
            {
                entity.ToTable("post_element");
                entity.HasKey(e => e.Id);

                // Configure foreign key relationship
                entity.HasOne(pe => pe.Post)
                      .WithMany()
                      .HasForeignKey(pe => pe.PostId)
                      .OnDelete(DeleteBehavior.Cascade);

                // Índices para búsquedas y ordenamiento
                entity.HasIndex(e => new { e.PostId, e.OrderNumber });
                entity.HasIndex(e => e.ElementType);
                entity.HasIndex(e => e.IsActive);
                entity.HasIndex(e => e.CreatedAt);
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

            // Configuración de LibraryItem (nueva biblioteca mejorada)
            modelBuilder.Entity<LibraryItem>(entity =>
            {
                entity.ToTable("library_item");
                entity.HasKey(e => e.Id);

                // Configurar propiedades con validaciones
                entity.Property(e => e.Title).IsRequired().HasMaxLength(500);
                entity.Property(e => e.Description).HasMaxLength(2000);
                entity.Property(e => e.Author).HasMaxLength(200);
                entity.Property(e => e.UploadedBy).IsRequired().HasMaxLength(100);
                entity.Property(e => e.FileType).IsRequired().HasMaxLength(20);
                entity.Property(e => e.FilePath).IsRequired().HasMaxLength(1000);
                entity.Property(e => e.FileName).IsRequired().HasMaxLength(500);
                entity.Property(e => e.MimeType).HasMaxLength(100);
                entity.Property(e => e.Tags).HasMaxLength(1000);
                entity.Property(e => e.Language).HasMaxLength(10);
                entity.Property(e => e.Category).HasMaxLength(100);
                entity.Property(e => e.Subcategory).HasMaxLength(100);

                // Valores por defecto
                entity.Property(e => e.DownloadCount).HasDefaultValue(0);
                entity.Property(e => e.ViewCount).HasDefaultValue(0);
                entity.Property(e => e.IsActive).HasDefaultValue(true);
                entity.Property(e => e.IsFeatured).HasDefaultValue(false);

                // Índices para filtros y búsqueda
                entity.HasIndex(e => e.Title);
                entity.HasIndex(e => e.Author);
                entity.HasIndex(e => e.FileType);
                entity.HasIndex(e => e.Category);
                entity.HasIndex(e => e.Subcategory);
                entity.HasIndex(e => e.Language);
                entity.HasIndex(e => e.Year);
                entity.HasIndex(e => e.IsActive);
                entity.HasIndex(e => e.IsFeatured);
                entity.HasIndex(e => e.CreatedAt);
                entity.HasIndex(e => e.UploadedBy);
                entity.HasIndex(e => e.DownloadCount);
                entity.HasIndex(e => e.ViewCount);
            });

            // Configuración de LibraryCollection
            modelBuilder.Entity<LibraryCollection>(entity =>
            {
                entity.ToTable("library_collection");
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Description).HasMaxLength(1000);
                entity.Property(e => e.CoverImage).HasMaxLength(500);
                entity.Property(e => e.ColorTheme).HasMaxLength(7);
                entity.Property(e => e.CreatedBy).IsRequired().HasMaxLength(100);

                // Valores por defecto
                entity.Property(e => e.OrderNumber).HasDefaultValue(0);
                entity.Property(e => e.IsActive).HasDefaultValue(true);
                entity.Property(e => e.IsFeatured).HasDefaultValue(false);

                // Índices
                entity.HasIndex(e => e.Name);
                entity.HasIndex(e => e.OrderNumber);
                entity.HasIndex(e => e.IsActive);
                entity.HasIndex(e => e.IsFeatured);
                entity.HasIndex(e => e.CreatedBy);
                entity.HasIndex(e => e.CreatedAt);
            });

            // Configuración de LibraryItemCollection (relación many-to-many)
            modelBuilder.Entity<LibraryItemCollection>(entity =>
            {
                entity.ToTable("library_item_collection");
                entity.HasKey(e => e.Id);

                entity.Property(e => e.LibraryItemId).IsRequired();
                entity.Property(e => e.LibraryCollectionId).IsRequired();
                entity.Property(e => e.AddedBy).HasMaxLength(100);

                // Valores por defecto
                entity.Property(e => e.OrderNumber).HasDefaultValue(0);

                // Configurar relaciones
                entity.HasOne(lic => lic.LibraryItem)
                      .WithMany(li => li.ItemCollections)
                      .HasForeignKey(lic => lic.LibraryItemId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(lic => lic.LibraryCollection)
                      .WithMany(lc => lc.ItemCollections)
                      .HasForeignKey(lic => lic.LibraryCollectionId)
                      .OnDelete(DeleteBehavior.Cascade);

                // Índices
                entity.HasIndex(e => e.LibraryItemId);
                entity.HasIndex(e => e.LibraryCollectionId);
                entity.HasIndex(e => new { e.LibraryItemId, e.LibraryCollectionId }).IsUnique();
                entity.HasIndex(e => e.OrderNumber);
                entity.HasIndex(e => e.AddedAt);
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

            // Datos semilla para Usuario - user already exists in database

            // Datos semilla para Course - DISABLED for now to fix compilation
            /*var courseId = new Guid("12345678-1234-5678-9abc-123456789012");
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
            );*/
        }
    }
}
