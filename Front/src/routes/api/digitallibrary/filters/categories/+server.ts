import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { BACKEND_API_URL } from '$lib/config/backend';

const BACKEND_URL = BACKEND_API_URL;

export const GET: RequestHandler = async ({ request }) => {
	try {
		// Get the Authorization header from the request (optional for public access)
		const authHeader = request.headers.get('authorization');

		const response = await fetch(`${BACKEND_URL}/digitallibrary/filters/categories`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				...(authHeader && { Authorization: authHeader })
			}
		});

		if (!response.ok) {
			const errorText = await response.text();
			return error(response.status, errorText || 'Backend error');
		}

		const data = await response.json();
		return json(data);

	} catch (err) {
		console.error('Error fetching available categories:', err);
		return error(500, 'Internal server error');
	}
};
