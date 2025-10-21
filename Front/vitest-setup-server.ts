import { vi } from 'vitest';

// Mock de módulos de SvelteKit
vi.mock('$app/environment', () => ({
	browser: false,
	dev: true,
	building: false,
	version: 'test'
}));

vi.mock('$app/navigation', () => ({
	goto: vi.fn(),
	invalidate: vi.fn(),
	invalidateAll: vi.fn(),
	preloadData: vi.fn(),
	preloadCode: vi.fn(),
	beforeNavigate: vi.fn(),
	afterNavigate: vi.fn()
}));

vi.mock('$app/stores', () => ({
	page: {
		subscribe: vi.fn()
	},
	navigating: {
		subscribe: vi.fn()
	},
	updated: {
		subscribe: vi.fn()
	}
}));

vi.mock('$lib/stores/authStore', () => ({
	authModalStore: {
		subscribe: vi.fn(),
		set: vi.fn(),
		update: vi.fn()
	}
}));

vi.mock('$env/dynamic/public', () => ({
	env: {
		PUBLIC_BACKEND_BASE_URL: 'http://localhost:5251'
	}
}));

vi.mock('$lib/config/backend', () => ({
	BACKEND_BASE_URL: 'http://localhost:5251',
	BACKEND_API_URL: 'http://localhost:5251/api'
}));

// Mock de localStorage para Node environment
const localStorageMock = (() => {
	let store: Record<string, string> = {};

	return {
		getItem: (key: string) => store[key] || null,
		setItem: (key: string, value: string) => {
			store[key] = value.toString();
		},
		removeItem: (key: string) => {
			delete store[key];
		},
		clear: () => {
			store = {};
		}
	};
})();

global.localStorage = localStorageMock as any;

// Mock de fetch con response completo
if (!global.fetch) {
	global.fetch = vi.fn((url, options) =>
		Promise.resolve({
			ok: true,
			status: 200,
			statusText: 'OK',
			headers: {
				get: (name: string) => {
					if (name === 'content-type') return 'application/json';
					if (name === 'content-length') return '100';
					return null;
				}
			},
			json: () => Promise.resolve({}),
			text: () => Promise.resolve(''),
			blob: () => Promise.resolve(new Blob()),
			arrayBuffer: () => Promise.resolve(new ArrayBuffer(0))
		} as any)
	);
}

// Mock console para tests más limpios (opcional)
global.console = {
	...console,
	error: vi.fn(),
	warn: vi.fn()
};
