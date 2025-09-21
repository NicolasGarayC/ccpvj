// Utilidad de cifrado simple para proteger credenciales en tránsito
// Cifrado Base64 + XOR simple y confiable

const ENCRYPTION_KEY = 'CENTRO_CULTURAL_PVJ_2024';

export function simpleEncrypt(text: string): string {
	try {
		let result = '';
		// Aplicar XOR directamente a cada carácter
		for (let i = 0; i < text.length; i++) {
			const charCode = text.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
			result += String.fromCharCode(charCode);
		}
		// Convertir a Base64
		return btoa(result);
	} catch (error) {
		console.error('Error encrypting:', error);
		return btoa(text); // Fallback a base64 simple
	}
}

export function simpleDecrypt(encryptedText: string): string {
	try {
		// Decodificar de Base64
		const decoded = atob(encryptedText);
		let result = '';

		// Aplicar XOR inverso
		for (let i = 0; i < decoded.length; i++) {
			const charCode = decoded.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
			result += String.fromCharCode(charCode);
		}

		return result;
	} catch (error) {
		console.error('Error decrypting:', error);
		try {
			return atob(encryptedText); // Fallback a base64 simple
		} catch {
			return encryptedText; // Si todo falla, devolver texto original
		}
	}
}

// Función para obfuscar respuestas JSON
export function obfuscateResponse(data: any): string {
	const jsonString = JSON.stringify(data);
	return simpleEncrypt(jsonString);
}

// Función para desobfuscar respuestas JSON
export function deobfuscateResponse(obfuscatedData: string): any {
	try {
		const jsonString = simpleDecrypt(obfuscatedData);
		return JSON.parse(jsonString);
	} catch (error) {
		console.error('Error deobfuscating response:', error);
		return null;
	}
}

// Función específica para cifrar credenciales de login
export function encryptCredentials(username: string, password: string): {
	encryptedUsername: string,
	encryptedPassword: string
} {
	return {
		encryptedUsername: simpleEncrypt(username),
		encryptedPassword: simpleEncrypt(password)
	};
}

// Función para descifrar credenciales de login
export function decryptCredentials(encryptedUsername: string, encryptedPassword: string): {
	username: string,
	password: string
} {
	return {
		username: simpleDecrypt(encryptedUsername),
		password: simpleDecrypt(encryptedPassword)
	};
}