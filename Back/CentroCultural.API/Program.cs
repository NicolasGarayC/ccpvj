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

// CORS - Update to allow SvelteKit
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSvelteKit", policy =>
    {
        policy.WithOrigins("http://localhost:5173") // SvelteKit dev server
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

// JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings").Get<CentroCultural.Infrastructure.Configuration.JwtSettings>();
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

// Servicios de biblioteca
builder.Services.AddScoped<CentroCultural.Application.Services.ILibraryService, CentroCultural.Application.Services.LibraryService>();
builder.Services.AddScoped<CentroCultural.Application.Services.IFileStorageService, CentroCultural.Infrastructure.Services.FileStorageService>();

// Configuración de archivos grandes
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 500_000_000;
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Ensure database is created and configure foreign keys
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    context.Database.EnsureCreated();

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