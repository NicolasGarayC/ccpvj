import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Get the Authorization header from the request
		const authHeader = request.headers.get('authorization');

		// Forward the request to the backend
		const backendResponse = await fetch('http://localhost:5251/api/auth/logout', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(authHeader && { Authorization: authHeader })
			}
		});

		const data = await backendResponse.json();

		// Return the response from backend
		return json(data, { status: backendResponse.status });

	} catch (error) {
		console.error('Logout endpoint error:', error);
		return json(
			{ success: false, message: 'Error interno del servidor' },
			{ status: 500 }
		);
	}
};