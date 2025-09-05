using CentroCultural.Application.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace CentroCultural.Infrastructure.Services
{
    public class TokenCleanupService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly TimeSpan _cleanupInterval = TimeSpan.FromHours(24); // Limpieza cada 24 horas

        public TokenCleanupService(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var jwtService = scope.ServiceProvider.GetRequiredService<IJwtService>();
                    await jwtService.CleanupExpiredTokensAsync();
                }
                catch (Exception ex)
                {
                    // Log error here
                    Console.WriteLine($"Error during token cleanup: {ex.Message}");
                }

                await Task.Delay(_cleanupInterval, stoppingToken);
            }
        }
    }
}