import { redirect } from '@sveltejs/kit';

// Demo session data
// In real projects, this should come from database / JWT / Firebase / Supabase etc.
const users = {
	'student-token': {
		id: 1,
		name: 'John Doe',
		role: 'student'
	},
	'admin-token': {
		id: 2,
		name: 'Admin User',
		role: 'admin'
	}
};

export const handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get('session');

	// Authentication: Who is the user?
	if (sessionToken && users[sessionToken]) {
		event.locals.user = users[sessionToken];
	} else {
		event.locals.user = null;
	}

	const path = event.url.pathname;

	// Protected routes
	if (path.startsWith('/dashboard')) {
		if (!event.locals.user) {
			throw redirect(303, '/login');
		}
	}

	// Admin-only routes
	if (path.startsWith('/fileUpload')) {
		if (!event.locals.user) {
			throw redirect(303, '/login');
		}
	}

	if (path.startsWith('/admin')) {
		if (!event.locals.user) {
			throw redirect(303, '/login');
		}
		if (event.locals.user.role !== 'admin') {
			return new Response('Access Denied: Admins only', {
				status: 403
			});
		}
	}

	return await resolve(event);
};