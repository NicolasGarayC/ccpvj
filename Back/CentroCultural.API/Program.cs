using Microsoft.EntityFrameworkCore;
using CentroCultural.Infrastructure.Configuration;
using CentroCultural.Infrastructure.Data;
using CentroCultural.Application.Interfaces;
using CentroCultural.Application.Configuration;
using Microsoft.AspNetCore.Authentication.Cookies;

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

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Cookie Authentication (replacing JWT)
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/api/simple-auth/login";
        options.LogoutPath = "/api/simple-auth/logout";
        options.Cookie.Name = "auth-session";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
        options.ExpireTimeSpan = TimeSpan.FromDays(7);
        options.SlidingExpiration = true;

        // Return 401 instead of redirect for API calls
        options.Events.OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = 401;
            return Task.CompletedTask;
        };
        options.Events.OnRedirectToAccessDenied = context =>
        {
            context.Response.StatusCode = 403;
            return Task.CompletedTask;
        };
    });

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
app.UseAuthentication(); // Cookie authentication
app.UseAuthorization();
app.MapControllers();

app.Run();

// Necesario para pruebas de integración
public partial class Program { }