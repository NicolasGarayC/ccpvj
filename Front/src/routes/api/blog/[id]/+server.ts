import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const BACKEND_URL = 'http://localhost:5251/api';

export const GET: RequestHandler = async ({ params, request }) => {
  try {
    const { id } = params;

    const response = await fetch(`${BACKEND_URL}/article/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || ''
      },
      credentials: 'include'
    });

    if (!response.ok) {
      if (response.status === 404) {
        return json({ error: 'Blog post not found' }, { status: 404 });
      }
      throw new Error(`Backend error: ${response.status}`);
    }

    const data = await response.json();
    return json(data);
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return json({ error: 'Failed to fetch blog post' }, { status: 500 });
  }
};

export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const { id } = params;
    const postData = await request.json();

    const response = await fetch(`${BACKEND_URL}/article/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || ''
      },
      body: JSON.stringify(postData),
      credentials: 'include'
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 404) {
        return json({ error: 'Blog post not found' }, { status: 404 });
      }
      if (response.status === 403) {
        return json({ error: 'Forbidden' }, { status: 403 });
      }
      throw new Error(errorText || `Backend error: ${response.status}`);
    }

    const data = await response.json();
    return json(data);
  } catch (error) {
    console.error('Error updating blog post:', error);
    return json({ error: error instanceof Error ? error.message : 'Failed to update blog post' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ params, request }) => {
  try {
    const { id } = params;

    const response = await fetch(`${BACKEND_URL}/article/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || ''
      },
      credentials: 'include'
    });

    if (!response.ok) {
      if (response.status === 404) {
        return json({ error: 'Blog post not found' }, { status: 404 });
      }
      if (response.status === 403) {
        return json({ error: 'Forbidden' }, { status: 403 });
      }
      throw new Error(`Backend error: ${response.status}`);
    }

    return json({ success: true });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return json({ error: 'Failed to delete blog post' }, { status: 500 });
  }
};