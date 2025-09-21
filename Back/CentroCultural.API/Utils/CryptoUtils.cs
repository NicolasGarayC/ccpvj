using System.Text;

namespace CentroCultural.API.Utils
{
    public static class CryptoUtils
    {
        private const string ENCRYPTION_KEY = "CENTRO_CULTURAL_PVJ_2024";

        public static string SimpleEncrypt(string text)
        {
            try
            {
                var result = new StringBuilder();
                // Aplicar XOR directamente a cada carácter
                for (int i = 0; i < text.Length; i++)
                {
                    var charCode = text[i] ^ ENCRYPTION_KEY[i % ENCRYPTION_KEY.Length];
                    result.Append((char)charCode);
                }
                // Convertir a Base64
                return Convert.ToBase64String(Encoding.UTF8.GetBytes(result.ToString()));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error encrypting: {ex.Message}");
                return Convert.ToBase64String(Encoding.UTF8.GetBytes(text)); // Fallback a base64 simple
            }
        }

        public static string SimpleDecrypt(string encryptedText)
        {
            try
            {
                // Decodificar de Base64
                var decoded = Encoding.UTF8.GetString(Convert.FromBase64String(encryptedText));
                var result = new StringBuilder();

                // Aplicar XOR inverso
                for (int i = 0; i < decoded.Length; i++)
                {
                    var charCode = decoded[i] ^ ENCRYPTION_KEY[i % ENCRYPTION_KEY.Length];
                    result.Append((char)charCode);
                }

                return result.ToString();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error decrypting: {ex.Message}");
                try
                {
                    // Fallback a base64 simple
                    return Encoding.UTF8.GetString(Convert.FromBase64String(encryptedText));
                }
                catch
                {
                    // Si todo falla, devolver texto original
                    return encryptedText;
                }
            }
        }

        public static (string username, string password) DecryptCredentials(string encryptedUsername, string encryptedPassword)
        {
            var username = SimpleDecrypt(encryptedUsername);
            var password = SimpleDecrypt(encryptedPassword);

            return (username, password);
        }
    }
}