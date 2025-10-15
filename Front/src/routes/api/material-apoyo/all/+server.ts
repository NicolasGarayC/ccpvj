import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { BACKEND_API_URL } from '$lib/config/backend';

const BACKEND_URL = BACKEND_API_URL;

export const GET: RequestHandler = async ({ request }) => {
	try {
		const response = await fetch(`${BACKEND_URL}/materialapoyo/all`, {
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
		console.error('Error fetching all material de apoyo:', err);
		return error(500, 'Internal server error');
	}
};
