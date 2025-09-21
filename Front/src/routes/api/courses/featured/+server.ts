import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const BACKEND_URL = 'http://localhost:5251/api';

export const GET: RequestHandler = async ({ url, request }) => {
	try {
		const count = url.searchParams.get('count') || '6';

		const response = await fetch(`${BACKEND_URL}/courses/featured?count=${count}`, {
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
		console.error('Error fetching featured courses:', err);
		return error(500, 'Internal server error');
	}
};