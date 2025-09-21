import type { RequestEvent } from '@sveltejs/kit';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase64url, encodeHexLowerCase } from '@oslojs/encoding';

const DAY_IN_MS = 1000 * 60 * 60 * 24;
const BACKEND_URL = 'http://localhost:5251/api';

export const sessionCookieName = 'auth-session';

// Keep utility functions that don't require DB
export function generateSessionToken() {
	const bytes = crypto.getRandomValues(new Uint8Array(18));
	const token = encodeBase64url(bytes);
	return token;
}

// Simplified session creation - delegate to backend
export async function createSession(token: string, userId: string) {
	// Return a mock session object for compatibility
	// Real session management now happens in the backend
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	return {
		id: sessionId,
		userId,
		expiresAt: new Date(Date.now() + DAY_IN_MS * 30)
	};
}

// Validate session through backend instead of direct DB access
export async function validateSessionToken(token: string) {
	try {
		// Call backend to validate the session
		const response = await fetch(`${BACKEND_URL}/auth/me`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Cookie': `auth-session=${token}`
			},
			credentials: 'include'
		});

		if (!response.ok) {
			return { session: null, user: null };
		}

		const data = await response.json();

		if (data.success && data.data?.user) {
			// Convert backend response to expected format
			const user = {
				id: data.data.user.idUsuario,
				username: data.data.user.nombreUsuario,
				nombre: data.data.user.nombre,
				apellido: data.data.user.apellido,
				telefono: data.data.user.telefono || '',
				role: data.data.user.nombreRol
			};

			const session = {
				id: encodeHexLowerCase(sha256(new TextEncoder().encode(token))),
				userId: user.id,
				expiresAt: new Date(Date.now() + DAY_IN_MS * 30)
			};

			return { session, user };
		}

		return { session: null, user: null };
	} catch (error) {
		console.error('Error validating session with backend:', error);
		return { session: null, user: null };
	}
}

export type SessionValidationResult = Awaited<ReturnType<typeof validateSessionToken>>;

// Simplified session invalidation - backend handles the real work
export async function invalidateSession(sessionId: string) {
	try {
		await fetch(`${BACKEND_URL}/auth/logout`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			credentials: 'include'
		});
	} catch (error) {
		console.error('Error invalidating session with backend:', error);
	}
}

// Keep cookie utility functions
export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date) {
	event.cookies.set(sessionCookieName, token, {
		expires: expiresAt,
		path: '/'
	});
}

export function deleteSessionTokenCookie(event: RequestEvent) {
	event.cookies.delete(sessionCookieName, {
		path: '/'
	});
}

// Legacy compatibility function
export async function validateSession(sessionToken: string) {
	return validateSessionToken(sessionToken);
}