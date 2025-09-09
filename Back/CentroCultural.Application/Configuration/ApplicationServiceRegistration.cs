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
            services.AddScoped<IWorkItemService, WorkItemService>();
            services.AddScoped<IBlogService, BlogService>();
            services.AddScoped<ICourseService, CourseService>();
            services.AddScoped<ICalendarService, CalendarService>();
            services.AddScoped<IEventService, EventService>();
            services.AddScoped<IUserManagementService, UserManagementService>();
            
            return services;
        }
    }
}