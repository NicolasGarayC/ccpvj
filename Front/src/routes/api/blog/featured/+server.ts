import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { BACKEND_API_URL } from '$lib/config/backend';

const BACKEND_URL = BACKEND_API_URL;

export const GET: RequestHandler = async ({ url }) => {
  try {
    const count = url.searchParams.get('count') || '5';
    
    const response = await fetch(`${BACKEND_URL}/api/blog/featured?count=${count}`, {
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
    console.error('Error fetching featured blog posts:', error);
    return json({ error: 'Failed to fetch featured blog posts' }, { status: 500 });
  }
};