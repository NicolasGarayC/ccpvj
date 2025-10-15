import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { BACKEND_API_URL } from '$lib/config/backend';

const BACKEND_URL = BACKEND_API_URL;

export const GET: RequestHandler = async ({ params, request }) => {
	try {
		// Get the Authorization header from the request
		const authHeader = request.headers.get('authorization');

		if (!authHeader) {
			return error(401, 'No token provided');
		}

		const { id } = params;
		const response = await fetch(`${BACKEND_URL}/digitallibrary/items/${id}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: authHeader
			}
		});

		if (!response.ok) {
			const errorText = await response.text();
			return error(response.status, errorText || 'Backend error');
		}

		const data = await response.json();
		return json(data);

	} catch (err) {
		console.error('Error fetching library item:', err);
		return error(500, 'Internal server error');
	}
};

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		// Get the Authorization header from the request
		const authHeader = request.headers.get('authorization');

		if (!authHeader) {
			return error(401, 'No token provided');
		}

		const { id } = params;
		const body = await request.json();

		const response = await fetch(`${BACKEND_URL}/digitallibrary/items/${id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: authHeader
			},
			body: JSON.stringify(body)
		});

		if (!response.ok) {
			const errorText = await response.text();
			return error(response.status, errorText || 'Backend error');
		}

		// PUT typically returns 204 No Content for updates
		if (response.status === 204) {
			return new Response(null, { status: 204 });
		}

		const data = await response.json();
		return json(data);

	} catch (err) {
		console.error('Error updating library item:', err);
		return error(500, 'Internal server error');
	}
};

export const DELETE: RequestHandler = async ({ params, request }) => {
	try {
		// Get the Authorization header from the request
		const authHeader = request.headers.get('authorization');

		if (!authHeader) {
			return error(401, 'No token provided');
		}

		const { id } = params;
		const response = await fetch(`${BACKEND_URL}/digitallibrary/items/${id}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				Authorization: authHeader
			}
		});

		if (!response.ok) {
			const errorText = await response.text();
			return error(response.status, errorText || 'Backend error');
		}

		// DELETE typically returns 204 No Content
		if (response.status === 204) {
			return new Response(null, { status: 204 });
		}

		const data = await response.json();
		return json(data);

	} catch (err) {
		console.error('Error deleting library item:', err);
		return error(500, 'Internal server error');
	}
};
