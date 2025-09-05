using Microsoft.Extensions.DependencyInjection;
using CentroCultural.Application.Interfaces;
using CentroCultural.Application.Services;

namespace CentroCultural.Application.Configuration
{
    public static class ApplicationServiceRegistration
    {
        public static IServiceCollection AddApplicationServices(this IServiceCollection services)
        {
            services.AddScoped<IMediaService, MediaService>();
            services.AddScoped<IAuthService, AuthService>();
            
            return services;
        }
    }
}