import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const BACKEND_URL = 'http://localhost:5251/api';

export const GET: RequestHandler = async ({ request }) => {
	try {
		// Get the Authorization header from the request (optional for public access)
		const authHeader = request.headers.get('authorization');

		const response = await fetch(`${BACKEND_URL}/digitallibrary/collections`, {
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
		console.error('Error fetching library collections:', err);
		return error(500, 'Internal server error');
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Get the Authorization header from the request
		const authHeader = request.headers.get('authorization');

		if (!authHeader) {
			return error(401, 'No token provided');
		}

		// Get the request body
		const body = await request.json();

		// Forward the request to the backend
		const response = await fetch(`${BACKEND_URL}/digitallibrary/collections`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: authHeader
			},
			body: JSON.stringify(body)
		});

		if (!response.ok) {
			const errorData = await response.text();
			return error(response.status, errorData || 'Backend error');
		}

		const data = await response.json();
		return json(data);

	} catch (err) {
		console.error('Error creating library collection:', err);
		return error(500, 'Internal server error');
	}
};