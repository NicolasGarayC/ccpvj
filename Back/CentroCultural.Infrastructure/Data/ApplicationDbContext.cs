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
        public DbSet<MaterialApoyo> MaterialApoyo { get; set; }
        public DbSet<Modulo> Modulo { get; set; }
        public DbSet<ModulePost> ModulePosts { get; set; }
        public DbSet<PostElement> PostElements { get; set; }

        // Blog system entities
        public DbSet<BlogPost> BlogPost { get; set; }
        public DbSet<BlogPostElement> BlogPostElement { get; set; }

        // Event system entities
        public DbSet<Event> Event { get; set; }
        public DbSet<Event> Events { get; set; }

        // Blog-Event relationship entities
        public DbSet<BlogPostEvent> BlogPostEvents { get; set; }

        // Library system entities
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
                entity.ToTable("Usuario"); // Mapear a la tabla Usuario
                entity.HasKey(e => e.IdUsuario);
                entity.Property(e => e.NombreUsuario).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Contrasena).IsRequired().HasMaxLength(255);
                // FechaRegistro es NotMapped, no configurar en EF
                entity.Property(e => e.Nombre).HasMaxLength(100);
                entity.Property(e => e.Apellido).HasMaxLength(100);
                entity.Property(e => e.Telefono).HasMaxLength(20);
                entity.Property(e => e.IdRol).IsRequired().HasDefaultValue(3);
                entity.Property(e => e.FechaCreacion).IsRequired();
                entity.Property(e => e.FechaActualizacion);

                // �ndice �nico para nombre de usuario
                entity.HasIndex(e => e.NombreUsuario).IsUnique();

                // Rol will be handled as an integer field, no navigation property
            });

            // Configuración de MaterialApoyo - explicit DbContext mapping
            modelBuilder.Entity<MaterialApoyo>(entity =>
            {
                entity.ToTable("material_apoyo");
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

            // Configuración de Modulo
            modelBuilder.Entity<Modulo>(entity =>
            {
                entity.ToTable("modulo");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.Title).HasColumnName("title").IsRequired().HasMaxLength(200);
                entity.Property(e => e.Description).HasColumnName("description").HasMaxLength(500);
                entity.Property(e => e.OrderNumber).HasColumnName("order_number").IsRequired();
                entity.Property(e => e.IsActive).HasColumnName("is_active").HasDefaultValue(true);
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
                entity.Property(e => e.MaterialApoyoId).HasColumnName("material_apoyo_id").IsRequired();

                // Índices para búsquedas y ordenamiento
                entity.HasIndex(e => new { e.MaterialApoyoId, e.OrderNumber });
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

            // Configuración de Event
            modelBuilder.Entity<Event>(entity =>
            {
                entity.ToTable("Event");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Description).HasMaxLength(1000);
                entity.Property(e => e.EventType).IsRequired().HasMaxLength(50).HasDefaultValue("General");
                entity.Property(e => e.IsActive).HasDefaultValue(true);
                entity.Property(e => e.IsFeatured).HasDefaultValue(false);
                entity.Property(e => e.IsAllDay).HasDefaultValue(false);
                entity.Property(e => e.RequiresRegistration).HasDefaultValue(false);
                entity.Property(e => e.CurrentAttendees).HasDefaultValue(0);
                entity.Property(e => e.IsRecurring).HasDefaultValue(false);
                entity.Property(e => e.RecurrenceInterval).HasDefaultValue(1);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("datetime('now')");
                entity.Property(e => e.ImagePath).HasMaxLength(500);
                entity.Property(e => e.PdfPath).HasMaxLength(500);
                entity.Property(e => e.Location).HasMaxLength(200);
                entity.Property(e => e.RecurrencePattern).HasMaxLength(50);
                entity.Property(e => e.RecurrenceDaysOfWeek).HasMaxLength(100);

                // No navigation properties configured - use manual lookups when needed

                // Índices
                entity.HasIndex(e => e.EventType);
                entity.HasIndex(e => e.IsActive);
                entity.HasIndex(e => e.IsFeatured);
                entity.HasIndex(e => e.StartDateTime);
                entity.HasIndex(e => e.OrganizerId);
                entity.HasIndex(e => e.CreatedAt);
            });

            // Configuración de BlogPost
            modelBuilder.Entity<BlogPost>(entity =>
            {
                entity.ToTable("blog_post");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.Title).HasColumnName("title").IsRequired().HasMaxLength(200);
                entity.Property(e => e.Subtitle).HasColumnName("subtitle").HasMaxLength(500);
                entity.Property(e => e.Slug).HasColumnName("slug").IsRequired().HasMaxLength(200);
                entity.Property(e => e.IsPublished).HasColumnName("is_published").HasDefaultValue(false);
                entity.Property(e => e.IsFeatured).HasColumnName("is_featured").HasDefaultValue(false);
                entity.Property(e => e.Views).HasColumnName("views").HasDefaultValue(0);
                entity.Property(e => e.OrderNumber).HasColumnName("order_number").HasDefaultValue(0);
                entity.Property(e => e.IsActive).HasColumnName("is_active").HasDefaultValue(true);
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
                entity.Property(e => e.PublishedAt).HasColumnName("published_at");
                entity.Property(e => e.AuthorId).HasColumnName("author_id").HasDefaultValue(1);
                entity.Property(e => e.CategoryId).HasColumnName("category_id");
                entity.Property(e => e.Tags).HasColumnName("tags").HasColumnType("TEXT");

                // AuthorId will be handled as an integer field, no navigation property configured

                // Relación con BlogPostElement
                entity.HasMany(p => p.Elements)
                      .WithOne(e => e.BlogPost)
                      .HasForeignKey(e => e.BlogPostId)
                      .OnDelete(DeleteBehavior.Cascade);

                // Índices
                entity.HasIndex(e => e.Slug).IsUnique();
                entity.HasIndex(e => e.IsPublished);
                entity.HasIndex(e => e.IsFeatured);
                entity.HasIndex(e => e.AuthorId);
                entity.HasIndex(e => e.PublishedAt);
                entity.HasIndex(e => e.Views);
                entity.HasIndex(e => e.CreatedAt);
            });

            // Configuración de BlogPostElement
            modelBuilder.Entity<BlogPostElement>(entity =>
            {
                entity.ToTable("blog_post_element");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.BlogPostId).HasColumnName("blog_post_id");
                entity.Property(e => e.ElementType).HasColumnName("element_type").IsRequired().HasMaxLength(50);
                entity.Property(e => e.Content).HasColumnName("content").HasColumnType("TEXT");
                entity.Property(e => e.FilePath).HasColumnName("file_path").HasMaxLength(500);
                entity.Property(e => e.FileName).HasColumnName("file_name").HasMaxLength(255);
                entity.Property(e => e.FileSize).HasColumnName("file_size");
                entity.Property(e => e.MimeType).HasColumnName("mime_type").HasMaxLength(100);
                entity.Property(e => e.Metadata).HasColumnName("metadata").HasColumnType("TEXT");
                entity.Property(e => e.OrderNumber).HasColumnName("order_number").HasDefaultValue(0);
                entity.Property(e => e.IsActive).HasColumnName("is_active").HasDefaultValue(true);
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

                // Índices
                entity.HasIndex(e => new { e.BlogPostId, e.OrderNumber });
                entity.HasIndex(e => e.ElementType);
                entity.HasIndex(e => e.IsActive);
                entity.HasIndex(e => e.CreatedAt);
            });

            // Configuración de BlogPostEvent (relación N:M entre BlogPost y Event)
            modelBuilder.Entity<BlogPostEvent>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.BlogPostId).IsRequired();
                entity.Property(e => e.EventId).IsRequired();
                entity.Property(e => e.RelationType).IsRequired().HasMaxLength(50).HasDefaultValue("Related");
                entity.Property(e => e.RelationDescription).HasMaxLength(500);
                entity.Property(e => e.DisplayOrder).HasDefaultValue(0);
                entity.Property(e => e.IsActive).HasDefaultValue(true);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("datetime('now')");
                entity.Property(e => e.CreatedBy).IsRequired();

                // Configurar relaciones FK
                entity.HasOne(bpe => bpe.BlogPost)
                      .WithMany(bp => bp.EventRelations)
                      .HasForeignKey(bpe => bpe.BlogPostId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(bpe => bpe.Event)
                      .WithMany() // No navigation property on Event side
                      .HasForeignKey(bpe => bpe.EventId)
                      .OnDelete(DeleteBehavior.Cascade);

                // CreatedBy will be handled as a field, no navigation property configured

                // Índices para optimizar consultas
                entity.HasIndex(e => e.BlogPostId);
                entity.HasIndex(e => e.EventId);
                entity.HasIndex(e => new { e.BlogPostId, e.EventId }).IsUnique(); // Evitar duplicados
                entity.HasIndex(e => e.RelationType);
                entity.HasIndex(e => e.IsActive);
                entity.HasIndex(e => e.CreatedAt);
                entity.HasIndex(e => e.DisplayOrder);
            });

            // LibraryResource configuration removed - using LibraryItem instead

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
