import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const BACKEND_URL = 'http://localhost:5000'; // Ajusta según tu configuración

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

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const token = cookies.get('session');
    if (!token) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const categoryData = await request.json();
    
    const response = await fetch(`${BACKEND_URL}/api/blogcategory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
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