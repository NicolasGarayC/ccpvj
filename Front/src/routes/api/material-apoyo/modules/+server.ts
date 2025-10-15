import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { BACKEND_API_URL } from '$lib/config/backend';

const BACKEND_URL = BACKEND_API_URL;

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		const response = await fetch(`${BACKEND_URL}/materialapoyo/modules`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Cookie': request.headers.get('cookie') || ''
			},
			body: JSON.stringify(body),
			credentials: 'include'
		});

		if (!response.ok) {
			const errorData = await response.text();
			return error(response.status, errorData || 'Backend error');
		}

		const data = await response.json();
		return json(data);

	} catch (err) {
		console.error('Error creating module:', err);
		return error(500, 'Internal server error');
	}
};
