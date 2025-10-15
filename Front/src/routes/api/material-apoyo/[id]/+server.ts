import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { BACKEND_API_URL } from '$lib/config/backend';

const BACKEND_URL = BACKEND_API_URL;

export const GET: RequestHandler = async ({ params, request }) => {
	try {
		const response = await fetch(`${BACKEND_URL}/materialapoyo/${params.id}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Cookie': request.headers.get('cookie') || ''
			},
			credentials: 'include'
		});

		if (!response.ok) {
			const errorText = await response.text();
			return error(response.status, errorText || 'Material de apoyo not found');
		}

		const data = await response.json();
		return json(data);

	} catch (err) {
		console.error('Error fetching material de apoyo:', err);
		return error(500, 'Internal server error');
	}
};

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const body = await request.json();

		const response = await fetch(`${BACKEND_URL}/materialapoyo/${params.id}`, {
			method: 'PUT',
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

		return new Response(null, { status: 204 });

	} catch (err) {
		console.error('Error updating material de apoyo:', err);
		return error(500, 'Internal server error');
	}
};

export const DELETE: RequestHandler = async ({ params, request }) => {
	try {
		const response = await fetch(`${BACKEND_URL}/materialapoyo/${params.id}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				'Cookie': request.headers.get('cookie') || ''
			},
			credentials: 'include'
		});

		if (!response.ok) {
			const errorData = await response.text();
			return error(response.status, errorData || 'Backend error');
		}

		return new Response(null, { status: 204 });

	} catch (err) {
		console.error('Error deleting material de apoyo:', err);
		return error(500, 'Internal server error');
	}
};
