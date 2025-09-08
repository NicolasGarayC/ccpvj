import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Proxy al backend .NET para mantener compatibilidad
export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const { username, password } = await request.json();

		if (!username || !password) {
			return json({ error: 'Usuario y contraseña son requeridos' }, { status: 400 });
		}

		// Hacer petición al backend .NET
		const backendResponse = await fetch('https://localhost:5251/api/auth/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				NombreUsuario: username,
				Contrasena: password
			})
		});

		if (!backendResponse.ok) {
			const errorText = await backendResponse.text();
			return json({ 
				success: false,
				error: errorText || 'Credenciales inválidas' 
			}, { status: backendResponse.status });
		}

		const authResponse = await backendResponse.json();
		
		// Establecer cookie con el refresh token para seguridad
		cookies.set('refreshToken', authResponse.refreshToken, {
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			maxAge: 7 * 24 * 60 * 60, // 7 días
			path: '/'
		});

		// Devolver respuesta en formato esperado por el frontend
		return json({
			success: true,
			data: authResponse
		});

	} catch (error) {
		console.error('Login proxy error:', error);
		return json({ 
			success: false,
			error: 'Error de conexión con el servidor' 
		}, { status: 500 });
	}
};