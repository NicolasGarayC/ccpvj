import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const refreshToken = cookies.get('refreshToken');
		
		if (refreshToken) {
			// Hacer petición al backend .NET para logout
			try {
				await fetch('https://localhost:5251/api/auth/logout', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ RefreshToken: refreshToken })
				});
			} catch (error) {
				console.error('Backend logout error:', error);
			}
		}

		// Limpiar cookies independientemente del resultado del backend
		cookies.delete('refreshToken', { path: '/' });
		cookies.delete('sessionToken', { path: '/' });

		return json({ success: true, message: 'Sesión cerrada correctamente' });

	} catch (error) {
		console.error('Logout proxy error:', error);
		return json({ success: true, message: 'Sesión cerrada correctamente' }); // Siempre exitoso para logout
	}
};