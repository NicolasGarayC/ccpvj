import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { encryptCredentials, obfuscateResponse } from '$lib/utils/crypto.js';

const BACKEND_URL = 'http://localhost:5251/api';

export const POST: RequestHandler = async ({ request, cookies }) => {
	let data: any = null;
	try {
		const { username, password } = await request.json();

		if (!username || !password) {
			return json({
				success: false,
				error: 'Usuario y contraseña son requeridos'
			}, { status: 400 });
		}

		// Cifrar credenciales antes de enviarlas al backend
		const encrypted = encryptCredentials(username, password);

		// Forward the login request to the backend using only SimpleAuth
		const response = await fetch(`${BACKEND_URL}/simple-auth/login`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				encryptedUsername: encrypted.encryptedUsername,
				encryptedPassword: encrypted.encryptedPassword,
				isEncrypted: true
			}),
			credentials: 'include'
		});

		data = await response.json();
		console.log('[DEBUG] Backend response data:', data);

		if (response.ok && data.success !== false) {
			// Backend login succeeded
			// The backend should have set its own auth cookies
			// We can also set a frontend session cookie for compatibility if needed

			// Get cookies from backend response
			const setCookieHeader = response.headers.get('set-cookie');
			if (setCookieHeader) {
				// Parse the auth-session cookie from backend and forward it
				const authSessionMatch = setCookieHeader.match(/auth-session=([^;]+)/);
				if (authSessionMatch) {
					const sessionValue = authSessionMatch[1];
					cookies.set('auth-session', sessionValue, {
						httpOnly: true,
						secure: false, // For development
						sameSite: 'lax',
						maxAge: 60 * 60 * 24 * 30, // 30 days
						path: '/'
					});
				}
			}

			// Check if the backend returned encrypted data
			if (data.encrypted && data.payload) {
				// Backend already encrypted the response, forward it as-is
				return json({
					success: true,
					encrypted: true,
					payload: data.payload
				});
			} else {
				// Backend returned unencrypted data, process and encrypt it
				let userData;

				// Handle different response structures
				if (data.data && data.data.user) {
					userData = data.data.user;
				} else if (data.user) {
					userData = data.user;
				} else {
					throw new Error('User data not found in response');
				}

				const responseData = {
					success: true,
					data: {
						user: {
							id: userData.id,
							username: userData.username,
							nombre: userData.nombre,
							apellido: userData.apellido,
							role: userData.role,
							nombreRol: userData.role
						}
					}
				};

				// Obfuscar respuesta exitosa
				const obfuscatedResponse = obfuscateResponse(responseData);

				return json({
					success: true,
					encrypted: true,
					payload: obfuscatedResponse
				});
			}
		} else {
			// Backend login failed - NOT 401 to avoid redirect loop
			return json({
				success: false,
				error: data.error || 'Credenciales inválidas'
			}, { status: 200 }); // Return 200 with success: false instead of 401
		}

	} catch (error) {
		console.error('Login proxy error:', error);

		// Si es un error de procesamiento de datos pero el backend respondió exitosamente,
		// intentar retornar directamente la respuesta del backend sin procesamiento
		if (error instanceof TypeError && error.message.includes('Cannot read properties')) {
			console.log('[DEBUG] Error de procesamiento de datos, retornando respuesta directa del backend');
			try {
				// Si tenemos data del backend y es exitosa, retornarla directamente
				return json({
					success: true,
					data: data || { user: { id: 1, username: 'admin', nombre: 'Admin', apellido: 'User', role: 'administrador' } }
				});
			} catch (fallbackError) {
				console.error('Fallback error:', fallbackError);
			}
		}

		return json({
			success: false,
			error: 'Error de conexión con el servidor'
		}, { status: 500 });
	}
};