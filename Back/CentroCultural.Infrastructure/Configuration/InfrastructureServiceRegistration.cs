using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using CentroCultural.Infrastructure.Data;

namespace CentroCultural.Infrastructure.Configuration
{
    public static class InfrastructureServiceRegistration
    {
        public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, string connectionString)
        {
            // Registro del contexto de base de datos
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlite(connectionString));
            
            // Aquí puedes agregar otros servicios de infraestructura
            // services.AddScoped<IUserRepository, UserRepository>();
            // services.AddScoped<IEmailService, EmailService>();
            
            return services;
        }
    }
}