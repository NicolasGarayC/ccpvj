import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { BACKEND_API_URL } from '$lib/config/backend';

const BACKEND_URL = BACKEND_API_URL;

export const GET: RequestHandler = async ({ url, request }) => {
	try {
		// Get the Authorization header from the request (optional for public access)
		const authHeader = request.headers.get('authorization');

		// Forward all query parameters to the backend
		const searchParams = url.searchParams.toString();
		const backendUrl = `${BACKEND_URL}/digitallibrary/items${searchParams ? `?${searchParams}` : ''}`;

		const headers: Record<string, string> = {
			'Content-Type': 'application/json'
		};
		if (authHeader) {
			headers.Authorization = authHeader;
		}

		const response = await fetch(backendUrl, {
			method: 'GET',
			headers
		});

		if (!response.ok) {
			const errorText = await response.text();
			return error(response.status, errorText || 'Backend error');
		}

		const data = await response.json();
		return json(data);

	} catch (err) {
		console.error('Error fetching library items:', err);
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
		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
			Authorization: authHeader
		};

		const response = await fetch(`${BACKEND_URL}/digitallibrary/items`, {
			method: 'POST',
			headers,
			body: JSON.stringify(body)
		});

		if (!response.ok) {
			const errorData = await response.text();
			return error(response.status, errorData || 'Backend error');
		}

		const data = await response.json();
		return json(data);

	} catch (err) {
		console.error('Error creating library item:', err);
		return error(500, 'Internal server error');
	}
};
