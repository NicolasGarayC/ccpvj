using Microsoft.EntityFrameworkCore;
using CentroCultural.Infrastructure.Configuration;
using CentroCultural.Infrastructure.Data;
using CentroCultural.Application.Configuration;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using CentroCultural.Infrastructure.Services;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

// Allow overriding the HTTP port via ASPNETCORE_URLS or --urls without crashing on conflicts
var urlsFromEnv = builder.Configuration["ASPNETCORE_URLS"] ?? builder.Configuration["urls"];
if (!string.IsNullOrWhiteSpace(urlsFromEnv))
{
    builder.WebHost.UseUrls(urlsFromEnv.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
}

// Add services to the container.
builder.Services.AddControllers();

// Resolve SQLite connection string to an absolute path regardless of the working directory
string ResolveSqliteConnectionString(string? rawConnectionString, string contentRootPath)
{
    if (string.IsNullOrWhiteSpace(rawConnectionString))
    {
        throw new InvalidOperationException("DefaultConnection string is missing or empty.");
    }

    static string? ResolveSqlitePath(string relativePath, string contentRoot)
    {
        if (Path.IsPathRooted(relativePath))
        {
            return relativePath;
        }

        // Candidate roots to try
        var candidateRoots = new[]
        {
            contentRoot,
            AppContext.BaseDirectory,
            Directory.GetCurrentDirectory(),
            Path.Combine(contentRoot, ".."), // solution root when running from Back/
            Path.Combine(AppContext.BaseDirectory, "..", "..") // when executed from bin/Debug/net8.0
        };

        foreach (var root in candidateRoots)
        {
            if (string.IsNullOrWhiteSpace(root))
                continue;

            var candidate = Path.GetFullPath(Path.Combine(root, relativePath));
            if (File.Exists(candidate))
            {
                return candidate;
            }
        }

        // Fallback: resolve relative to content root even if file doesn't exist yet
        return Path.GetFullPath(Path.Combine(contentRoot, relativePath));
    }

    const string dataSourceKey = "Data Source=";
    var parts = rawConnectionString.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
    for (int i = 0; i < parts.Length; i++)
    {
        if (parts[i].StartsWith(dataSourceKey, StringComparison.OrdinalIgnoreCase))
        {
            var relativePath = parts[i].Substring(dataSourceKey.Length).Trim();
            var resolvedPath = ResolveSqlitePath(relativePath, contentRootPath);
            if (!string.IsNullOrWhiteSpace(resolvedPath))
            {
                parts[i] = $"{dataSourceKey}{resolvedPath}";
            }
            break;
        }
    }

    return string.Join(';', parts);
}

var resolvedConnectionString = ResolveSqliteConnectionString(
    builder.Configuration.GetConnectionString("DefaultConnection"),
    builder.Environment.ContentRootPath);

// Update configuration so services reading it later get the resolved version
builder.Configuration["ConnectionStrings:DefaultConnection"] = resolvedConnectionString;
Console.WriteLine($"[Startup] SQLite connection resolved to: {resolvedConnectionString}");

// Configuración por capas
builder.Services.AddInfrastructureServices(resolvedConnectionString);
builder.Services.AddApplicationServices();

// CORS - allow SvelteKit dev servers on loopback (localhost / 127.0.0.1) and common ports
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSvelteKit", policy =>
    {
        policy.SetIsOriginAllowed(origin =>
                Uri.TryCreate(origin, UriKind.Absolute, out var uri) && uri.IsLoopback)
              .WithMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// JWT Configuration
builder.Services.Configure<CentroCultural.Infrastructure.Configuration.JwtSettings>(
    builder.Configuration.GetSection("JwtSettings"));

// JWT Service
builder.Services.AddScoped<IJwtService, JwtService>();

// Background Services
builder.Services.AddHostedService<CentroCultural.Infrastructure.Services.OrphanFileCleanupService>();

// JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings").Get<CentroCultural.Infrastructure.Configuration.JwtSettings>();
if (jwtSettings == null)
    throw new InvalidOperationException("JwtSettings configuration is missing");
var key = Encoding.UTF8.GetBytes(jwtSettings.SecretKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = jwtSettings.ValidateIssuerSigningKey,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = jwtSettings.ValidateIssuer,
        ValidIssuer = jwtSettings.Issuer,
        ValidateAudience = jwtSettings.ValidateAudience,
        ValidAudience = jwtSettings.Audience,
        ValidateLifetime = jwtSettings.ValidateLifetime,
        ClockSkew = TimeSpan.FromMinutes(jwtSettings.ClockSkewMinutes)
    };
});

builder.Services.AddAuthorization();

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// File storage services removed - using direct upload APIs instead

// Configuración de archivos grandes (hasta 20GB para películas completas)
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 21_474_836_480; // 20GB
    options.ValueLengthLimit = int.MaxValue;
    options.ValueCountLimit = int.MaxValue;
    options.KeyLengthLimit = int.MaxValue;
    options.MultipartHeadersLengthLimit = int.MaxValue;
});

// Configurar Kestrel para archivos grandes
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 21_474_836_480; // 20GB
    options.Limits.RequestHeadersTimeout = TimeSpan.FromMinutes(60);
    options.Limits.KeepAliveTimeout = TimeSpan.FromMinutes(60);
});

var enableHttpsRedirection = builder.Configuration.GetValue("EnableHttpsRedirection", false);

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Configure foreign keys for SQLite (database already exists)
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    // NOTE: Database already exists - do not recreate to preserve existing structure
    // context.Database.EnsureCreated(); // COMMENTED OUT to preserve existing database

    // Enable foreign key constraints for SQLite
    context.Database.ExecuteSqlRaw("PRAGMA foreign_keys = ON");
}

if (enableHttpsRedirection)
{
    app.UseHttpsRedirection();
}
else
{
    app.Logger.LogDebug("HTTPS redirection disabled (EnableHttpsRedirection=false).");
}

var webRootPath = Path.Combine(app.Environment.ContentRootPath, "wwwroot");
if (Directory.Exists(webRootPath))
{
    app.Logger.LogDebug("Serving static assets from {WebRootPath}", webRootPath);
    app.UseStaticFiles(); // Para servir archivos estáticos del frontend legacy
}
else
{
    app.Logger.LogDebug("Skipping static files middleware because directory was not found at {WebRootPath}", webRootPath);
}

var mediaRootPath = Path.Combine(app.Environment.ContentRootPath, "Data", "media");
if (Directory.Exists(mediaRootPath))
{
    app.Logger.LogDebug("Serving media files from {MediaRootPath}", mediaRootPath);
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(mediaRootPath),
        RequestPath = "/media",
        ServeUnknownFileTypes = true
    });
}
else
{
    app.Logger.LogWarning("Media directory not found at {MediaRootPath}. Uploads will not be served.", mediaRootPath);
}
app.UseCors("AllowSvelteKit");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

// Necesario para pruebas de integración
public partial class Program { }
