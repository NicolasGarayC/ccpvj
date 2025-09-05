using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using CentroCultural.Infrastructure.Data;

namespace CentroCultural.Infrastructure.Configuration
{
    public static class InfrastructureServiceRegistration
    {
        public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, string connectionString)
        {
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlite(connectionString));
            
            // services.AddScoped<IEmailService, EmailService>();
            
            return services;
        }
    }
}