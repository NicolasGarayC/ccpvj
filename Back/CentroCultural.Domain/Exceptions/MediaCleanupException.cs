using System;

namespace CentroCultural.Domain.Exceptions
{
    /// <summary>
    /// Exception thrown when media cleanup operations fail
    /// </summary>
    public class MediaCleanupException : Exception
    {
        public string? FilePath { get; }
        public int? ProcessedFiles { get; }

        public MediaCleanupException() : base("Error durante la limpieza de archivos temporales")
        {
        }

        public MediaCleanupException(string message) : base(message)
        {
        }

        public MediaCleanupException(string message, Exception innerException) : base(message, innerException)
        {
        }

        public MediaCleanupException(string filePath, string message) : base(message)
        {
            FilePath = filePath;
        }

        public MediaCleanupException(string filePath, string message, Exception innerException) : base(message, innerException)
        {
            FilePath = filePath;
        }

        public MediaCleanupException(string filePath, int processedFiles, string message, Exception innerException) : base(message, innerException)
        {
            FilePath = filePath;
            ProcessedFiles = processedFiles;
        }
    }
}