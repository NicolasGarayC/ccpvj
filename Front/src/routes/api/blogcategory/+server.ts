import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { BACKEND_API_URL } from '$lib/config/backend';

const BACKEND_URL = BACKEND_API_URL;

export const GET: RequestHandler = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/blogcategory`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    const data = await response.json();
    return json(data);
  } catch (error) {
    console.error('Error fetching blog categories:', error);
    return json({ error: 'Failed to fetch blog categories' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const session = locals.session;
    if (!session?.userId) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const categoryData = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/blogcategory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // No Authorization header needed for session-based auth
      },
      body: JSON.stringify(categoryData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Backend error: ${response.status}`);
    }

    const data = await response.json();
    return json(data);
  } catch (error) {
    console.error('Error creating blog category:', error);
    return json({ error: error instanceof Error ? error.message : 'Failed to create blog category' }, { status: 500 });
  }
};