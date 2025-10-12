import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Stub endpoint to replace deleted post-elements functionality
// This allows the frontend to work while we transition to the simplified WorkItem structure

export const GET: RequestHandler = async ({ url }) => {
	// Return empty array for element requests
	return json({
		success: true,
		data: {
			elements: []
		}
	});
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		// Return a stub successful response for element creation
		const stubElement = {
			id: `stub-${Date.now()}`,
			postId: body.postId || 'unknown',
			elementType: body.elementType || 'text',
			content: body.content || '',
			filePath: body.filePath || null,
			fileName: body.fileName || null,
			fileSize: body.fileSize || 0,
			mimeType: body.mimeType || 'text/plain',
			orderNumber: body.orderNumber || 0,
			metadata: body.metadata || null,
			createdAt: new Date(),
			updatedAt: null
		};

		return json({
			success: true,
			data: {
				element: stubElement
			}
		});
	} catch (error) {
		return json({
			success: false,
			message: 'Error in stub endpoint'
		}, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ request }) => {
	// Return success for updates
	return json({
		success: true,
		message: 'Element updated successfully (stub)'
	});
};

export const DELETE: RequestHandler = async ({ request }) => {
	// Return success for deletions
	return json({
		success: true,
		message: 'Element deleted successfully (stub)'
	});
};