import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { BACKEND_API_URL } from '$lib/config/backend';

const AUTH_ENDPOINT = `${BACKEND_API_URL}/auth/validate`;

export const GET: RequestHandler = async ({ request }) => {
	try {
		// Get the Authorization header from the request
		const authHeader = request.headers.get('authorization');

		if (!authHeader) {
			return json(
				{ success: false, message: 'No token provided' },
				{ status: 401 }
			);
		}

		// Forward the request to the backend
		const backendResponse = await fetch(AUTH_ENDPOINT, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: authHeader
			}
		});

		const data = await backendResponse.json();

		// Return the response from backend
		return json(data, { status: backendResponse.status });

	} catch (error) {
		console.error('Validate endpoint error:', error);
		return json(
			{ success: false, message: 'Error interno del servidor' },
			{ status: 500 }
		);
	}
};
