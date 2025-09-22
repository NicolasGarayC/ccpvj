import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		console.log('[DEBUG] Login endpoint called');

		const { username, password } = await request.json();
		console.log(`[DEBUG] Request data - username: ${username}, password: ${password ? '[PROVIDED]' : '[MISSING]'}`);

		if (!username || !password) {
			console.log('[DEBUG] Missing credentials');
			return json(
				{ success: false, message: 'Username and password are required' },
				{ status: 400 }
			);
		}

		const requestBody = JSON.stringify({ username, password });
		console.log(`[DEBUG] Request body to backend: ${requestBody}`);

		// Forward the request to the backend
		console.log('[DEBUG] Attempting to connect to backend at http://localhost:5251/api/auth/login');

		const backendResponse = await fetch('http://localhost:5251/api/auth/login', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: requestBody
		});

		console.log(`[DEBUG] Backend response status: ${backendResponse.status}`);
		console.log(`[DEBUG] Backend response headers:`, Object.fromEntries(backendResponse.headers.entries()));
		console.log(`[DEBUG] Backend response ok: ${backendResponse.ok}`);

		// Check if response has content
		const responseText = await backendResponse.text();
		console.log(`[DEBUG] Backend response text length: ${responseText.length}`);
		console.log(`[DEBUG] Backend response text:`, responseText);

		// Handle different status codes
		if (backendResponse.status === 404) {
			console.log('[DEBUG] Backend returned 404 - endpoint not found');
			return json(
				{ success: false, message: 'Authentication service unavailable (404)' },
				{ status: 503 }
			);
		}

		if (backendResponse.status === 500) {
			console.log('[DEBUG] Backend returned 500 - internal server error');
			return json(
				{ success: false, message: 'Backend server error (500)' },
				{ status: 500 }
			);
		}

		if (!responseText || responseText.trim() === '') {
			console.log('[DEBUG] Empty response from backend');
			return json(
				{ success: false, message: 'Empty response from backend' },
				{ status: 502 }
			);
		}

		let data;
		try {
			data = JSON.parse(responseText);
			console.log(`[DEBUG] Parsed backend response:`, data);
		} catch (parseError) {
			console.error('[DEBUG] JSON parse error:', parseError);
			console.error('[DEBUG] Response text that failed to parse:', responseText);
			return json(
				{ success: false, message: 'Invalid JSON response from server', rawResponse: responseText },
				{ status: 502 }
			);
		}

		console.log(`[DEBUG] Returning response with status ${backendResponse.status}`);

		// Return the response from backend
		return json(data, { status: backendResponse.status });

	} catch (error) {
		console.error('[DEBUG] Login endpoint error:', error);
		console.error('[DEBUG] Error details:', {
			name: error.name,
			message: error.message,
			stack: error.stack
		});

		// Check if it's a network error
		if (error.code === 'ECONNREFUSED' || error.message.includes('fetch')) {
			console.log('[DEBUG] Network error - backend might be down');
			return json(
				{ success: false, message: 'Cannot connect to authentication server', errorType: 'NETWORK_ERROR' },
				{ status: 503 }
			);
		}

		return json(
			{ success: false, message: 'Error interno del servidor', errorDetails: error.message },
			{ status: 500 }
		);
	}
};