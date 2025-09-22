import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

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
		const backendResponse = await fetch('http://localhost:5251/api/auth/validate', {
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