import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const BACKEND_URL = 'http://localhost:5251/api';

export const GET: RequestHandler = async ({ url, request }) => {
	try {
		// Forward all query parameters to the backend
		const searchParams = url.searchParams.toString();
		const backendUrl = `${BACKEND_URL}/course${searchParams ? `?${searchParams}` : ''}`;

		const response = await fetch(backendUrl, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				// Forward any cookies from the frontend to the backend
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
		console.error('Error fetching courses:', err);
		return error(500, 'Internal server error');
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Get the request body
		const body = await request.json();

		// Forward the request to the backend
		const response = await fetch(`${BACKEND_URL}/course`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				// Forward any cookies from the frontend to the backend
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
		console.error('Error creating course:', err);
		return error(500, 'Internal server error');
	}
};