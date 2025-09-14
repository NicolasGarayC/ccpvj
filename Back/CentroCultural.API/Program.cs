using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.EntityFrameworkCore;
using System.Text;
using CentroCultural.Infrastructure.Configuration;
using CentroCultural.Infrastructure.Middleware;
using CentroCultural.Infrastructure.Services;
using CentroCultural.Infrastructure.Data;
using CentroCultural.Application.Interfaces;
using CentroCultural.Application.Configuration;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Configuraci�n por capas
builder.Services.AddInfrastructureServices(
    builder.Configuration.GetConnectionString("DefaultConnection") ?? "");
builder.Services.AddApplicationServices();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configuraci�n JWT
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("JwtSettings"));

// Servicios JWT espec�ficos (no est�n en las capas)
builder.Services.AddScoped<IJwtService, JwtService>();

// Servicios de biblioteca
builder.Services.AddScoped<CentroCultural.Application.Services.ILibraryService, CentroCultural.Application.Services.LibraryService>();
builder.Services.AddScoped<CentroCultural.Application.Services.IFileStorageService, CentroCultural.Infrastructure.Services.FileStorageService>();

// Servicio de limpieza en background
builder.Services.AddHostedService<TokenCleanupService>();

// Configuraci�n JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>();

if (jwtSettings == null)
    throw new InvalidOperationException("JwtSettings configuration is missing");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidAudience = jwtSettings.Audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.SecretKey)),
        ClockSkew = TimeSpan.Zero
    };
});

// Configuraci�n de archivos grandes
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
app.UseCors("AllowAngular");
app.UseAuthentication();
app.UseMiddleware<TokenBlacklistMiddleware>();
app.UseAuthorization();
app.MapControllers();

app.Run();

// Necesario para pruebas de integraci�n
public partial class Program { }
