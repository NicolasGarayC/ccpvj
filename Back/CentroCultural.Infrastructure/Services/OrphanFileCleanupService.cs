using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace CentroCultural.Infrastructure.Services
{
    /// <summary>
    /// Background service that periodically cleans up orphan temporary files
    /// </summary>
    public class OrphanFileCleanupService : BackgroundService
    {
        private readonly ILogger<OrphanFileCleanupService> _logger;
        private readonly TimeSpan _cleanupInterval = TimeSpan.FromHours(1);
        private readonly TimeSpan _tempFileMaxAge = TimeSpan.FromHours(24);

        public OrphanFileCleanupService(ILogger<OrphanFileCleanupService> logger)
        {
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("OrphanFileCleanupService started. Will run every {Interval}", _cleanupInterval);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await Task.Delay(_cleanupInterval, stoppingToken);

                    if (stoppingToken.IsCancellationRequested)
                        break;

                    _logger.LogInformation("Starting orphan file cleanup task");
                    CleanupOldTempFiles();
                }
                catch (OperationCanceledException)
                {
                    // Expected when stopping
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error during orphan file cleanup");
                }
            }

            _logger.LogInformation("OrphanFileCleanupService stopped");
        }

        private void CleanupOldTempFiles()
        {
            int deletedFiles = 0;
            int deletedDirs = 0;

            try
            {
                var mediaPath = Path.Combine("Data", "media", "content");

                if (!Directory.Exists(mediaPath))
                {
                    _logger.LogWarning("Media content directory does not exist: {MediaPath}", mediaPath);
                    return;
                }

                // Find all 'temp' directories recursively
                var tempDirs = Directory.GetDirectories(mediaPath, "temp", SearchOption.AllDirectories);

                _logger.LogInformation("Found {Count} temp directories to check", tempDirs.Length);

                foreach (var tempDir in tempDirs)
                {
                    try
                    {
                        var dirInfo = new DirectoryInfo(tempDir);

                        // Check if directory is older than max age
                        if (dirInfo.LastWriteTimeUtc < DateTime.UtcNow - _tempFileMaxAge)
                        {
                            // Delete all files in temp directory
                            var files = Directory.GetFiles(tempDir, "*", SearchOption.AllDirectories);
                            foreach (var file in files)
                            {
                                try
                                {
                                    File.Delete(file);
                                    deletedFiles++;
                                    _logger.LogInformation("Deleted old temp file: {FilePath}", file);
                                }
                                catch (Exception ex)
                                {
                                    _logger.LogWarning(ex, "Could not delete file: {FilePath}", file);
                                }
                            }

                            // Delete the temp directory itself
                            try
                            {
                                Directory.Delete(tempDir, recursive: true);
                                deletedDirs++;
                                _logger.LogInformation("Deleted old temp directory: {DirectoryPath}", tempDir);
                            }
                            catch (Exception ex)
                            {
                                _logger.LogWarning(ex, "Could not delete directory: {DirectoryPath}", tempDir);
                            }
                        }
                        else
                        {
                            _logger.LogDebug("Temp directory is still fresh: {DirectoryPath} (Last write: {LastWrite})",
                                tempDir, dirInfo.LastWriteTimeUtc);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error processing temp directory: {DirectoryPath}", tempDir);
                    }
                }

                if (deletedFiles > 0 || deletedDirs > 0)
                {
                    _logger.LogInformation("Cleanup completed: Deleted {FileCount} files and {DirCount} directories",
                        deletedFiles, deletedDirs);
                }
                else
                {
                    _logger.LogInformation("Cleanup completed: No old temp files found");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during temp files cleanup");
            }
        }
    }
}
