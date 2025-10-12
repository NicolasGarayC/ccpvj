import type { Handle } from '@sveltejs/kit';
// import { paraglideMiddleware } from '$lib/paraglide/server';

// TODO: Re-enable paraglide middleware when internationalization is implemented
// const handleParaglide: Handle = ({ event, resolve }) =>
// 	paraglideMiddleware(event.request, ({ request, locale }) => {
// 		event.request = request;

// 		return resolve(event, {
// 			transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale)
// 		});
// 	});

// Auth middleware will be added here when JWT is implemented

// Temporary simple handle until paraglide is set up
export const handle: Handle = async ({ event, resolve }) => {
	return resolve(event);
};
