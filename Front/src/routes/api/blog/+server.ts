import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const BACKEND_URL = 'http://localhost:5000'; // Ajusta según tu configuración

export const GET: RequestHandler = async ({ url, cookies }) => {
  try {
    const searchParams = url.searchParams;
    const queryString = searchParams.toString();
    
    const response = await fetch(`${BACKEND_URL}/api/blog?${queryString}`, {
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
    console.error('Error fetching blog posts:', error);
    return json({ error: 'Failed to fetch blog posts' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const session = locals.session;
    if (!session?.userId) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const postData = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/blog`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // No need for Authorization header - using session-based auth
      },
      body: JSON.stringify(postData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Backend error: ${response.status}`);
    }

    const data = await response.json();
    return json(data);
  } catch (error) {
    console.error('Error creating blog post:', error);
    return json({ error: error instanceof Error ? error.message : 'Failed to create blog post' }, { status: 500 });
  }
};