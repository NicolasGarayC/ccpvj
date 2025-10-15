import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { BACKEND_API_URL } from '$lib/config/backend';

const BACKEND_URL = BACKEND_API_URL;

export const GET: RequestHandler = async ({ url, request }) => {
  try {
    const searchParams = url.searchParams;
    const queryString = searchParams.toString();

    const response = await fetch(`${BACKEND_URL}/blog?${queryString}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || ''
      },
      credentials: 'include'
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

export const POST: RequestHandler = async ({ request }) => {
  try {
    const postData = await request.json();

    const response = await fetch(`${BACKEND_URL}/blog`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('authorization') || '',
        'Cookie': request.headers.get('cookie') || ''
      },
      body: JSON.stringify(postData),
      credentials: 'include'
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
