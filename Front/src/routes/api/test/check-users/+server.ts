import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { sql } from 'drizzle-orm';

export const GET: RequestHandler = async () => {
  try {
    const users = await db.all(sql`SELECT id, username, nombre, apellido, role FROM user LIMIT 10`);
    return json({
      success: true,
      users
    });
  } catch (err) {
    return json({
      success: false,
      error: err.toString(),
      users: []
    });
  }
};