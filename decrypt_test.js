// Script para descifrar el payload y ver qué contiene
const ENCRYPTION_KEY = 'CENTRO_CULTURAL_PVJ_2024';

function simpleDecrypt(encryptedText) {
    try {
        // Decodificar de Base64
        const decoded = Buffer.from(encryptedText, 'base64').toString('utf8');
        let result = '';

        // Aplicar XOR inverso
        for (let i = 0; i < decoded.length; i++) {
            const charCode = decoded.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
            result += String.fromCharCode(charCode);
        }

        return result;
    } catch (error) {
        console.error('Error decrypting:', error);
        return null;
    }
}

const payload = "OGc9ITEsOjAmbm4hIDQpc3IyKytTEghPYTA9MSBtZTh3JTB3aGN9fXx0PyxXQlxVLiBsbnAuOy48InZ5cC8jMjIkL30IEnNQLiwgPSE7LSIxIyZ3fmMtLzU6JjZWXxAOYRYnJyYqMiJ3YHYnPS0pfWp0KztfWVxdMDE8NTYgLWEoMSk=";

console.log('Original payload:', payload);
const decrypted = simpleDecrypt(payload);
console.log('Decrypted:', decrypted);

if (decrypted) {
    try {
        const parsed = JSON.parse(decrypted);
        console.log('Parsed JSON:', JSON.stringify(parsed, null, 2));
    } catch (e) {
        console.log('Failed to parse as JSON:', e.message);
    }
}