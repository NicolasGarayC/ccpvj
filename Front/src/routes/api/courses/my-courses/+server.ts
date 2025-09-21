import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const BACKEND_URL = 'http://localhost:5251/api';

export const GET: RequestHandler = async ({ request }) => {
	try {
		const response = await fetch(`${BACKEND_URL}/courses/my-courses`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Cookie': request.headers.get('cookie') || ''
			},
			credentials: 'include'
		});

		if (!response.ok) {
			const errorText = await response.text();
			return error(response.status, errorText || 'Backend error');
		}

		const data = await response.json();
		return json(data);

	} catch (err) {
		console.error('Error fetching my courses:', err);
		return error(500, 'Internal server error');
	}
};