using Microsoft.Extensions.DependencyInjection;
using CentroCultural.Application.Interfaces;
using CentroCultural.Application.Services;

namespace CentroCultural.Application.Configuration
{
    public static class ApplicationServiceRegistration
    {
        public static IServiceCollection AddApplicationServices(this IServiceCollection services)
        {
            // Registro de servicios de aplicación
            services.AddScoped<IMediaService, MediaService>();
            
            // Aquí puedes agregar otros servicios de aplicación
            // services.AddScoped<ICourseService, CourseService>();
            // services.AddScoped<IAuthService, AuthService>();
            
            return services;
        }
    }
}