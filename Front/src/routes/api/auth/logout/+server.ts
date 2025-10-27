import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { BACKEND_API_URL } from '$lib/config/backend';

const AUTH_ENDPOINT = `${BACKEND_API_URL}/auth/logout`;

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Get the Authorization header from the request
		const authHeader = request.headers.get('authorization');

		// Forward the request to the backend
		const backendResponse = await fetch(AUTH_ENDPOINT, {
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
