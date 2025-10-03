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
            services.AddScoped<IBlogPostElementService, BlogPostElementService>();
            services.AddScoped<IMaterialApoyoService, MaterialApoyoService>();
            services.AddScoped<IPostElementService, PostElementService>();
            services.AddScoped<IDigitalLibraryService, DigitalLibraryService>();
            services.AddScoped<ICalendarService, CalendarService>();
            services.AddScoped<IAnalyticsService, AnalyticsService>();

            return services;
        }
    }
}