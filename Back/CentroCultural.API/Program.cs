using Microsoft.EntityFrameworkCore;
using CentroCultural.Infrastructure.Configuration;
using CentroCultural.Infrastructure.Data;
using CentroCultural.Application.Interfaces;
using CentroCultural.Application.Configuration;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using CentroCultural.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Configuración por capas
builder.Services.AddInfrastructureServices(
    builder.Configuration.GetConnectionString("DefaultConnection") ?? "");
builder.Services.AddApplicationServices();

// CORS - Update to allow SvelteKit on multiple ports
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSvelteKit", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",
                "http://localhost:5174",
                "http://localhost:5175",
                "http://localhost:5176"
              ) // SvelteKit dev server - multiple ports
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials(); // Important for cookies
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

app.UseHttpsRedirection();
app.UseStaticFiles(); // Para servir archivos estáticos
app.UseCors("AllowSvelteKit");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

// Necesario para pruebas de integración
public partial class Program { }