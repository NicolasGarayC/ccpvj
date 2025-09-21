// Script para generar la contraseña encriptada
const ENCRYPTION_KEY = 'CENTRO_CULTURAL_PVJ_2024';

function simpleEncrypt(text) {
    try {
        let result = '';
        // Aplicar XOR directamente a cada carácter
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
            result += String.fromCharCode(charCode);
        }
        // Convertir a Base64
        return Buffer.from(result).toString('base64');
    } catch (error) {
        console.error('Error encrypting:', error);
        return Buffer.from(text).toString('base64'); // Fallback a base64 simple
    }
}

const password = "admin123";
const encryptedPassword = simpleEncrypt(password);

console.log(`Original password: ${password}`);
console.log(`Encrypted password: ${encryptedPassword}`);