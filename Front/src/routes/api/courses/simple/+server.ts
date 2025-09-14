import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { course } from '$lib/server/db/schema';

export const GET: RequestHandler = async () => {
  try {
    // Query simple sin JOINs
    const courses = await db.select().from(course);

    return json(courses);

  } catch (err) {
    console.error('Error fetching courses (simple):', err);
    return error(500, `Error: ${err}`);
  }
};