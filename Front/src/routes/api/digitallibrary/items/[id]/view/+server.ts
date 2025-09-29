import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const BACKEND_URL = 'http://localhost:5251/api';

export const POST: RequestHandler = async ({ params, request }) => {
	try {
		// Get the Authorization header from the request
		const authHeader = request.headers.get('authorization');

		if (!authHeader) {
			return error(401, 'No token provided');
		}

		const { id } = params;
		const response = await fetch(`${BACKEND_URL}/digitallibrary/items/${id}/view`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: authHeader
			}
		});

		if (!response.ok) {
			const errorText = await response.text();
			return error(response.status, errorText || 'Backend error');
		}

		// POST typically returns 204 No Content for view count increment
		if (response.status === 204) {
			return new Response(null, { status: 204 });
		}

		const data = await response.json();
		return json(data);

	} catch (err) {
		console.error('Error incrementing view count:', err);
		return error(500, 'Internal server error');
	}
};