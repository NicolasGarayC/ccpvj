import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const body = await request.json();
		const refreshToken = body.RefreshToken || cookies.get('refreshToken');
		
		if (!refreshToken) {
			return json({ 
				success: false,
				error: 'Refresh token no encontrado' 
			}, { status: 401 });
		}

		// Hacer petición al backend .NET
		const backendResponse = await fetch('https://localhost:5251/api/auth/refresh', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ RefreshToken: refreshToken })
		});

		if (!backendResponse.ok) {
			// Limpiar cookies si el refresh token es inválido
			cookies.delete('refreshToken', { path: '/' });
			const errorText = await backendResponse.text();
			return json({ 
				success: false,
				error: errorText || 'Token inválido' 
			}, { status: backendResponse.status });
		}

		const authResponse = await backendResponse.json();
		
		// Actualizar cookie con el nuevo refresh token
		cookies.set('refreshToken', authResponse.refreshToken, {
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			maxAge: 7 * 24 * 60 * 60, // 7 días
			path: '/'
		});

		return json({
			success: true,
			data: authResponse
		});

	} catch (error) {
		console.error('Refresh token proxy error:', error);
		return json({ 
			success: false,
			error: 'Error de conexión con el servidor' 
		}, { status: 500 });
	}
};