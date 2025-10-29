import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { BACKEND_API_URL } from '$lib/config/backend';

const BACKEND_URL = BACKEND_API_URL;

export const GET: RequestHandler = async ({ params }) => {
  try {
    const { slug } = params;
    
    const response = await fetch(`${BACKEND_URL}/api/blog/slug/${slug}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
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
    console.error('Error fetching blog post by slug:', error);
    return json({ error: 'Failed to fetch blog post' }, { status: 500 });
  }
};