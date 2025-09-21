using Microsoft.Extensions.DependencyInjection;
using CentroCultural.Application.Interfaces;
using CentroCultural.Application.Services;

namespace CentroCultural.Application.Configuration
{
    public static class ApplicationServiceRegistration
    {
        public static IServiceCollection AddApplicationServices(this IServiceCollection services)
        {
            services.AddScoped<IBlogService, BlogService>();
            services.AddScoped<ICourseService, CourseService>();
            // services.AddScoped<ICalendarService, CalendarService>(); // Temporarily disabled - type conflicts
            // services.AddScoped<IEventService, EventService>(); // Temporarily disabled - type conflicts
            services.AddScoped<IUserManagementService, UserManagementService>();

            return services;
        }
    }
}