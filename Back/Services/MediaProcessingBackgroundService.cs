using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;

namespace Back.Services
{
    public class MediaProcessingBackgroundService : BackgroundService
    {
        protected override Task ExecuteAsync(CancellationToken stoppingToken)
        {
            // Implementación mínima para compilación
            return Task.CompletedTask;
        }
    }
}
