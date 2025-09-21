import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const BACKEND_URL = 'http://localhost:5251/api';

export const GET: RequestHandler = async ({ params, request }) => {
	try {
		const courseId = params.id;

		const response = await fetch(`${BACKEND_URL}/courses/${courseId}`, {
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
		console.error('Error fetching course:', err);
		return error(500, 'Internal server error');
	}
};

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const courseId = params.id;
		const body = await request.json();

		const response = await fetch(`${BACKEND_URL}/courses/${courseId}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				// Forward any cookies from the frontend to the backend
				'Cookie': request.headers.get('cookie') || ''
			},
			body: JSON.stringify(body),
			credentials: 'include'
		});

		if (!response.ok) {
			const errorText = await response.text();
			return error(response.status, errorText || 'Backend error');
		}

		const data = await response.json();
		return json(data);

	} catch (err) {
		console.error('Error updating course:', err);
		return error(500, 'Internal server error');
	}
};

export const DELETE: RequestHandler = async ({ params, request }) => {
	try {
		const courseId = params.id;

		const response = await fetch(`${BACKEND_URL}/courses/${courseId}`, {
			method: 'DELETE',
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
		console.error('Error deleting course:', err);
		return error(500, 'Internal server error');
	}
};